import { NextRequest, NextResponse } from 'next/server';
import { getFlavorPath } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to query params are required' }, { status: 400 });
  }

  try {
    const path = await getFlavorPath(from, to);
    if (!path) {
      return NextResponse.json({ error: 'No path found between these ingredients' }, { status: 404 });
    }
    return NextResponse.json(path);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
