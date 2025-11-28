
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Default error status and message
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Handle specific Mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // Handle Mongoose CastError (invalid ID)
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }

    // Handle Duplicate Key Error (e.g., unique email)
    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Duplicate field value entered'
        });
    }

    res.status(status).json({
        error: message,
    });
};

export default errorHandler;
