import { v4 as uuidv4 } from 'uuid';
import poolMonitor from '../utils/poolMonitor.js';

// Middleware to track incoming requests
export const requestTrackerMiddleware = (req, res, next) => {
    // Generate unique request ID
    const requestId = uuidv4();
    req.requestId = requestId;

    // Track request start
    poolMonitor.trackRequest(requestId);

    // Track when response finishes
    res.on('finish', () => {
        poolMonitor.completeRequest(requestId);
    });

    next();
};

// Helper function to track DB calls (wrap around DB operations)
export const trackDBCall = (requestId) => {
    if (requestId) {
        poolMonitor.trackDBCall(requestId);
    }
};
