import { NextResponse } from 'next/server';
import { checkConnectivity } from '@/lib/neo4j';

export async function GET() {
  const status = await checkConnectivity();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
