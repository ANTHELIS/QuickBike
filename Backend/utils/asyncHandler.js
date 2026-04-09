/**
 * Wraps an async Express route handler so that any rejected promise
 * is forwarded to Express's error-handling middleware automatically.
 *
 * Usage: router.get('/path', asyncHandler(myController));
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
