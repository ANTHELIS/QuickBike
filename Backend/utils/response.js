/**
 * Response Envelope — Consistent API response format.
 *
 * Every API response follows this shape:
 * {
 *   success: boolean,
 *   data: any | null,
 *   message: string,
 *   meta?: { requestId, responseTime },
 *   pagination?: { page, limit, total, pages }
 * }
 *
 * This makes the frontend predictable — it always checks
 * `res.data.success` and `res.data.data` rather than guessing
 * the shape of each endpoint's response.
 */

/**
 * Success response helper.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message='Success']
 * @param {any} [options.data=null]
 * @param {object} [options.pagination]
 */
function success(res, { statusCode = 200, message = 'Success', data = null, pagination } = {}) {
    const body = {
        success: true,
        message,
        data,
    };

    if (pagination) {
        body.pagination = pagination;
    }

    // Attach request metadata if available
    if (res.req?.requestId) {
        body.meta = {
            requestId: res.req.requestId,
        };
    }

    return res.status(statusCode).json(body);
}

/**
 * Error response helper.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=500]
 * @param {string} [options.message='Internal Server Error']
 * @param {any} [options.errors]
 */
function error(res, { statusCode = 500, message = 'Internal Server Error', errors: errs } = {}) {
    const body = {
        success: false,
        message,
    };

    if (errs) {
        body.errors = errs;
    }

    if (res.req?.requestId) {
        body.meta = {
            requestId: res.req.requestId,
        };
    }

    return res.status(statusCode).json(body);
}

/**
 * Paginated response helper.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {any} options.data
 * @param {number} options.total
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} [options.message='Success']
 */
function paginated(res, { data, total, page, limit, message = 'Success' }) {
    return success(res, {
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
}

module.exports = { success, error, paginated };
