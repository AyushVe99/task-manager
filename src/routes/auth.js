import express from 'express';
import {
    registerUser,
    authenticateUser,
    logoutUser,
    logoutFromAllDevices,
    refreshAccessToken,
} from '../services/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const registerUserRouter = express.Router();
const authenticateUserRouter = express.Router();
const logoutUserRouter = express.Router();
const logoutAllDevicesRouter = express.Router();
const refreshTokenRouter = express.Router();

/**
 * POST /auth/register
 * Register a new user
 */
registerUserRouter.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const { user, accessToken, refreshToken } = await registerUser(name, email, password);

        // Set secure cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /auth/login
 * Authenticate user and get tokens
 */
authenticateUserRouter.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { user, accessToken, refreshToken } = await authenticateUser(email, password);

        // Set secure cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

/**
 * POST /auth/logout
 * Logout user from current device
 */
logoutUserRouter.post('/', authMiddleware, async (req, res) => {
    try {
        const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        const userId = req.user.userId;

        await logoutUser(accessToken, refreshToken, userId);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /auth/logout-all-devices
 * Logout user from all devices
 */
logoutAllDevicesRouter.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        await logoutFromAllDevices(userId);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ message: 'Logout from all devices successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /auth/refresh-token
 * Refresh access token using refresh token
 */
refreshTokenRouter.post('/', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        console.log("Received refresh token:", refreshToken);

        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token provided' });
        }

        const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(refreshToken);

        // Update cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            message: 'Token refreshed successfully',
            accessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

export {
    registerUserRouter,
    authenticateUserRouter,
    logoutUserRouter,
    logoutAllDevicesRouter,
    refreshTokenRouter,
};
