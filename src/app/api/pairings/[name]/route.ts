import { NextRequest, NextResponse } from 'next/server';
import { getIngredient, getDirectPairings, getFlavorBridges, getDishesForIngredients, getNeighbourhood } from '@/lib/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = decodeURIComponent(params.name);
  try {
    const [ingredient, pairings, bridges, neighbourhood] = await Promise.all([
      getIngredient(name),
      getDirectPairings(name),
      getFlavorBridges(name),
      getNeighbourhood(name),
    ]);

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    const pairedNames = pairings.map((p) => p.name);
    const dishes = await getDishesForIngredients([name, ...pairedNames.slice(0, 3)]);

    return NextResponse.json({ ingredient, pairings, bridges, dishes, neighbourhood });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
