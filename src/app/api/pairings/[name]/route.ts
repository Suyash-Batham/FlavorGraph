import { NextRequest, NextResponse } from 'next/server';
import { getIngredient, getDirectPairings, getFlavorBridges, getDishesForIngredients, getNeighbourhood } from '@/lib/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = decodeURIComponent(params.name);
  try {
    // Resolve ingredient first (case-insensitive), then fetch related data using the
    // canonical name returned by `getIngredient` to ensure exact matches for other queries.
    const ingredient = await getIngredient(name);
    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    const canonical = ingredient.name;
    const [pairings, bridges, neighbourhood] = await Promise.all([
      getDirectPairings(canonical),
      getFlavorBridges(canonical),
      getNeighbourhood(canonical),
    ]);

    const pairedNames = pairings.map((p) => p.name);
    const dishes = await getDishesForIngredients([canonical, ...pairedNames.slice(0, 3)]);

    return NextResponse.json({ ingredient, pairings, bridges, dishes, neighbourhood });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
