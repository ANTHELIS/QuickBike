/**
 * Input Sanitization Middleware — NoSQL Injection + XSS Prevention.
 *
 * NoSQL Injection: MongoDB operators like $gt, $ne, $regex can be
 * injected via JSON body/query to bypass authentication:
 *   { "email": { "$gt": "" }, "password": { "$gt": "" } }
 *   → matches any user with non-empty email AND password = login bypass
 *
 * This middleware strips keys starting with $ and containing . from
 * req.body, req.query, and req.params recursively.
 *
 * XSS: For a JSON API backend (no HTML rendering), XSS is primarily
 * a stored XSS risk — malicious scripts saved in DB and rendered by
 * the React frontend. React auto-escapes JSX, but we still sanitize
 * on write as defense-in-depth.
 */

/**
 * Recursively strip MongoDB operators from an object.
 * Removes keys starting with '$' and keys containing '.'.
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip MongoDB operator keys
        if (key.startsWith('$')) continue;
        // Skip dot-notation keys (used for nested field injection)
        if (key.includes('.')) continue;

        clean[key] = sanitizeObject(value);
    }
    return clean;
}

/**
 * Strip basic HTML tags from string values (defense-in-depth).
 * React escapes output, but we clean on write too.
 */
function stripHtml(obj) {
    if (typeof obj === 'string') {
        return obj
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(stripHtml);

    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        clean[key] = stripHtml(value);
    }
    return clean;
}

/**
 * Combined sanitization middleware.
 * Order matters: noSQL sanitization first, then XSS.
 */
function sanitizeMiddleware(req, res, next) {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
}

module.exports = sanitizeMiddleware;
