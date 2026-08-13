# Flavor Graph — Ingredient Pairing Explorer

> **CognoDB Take-Home Assignment** · A graph-database-backed web application that lets you explore ingredient flavor pairings, discover 2-hop flavor bridges, and find the shortest pairing path between any two ingredients.

**Live demo:**  https://flavor-graph-zeta.vercel.app/

**Security note:** Do NOT commit `./.env.local` or any file containing `COGNODB_URI`/`COGNODB_PASSWORD`. If you accidentally exposed credentials, rotate the CognoDB password immediately from the console before sharing the repo or demo link.

---

## Why a graph database?

Flavor pairing is fundamentally a graph problem. Each ingredient is a node; "pairs well with" is an edge. The interesting questions are all about connections:

| Question | SQL approach | Cypher approach |
|---|---|---|
| What pairs with Dark Chocolate? | Simple JOIN | Simple 1-hop MATCH |
| What ingredients share flavors with Dark Chocolate indirectly? | Recursive CTE or self-join chain | Natural 2-hop pattern |
| What's the shortest pairing path between Miso and Raspberry? | Recursive CTE, complex, slow | `shortestPath()` — built-in |
| Find all flavors of pairings-of-pairings | Multiple nested JOINs | Variable-length `*1..n` path |

Graph traversal is the primary operation — not filtering rows in a table. A relational schema would model this adequately for depth-1 queries, but multi-hop traversal and shortest-path become exponentially more complex. CognoDB (openCypher / Bolt protocol) expresses these naturally.

---

## Data model

```
(:Ingredient {name, description, category})
      │
      ├─[:HAS_FLAVOR]──────────► (:Flavor {name})
      │
      ├─[:PAIRS_WITH {strength}]─ (:Ingredient)   ← bidirectional
      │
      ├─[:SUBSTITUTE_FOR]───────  (:Ingredient)   ← bidirectional
      │
      └─[:USED_IN]──────────────► (:Dish {name})
                                         │
                                         └─[:BELONGS_TO]──► (:Cuisine {name})
```

**Nodes:** 30 ingredients · 15 flavors · 10 dishes · 5 cuisines  
**Relationships:** ~70 PAIRS_WITH · ~110 HAS_FLAVOR · ~40 USED_IN · 5 SUBSTITUTE_FOR

---

## Key Cypher queries

### 1. Direct pairings with shared flavor tags
```cypher
MATCH (a:Ingredient {name: $name})-[r:PAIRS_WITH]-(b:Ingredient)
OPTIONAL MATCH (a)-[:HAS_FLAVOR]->(f:Flavor)<-[:HAS_FLAVOR]-(b)
RETURN b.name, r.strength, collect(DISTINCT f.name) AS sharedFlavors
ORDER BY CASE r.strength WHEN 'strong' THEN 0 WHEN 'moderate' THEN 1 ELSE 2 END
```

### 2. 2-hop flavor bridge (graph-native, awkward in SQL)
```cypher
MATCH (a:Ingredient {name: $name})-[:HAS_FLAVOR]->(f:Flavor)<-[:HAS_FLAVOR]-(b:Ingredient)
WHERE a <> b AND NOT (a)-[:PAIRS_WITH]-(b)
RETURN b.name AS ingredient, collect(DISTINCT f.name) AS sharedFlavors
ORDER BY size(collect(DISTINCT f.name)) DESC
```

### 3. Shortest pairing path between two ingredients (multi-hop traversal)
```cypher
MATCH p = shortestPath(
  (a:Ingredient {name: $from})-[:PAIRS_WITH*1..6]-(b:Ingredient {name: $to})
)
RETURN [n IN nodes(p) | n.name] AS path, length(p) AS hops
```
> This query would require a recursive CTE in PostgreSQL/MySQL and would scan many more rows at scale.

---

## Setup & run

### 1. Create a CognoDB instance

1. Sign up at [console.cognodb.com/signup](https://console.cognodb.com/signup) — free, no credit card
2. Create a free **c0** instance in any region
3. Copy your `bolt+s://...` URI and generated password (shown once)

### 2. Clone & install

```bash
git clone <this-repo>
cd cognodb-app
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local — set COGNODB_URI and COGNODB_PASSWORD
```

Note: Do not commit `.env.local`. The repository's `.gitignore` already excludes it.

### 4. Seed the database

```bash
npm run seed
```

Expected output:
```
✅  Connected.
🫙  Seeding ingredients …
🤝  Creating pairing relationships …
📊  Seed complete:
   Cuisine: 5 nodes
   Dish: 10 nodes
   Flavor: 15 nodes
   Ingredient: 30 nodes
   Relationships: ~230
```

### 5. Run the app

```bash
npm run dev
# → http://localhost:3000
```

---


## Screenshots

| Feature               | Query / Route                  | Key Highlights Shown                                   |                          Screenshot                          |
| :-------------------- | :----------------------------- | :----------------------------------------------------- | :----------------------------------------------------------: |
| **Quick Search**      | Search: `espresso`             | • Matching Results<br>• Loading State<br>• Empty State |      `![Quick Search](Screenshots/Quick%20Search.jpeg)`      |
| **Partial Match**     | Search: `choc`                 | • Substring Search (`CONTAINS`)                        |      `![Partial Match](Screenshots/Partial%20Match.png)`     |
| **Ingredient Detail** | `/ingredient/Espresso`         | • Pairings & Dishes<br>• Flavor Badges *(1-Hop)*       | `![Ingredient Detail](Screenshots/Ingredient%20Detail.jpeg)` |
| **Flavor Bridges**    | `/ingredient/Dark%20Chocolate` | • Shared Flavors *(2-Hop Connections)*                 |     `![Flavor Bridges](Screenshots/Flavor%20Bridge.png)`     |
| **Dish Finder**       | Search: `Chilli`               | • Dishes Aggregation (`MATCH + collect`)               |       `![Dish Finder](Screenshots/Dish%20Finder.jpeg)`       |



---

## Project structure

```
cognodb-app/
├── scripts/seed.mjs          # Seed script — run once to populate CognoDB
├── src/
│   ├── lib/
│   │   ├── neo4j.ts          # Driver connection + query helper
│   │   └── queries.ts        # All parameterised Cypher queries
│   └── app/
│       ├── page.tsx          # Home — ingredient browser + search
│       ├── ingredient/[name] # Ingredient detail: pairings, bridges, dishes
│       ├── path/             # Shortest-path finder between two ingredients
│       └── api/              # REST endpoints (ingredients, pairings, path, health)
├── .env.example              # Template — copy to .env.local
└── README.md
```
