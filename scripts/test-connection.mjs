/**
 * Quick connectivity test — run with: node --env-file=.env.local scripts/test-connection.mjs
 */
import neo4j from 'neo4j-driver';
import { createConnection } from 'net';

const uri = process.env.COGNODB_URI;
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
  console.error('❌  COGNODB_URI or COGNODB_PASSWORD not set in .env.local');
  process.exit(1);
}

// Parse host and port from URI
const match = uri.match(/bolt\+s?:\/\/([^:/]+)(?::(\d+))?/);
const host = match?.[1];
const port = parseInt(match?.[2] ?? '7687', 10);

console.log(`🔍  Testing TCP connectivity to ${host}:${port} …`);

await new Promise((resolve) => {
  const sock = createConnection({ host, port, timeout: 6000 }, () => {
    console.log(`✅  TCP connection to ${host}:${port} succeeded`);
    sock.destroy();
    resolve();
  });
  sock.on('timeout', () => {
    console.error(`❌  TCP timeout — the database server is not reachable on port ${port}`);
    console.error('    → Check console.cognodb.com: is your instance Running?');
    sock.destroy();
    process.exit(1);
  });
  sock.on('error', (err) => {
    console.error(`❌  TCP error: ${err.message}`);
    console.error('    → Check console.cognodb.com: is your instance Running?');
    process.exit(1);
  });
});

console.log('🔐  Testing Bolt authentication …');
const driver = neo4j.driver(uri, neo4j.auth.basic('cognodb', password), {
  connectionTimeout: 10000,
  encrypted: 'ENCRYPTION_ON',
  trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
});

try {
  const session = driver.session();
  const result = await session.run('RETURN 1 AS n');
  console.log(`✅  Bolt query succeeded: ${JSON.stringify(result.records[0].toObject())}`);
  await session.close();
  console.log('\n🎉  Connection is working. Run: npm run seed');
} catch (err) {
  console.error(`❌  Bolt error: ${err.message}`);
} finally {
  await driver.close();
}
