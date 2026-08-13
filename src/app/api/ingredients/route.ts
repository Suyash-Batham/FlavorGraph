import { NextRequest, NextResponse } from 'next/server';
import { getAllIngredients, searchIngredients } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  try {
    const data = q ? await searchIngredients(q) : await getAllIngredients();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
