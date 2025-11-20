import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate access and refresh tokens
 * @param {string} userId - User ID
 * @returns {Object} - { accessToken, refreshToken }
 */
async function generateTokens(userId, role) {
    try {
        const accessToken = jwt.sign(
            { userId, role, type: 'access' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        const refreshToken = jwt.sign(
            { userId, role, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN_REMEMBER_ME || '7d' }
        );

        // Store refresh token in Redis with expiration
        const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
        await redisClient.set(
            `refresh_token:${userId}:${refreshToken}`,
            JSON.stringify({ userId, createdAt: new Date().toISOString() }),
            { EX: 7 * 24 * 60 * 60 } // 7 days expiration
        );

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error(`Token generation failed: ${error.message}`);
    }
}

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw new Error(`Token verification failed: ${error.message}`);
    }
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} - Decoded token payload
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw new Error(`Refresh token verification failed: ${error.message}`);
    }
}

/**
 * Validate refresh token exists in Redis
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {boolean} - Token is valid
 */
async function validateRefreshTokenInRedis(userId, refreshToken) {
    try {
        const key = `refresh_token:${userId}:${refreshToken}`;
        const exists = await redisClient.exists(key);
        return exists === 1;
    } catch (error) {
        throw new Error(`Redis validation failed: ${error.message}`);
    }
}

/**
 * Revoke refresh token (blacklist it)
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to revoke
 */
async function revokeRefreshToken(userId, refreshToken) {
    try {
        const key = `refresh_token:${userId}:${refreshToken}`;
        await redisClient.del(key);
    } catch (error) {
        throw new Error(`Token revocation failed: ${error.message}`);
    }
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 * @param {string} userId - User ID
 */
async function revokeAllRefreshTokens(userId) {
    try {
        const pattern = `refresh_token:${userId}:*`;
        const keys = await redisClient.keys(pattern);

        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (error) {
        throw new Error(`Revoke all tokens failed: ${error.message}`);
    }
}

/**
 * Add token to blacklist (for logout with access tokens)
 * @param {string} token - Access token
 * @param {number} expiresIn - Seconds until token expires
 */
async function blacklistAccessToken(token, expiresIn) {
    try {
        const key = `blacklist:${token}`;
        await redisClient.set(key, 'blacklisted', { EX: expiresIn });
    } catch (error) {
        throw new Error(`Blacklist failed: ${error.message}`);
    }
}

/**
 * Check if access token is blacklisted
 * @param {string} token - Access token
 * @returns {boolean} - Token is blacklisted
 */
async function isTokenBlacklisted(token) {
    try {
        const key = `blacklist:${token}`;
        const exists = await redisClient.exists(key);
        return exists === 1;
    } catch (error) {
        throw new Error(`Blacklist check failed: ${error.message}`);
    }
}

export {
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    validateRefreshTokenInRedis,
    revokeRefreshToken,
    revokeAllRefreshTokens,
    blacklistAccessToken,
    isTokenBlacklisted,
};
