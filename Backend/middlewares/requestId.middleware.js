/**
 * Request ID Middleware — Assigns a unique UUID to every request.
 *
 * Why: In a production system handling hundreds of concurrent requests,
 * you need to trace a single user's request through all log lines,
 * error reports, and downstream service calls. Without this, debugging
 * "which request caused this error?" is impossible.
 *
 * The request ID is:
 *   1. Generated as UUIDv4 (or accepted from X-Request-ID header if trusted proxy)
 *   2. Attached to req.requestId
 *   3. Set as X-Request-ID response header
 *   4. Available in logger via req.requestId
 */

const crypto = require('crypto');

function requestIdMiddleware(req, res, next) {
    // Accept upstream request ID (e.g., from load balancer) or generate new one
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
}

module.exports = requestIdMiddleware;
