class AppError extends Error {
    /**
     * @param {string} message - Human-readable error description
     * @param {number} statusCode - HTTP status code (default 500)
     */
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Distinguishes expected errors from bugs
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
