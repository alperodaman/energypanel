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

// Binds a durable queue to EXCHANGE with routingPattern and consumes it. Setup retries
// with the same backoff as the facility-service publisher, since this normally runs once
// at process startup and a cold RabbitMQ container must not crash the service.
async function consume(queueName, routingPattern, handler) {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const channel = await getChannel();
      await channel.assertQueue(queueName, { durable: true });
      await channel.bindQueue(queueName, EXCHANGE, routingPattern);

      channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString());
          await handler(payload);
          channel.ack(msg);
        } catch (err) {
          console.error(`[rabbitmq] handler for queue "${queueName}" failed:`, err);
          // TODO: Faz 0'da basit tutuluyor — dead-letter exchange/routing mimaride
          // tanımlı (bkz. enerjipanel-mimari.md §4) ama burada implement edilmiyor.
          channel.nack(msg, false, false);
        }
      });

      return;
    } catch (err) {
      const isLastAttempt = attempt === RETRY_DELAYS_MS.length;
      if (isLastAttempt) {
        console.error(`[rabbitmq] consume setup for queue "${queueName}" failed after ${attempt + 1} attempts:`, err);
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

export { consume, checkConnection, closeConnection };
