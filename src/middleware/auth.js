import { verifyAccessToken, isTokenBlacklisted } from '../utils/tokenManager.js';

/**
 * Middleware to verify JWT access token
 */
async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Check if token is blacklisted
        const blacklisted = await isTokenBlacklisted(token);
        if (blacklisted) {
            return res.status(401).json({ error: 'Token has been revoked' });
        }

        // Verify token
        const decoded = verifyAccessToken(token);
        console.log("Decoded token in middleware:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }
}

export { authMiddleware };
