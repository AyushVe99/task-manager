import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectToDatabase } from './config/db.js';
import healthRouter from './routes/health.js';
import limiter from './middleware/rateLimiter.js';
import logger from './utils/logger.js';
import taskRouter from './routes/tasks.js';
import { authMiddleware } from './middleware/auth.js';
import {
    registerUserRouter,
    authenticateUserRouter,
    logoutUserRouter,
    logoutAllDevicesRouter,
    refreshTokenRouter,
} from './routes/auth.js';
import { requestTrackerMiddleware } from './middleware/requestTracker.js';
import { requestContext } from './utils/dbCallTracker.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(
    cors({
        origin: "https://task-manager-frontend-pi-sage.vercel.app",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.options("*", cors());


// Apply request context tracking (MUST be first for DB call tracking)
app.use((req, res, next) => {
    requestContext.run({ requestId: req.requestId }, () => next());
});

// Apply request tracking middleware for RPS monitoring
app.use(requestTrackerMiddleware);

// Apply rate limiting to all requests
app.use(limiter);

app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT || 3000;

// Routes
app.use(healthRouter);

// Auth routes
app.use('/auth/register', registerUserRouter);
app.use('/auth/login', authenticateUserRouter);
app.use('/auth/logout', logoutUserRouter);
app.use('/auth/logout-all-devices', logoutAllDevicesRouter);
app.use('/auth/refresh-token', refreshTokenRouter);

// Task routes
app.use('/api/tasks', authMiddleware, taskRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

connectToDatabase();

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});