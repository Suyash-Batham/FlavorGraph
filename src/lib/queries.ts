import { query } from './neo4j';

export interface Ingredient {
  name: string;
  description: string;
  category: string;
}

export interface Pairing {
  name: string;
  category: string;
  strength: string;
  sharedFlavors: string[];
}

export interface FlavorBridge {
  ingredient: string;
  bridge: string;
  sharedFlavors: string[];
}

export interface PathStep {
  path: string[];
  hops: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'ingredient' | 'flavor' | 'dish';
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  strength?: string;
}

// All ingredients, ordered by category
export async function getAllIngredients(): Promise<Ingredient[]> {
  return query<Ingredient>(`
    MATCH (i:Ingredient)
    RETURN i.name AS name, i.description AS description, i.category AS category
    ORDER BY i.category, i.name
  `);
}

// Single ingredient with its flavors and dishes it appears in
export async function getIngredient(name: string) {
  const rows = await query<{
    name: string;
    description: string;
    category: string;
    flavors: string[];
    dishes: string[];
  }>(`
    MATCH (i:Ingredient {name: $name})
    OPTIONAL MATCH (i)-[:HAS_FLAVOR]->(f:Flavor)
    OPTIONAL MATCH (i)-[:USED_IN]->(d:Dish)
    RETURN
      i.name        AS name,
      i.description AS description,
      i.category    AS category,
      collect(DISTINCT f.name) AS flavors,
      collect(DISTINCT d.name) AS dishes
  `, { name });
  return rows[0] ?? null;
}

// Direct pairings + shared flavor tags
export async function getDirectPairings(name: string): Promise<Pairing[]> {
  return query<Pairing>(`
    MATCH (a:Ingredient {name: $name})-[r:PAIRS_WITH]-(b:Ingredient)
    OPTIONAL MATCH (a)-[:HAS_FLAVOR]->(f:Flavor)<-[:HAS_FLAVOR]-(b)
    RETURN
      b.name        AS name,
      b.category    AS category,
      r.strength    AS strength,
      collect(DISTINCT f.name) AS sharedFlavors
    ORDER BY
      CASE r.strength WHEN 'strong' THEN 0 WHEN 'moderate' THEN 1 ELSE 2 END,
      size(collect(DISTINCT f.name)) DESC
  `, { name });
}

// 2-hop flavor bridge: ingredients that share flavors with the target ingredient
// (but aren't already direct pairings) — this is what a relational DB would do
// with recursive CTEs; Cypher expresses it naturally.
export async function getFlavorBridges(name: string): Promise<FlavorBridge[]> {
  return query<FlavorBridge>(`
    MATCH (a:Ingredient {name: $name})-[:HAS_FLAVOR]->(f:Flavor)<-[:HAS_FLAVOR]-(b:Ingredient)
    WHERE a <> b
      AND NOT (a)-[:PAIRS_WITH]-(b)
    RETURN
      b.name        AS ingredient,
      f.name        AS bridge,
      collect(DISTINCT f.name) AS sharedFlavors
    ORDER BY size(collect(DISTINCT f.name)) DESC
    LIMIT 20
  `, { name });
}

// Shortest PAIRS_WITH path between two ingredients (multi-hop traversal)
export async function getFlavorPath(from: string, to: string): Promise<PathStep | null> {
  const rows = await query<{ path: string[]; hops: number }>(`
    MATCH p = shortestPath(
      (a:Ingredient {name: $from})-[:PAIRS_WITH*1..6]-(b:Ingredient {name: $to})
    )
    RETURN [n IN nodes(p) | n.name] AS path, length(p) AS hops
  `, { from, to });
  return rows[0] ?? null;
}

// Graph data for a neighbourhood around one ingredient (for visualisation)
export async function getNeighbourhood(name: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const rows = await query<{
    center: string;
    centerCategory: string;
    neighbour: string;
    neighbourCategory: string;
    relType: string;
    strength: string | null;
  }>(`
    MATCH (a:Ingredient {name: $name})-[r:PAIRS_WITH]-(b:Ingredient)
    RETURN
      a.name        AS center,
      a.category    AS centerCategory,
      b.name        AS neighbour,
      b.category    AS neighbourCategory,
      type(r)       AS relType,
      r.strength    AS strength
    LIMIT 30
  `, { name });

  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const row of rows) {
    if (!nodeMap.has(row.center)) {
      nodeMap.set(row.center, { id: row.center, label: row.center, type: 'ingredient' });
    }
    if (!nodeMap.has(row.neighbour)) {
      nodeMap.set(row.neighbour, { id: row.neighbour, label: row.neighbour, type: 'ingredient' });
    }
    edges.push({
      source: row.center,
      target: row.neighbour,
      label: row.relType,
      strength: row.strength ?? undefined,
    });
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

// Search ingredients by name prefix
export async function searchIngredients(q: string): Promise<Ingredient[]> {
  return query<Ingredient>(`
    MATCH (i:Ingredient)
    WHERE toLower(i.name) CONTAINS toLower($q)
    RETURN i.name AS name, i.description AS description, i.category AS category
    ORDER BY i.name
    LIMIT 12
  `, { q });
}

// Dishes that use a specific combination of ingredients (at least 2 matches)
export async function getDishesForIngredients(names: string[]): Promise<{ dish: string; cuisine: string; matched: string[] }[]> {
  return query<{ dish: string; cuisine: string; matched: string[] }>(`
    MATCH (i:Ingredient)-[:USED_IN]->(d:Dish)-[:BELONGS_TO]->(c:Cuisine)
    WHERE i.name IN $names
    WITH d, c, collect(i.name) AS matched
    WHERE size(matched) >= 1
    RETURN d.name AS dish, c.name AS cuisine, matched
    ORDER BY size(matched) DESC
    LIMIT 10
  `, { names });
}
