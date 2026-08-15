import { createClient } from 'redis';

let pubClientPromise = null;
let subClientPromise = null;

async function connect() {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => {
    console.error('[redis] client error:', err);
  });
  await client.connect();
  return client;
}

// Socket.io'nun redis-adapter'ı ayrı bir pub ve sub client bekler (bkz.
// enerjipanel-mimari.md §2.1 — instance'lar arası mesaj köprüsü).
function getPubClient() {
  if (!pubClientPromise) {
    pubClientPromise = connect();
  }
  return pubClientPromise;
}

function getSubClient() {
  if (!subClientPromise) {
    subClientPromise = connect();
  }
  return subClientPromise;
}

async function checkConnection() {
  const client = await getPubClient();
  await client.ping();
}

export { getPubClient, getSubClient, checkConnection };
