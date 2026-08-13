import neo4j, { Driver, QueryResult, RecordShape } from 'neo4j-driver';

let _driver: Driver | null = null;

function getDriver(): Driver {
  if (!_driver) {
    const uri = process.env.COGNODB_URI;
    const password = process.env.COGNODB_PASSWORD;
    if (!uri || !password) {
      throw new Error(
        'Missing COGNODB_URI or COGNODB_PASSWORD. Copy .env.example to .env.local and fill in your CognoDB credentials.'
      );
    }
    _driver = neo4j.driver(uri, neo4j.auth.basic('cognodb', password), {
      maxConnectionLifetime: 3 * 60 * 1000,
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 10000,
      connectionTimeout: 15000,
      // bolt+s:// uses TLS; trust system CA bundle (works with CognoDB's signed cert)
      encrypted: 'ENCRYPTION_ON',
      trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
    });
  }
  return _driver;
}

export async function query<T extends RecordShape>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session();
  try {
    const result: QueryResult<T> = await session.run(cypher, params);
    return result.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function checkConnectivity(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getDriver().verifyConnectivity({ database: 'neo4j' });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
