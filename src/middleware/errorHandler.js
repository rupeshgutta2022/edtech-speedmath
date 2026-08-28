function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error.' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
