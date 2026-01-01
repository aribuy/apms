const http = require('http');

const createTestServer = (app) => new Promise((resolve, reject) => {
  const server = http.createServer(app);
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server));
});

const closeTestServer = (server) => new Promise((resolve) => {
  if (!server) return resolve();
  server.close(() => resolve());
});

module.exports = {
  createTestServer,
  closeTestServer
};
