/**
 * health.controller.js
 * Handles GET /api/health
 */

export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'QuickTools API is running',
    timestamp: new Date().toISOString(),
  });
}
