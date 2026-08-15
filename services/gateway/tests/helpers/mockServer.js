import http from 'node:http';

async function startMockServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, url: `http://127.0.0.1:${port}` };
}

function stopMockServer(mock) {
  return new Promise((resolve) => mock.server.close(resolve));
}

async function reserveClosedPort() {
  const { server, url } = await startMockServer((req, res) => res.end());
  await stopMockServer({ server });
  return url;
}

function jsonHandler(status, body) {
  return (req, res) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
}

export { startMockServer, stopMockServer, reserveClosedPort, jsonHandler };
