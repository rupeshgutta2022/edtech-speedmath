const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`Speed Math server listening on port ${config.port} [${config.env}]`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully.');
  server.close(() => process.exit(0));
});

module.exports = server;
