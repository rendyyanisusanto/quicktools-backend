/**
 * notFound.js
 * Catches all unmatched routes and returns a 404 response.
 */

export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
