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
      // TLS/trust is configured via the URI (bolt+s://). Do not set both URL and config.
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
    // Convert Neo4j Integer objects (and nested values) to plain JS numbers/values
    function convertValue(v: any): any {
      if (v === null || v === undefined) return v;
      // neo4j Integer has toNumber()
      if (typeof v === 'object' && v !== null && typeof v.toNumber === 'function') {
        return v.toNumber();
      }
      if (Array.isArray(v)) return v.map(convertValue);
      if (typeof v === 'object') {
        const out: Record<string, any> = {};
        for (const [k, val] of Object.entries(v)) {
          out[k] = convertValue(val);
        }
        return out;
      }
      return v;
    }

    return result.records.map((r) => {
      const obj = r.toObject() as Record<string, any>;
      const converted: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) converted[k] = convertValue(v);
      return converted as T;
    });
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
