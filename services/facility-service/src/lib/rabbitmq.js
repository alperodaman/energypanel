import amqp from 'amqplib';

const EXCHANGE = 'enerjipanel.events';
const RETRY_DELAYS_MS = [200, 500, 1000];

let channelPromise = null;
let currentConnection = null;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function connectChannel() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  connection.on('error', () => {
    channelPromise = null;
    currentConnection = null;
  });
  connection.on('close', () => {
    channelPromise = null;
    currentConnection = null;
  });
  currentConnection = connection;

  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  return channel;
}

function getChannel() {
  if (!channelPromise) {
    channelPromise = connectChannel().catch((err) => {
      channelPromise = null;
      throw err;
    });
  }
  return channelPromise;
}

// Best-effort publish: retries a few times on failure, then logs and gives up
// without throwing — callers must not be blocked by a broken message bus.
async function publish(routingKey, payload) {
  const message = Buffer.from(JSON.stringify(payload));

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const channel = await getChannel();
      channel.publish(EXCHANGE, routingKey, message, { persistent: true });
      return;
    } catch (err) {
      const isLastAttempt = attempt === RETRY_DELAYS_MS.length;
      if (isLastAttempt) {
        console.error(`[rabbitmq] publish "${routingKey}" failed after ${attempt + 1} attempts:`, err);
        return;
      }
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

// Exposed for the health check — reuses the same lazily-created channel/connection
// rather than opening a fresh one just to probe liveness.
async function checkConnection() {
  await getChannel();
}

// Closes the underlying connection so a Node process holding no other open handles
// (e.g. a Jest test run) can exit on its own without --forceExit.
async function closeConnection() {
  channelPromise = null;
  if (currentConnection) {
    const connection = currentConnection;
    currentConnection = null;
    await connection.close();
  }
}

export { publish, checkConnection, closeConnection };
