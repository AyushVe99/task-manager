import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/user.js';
import {
    generateTokens,
    verifyRefreshToken,
    validateRefreshTokenInRedis,
    revokeRefreshToken,
    revokeAllRefreshTokens,
    blacklistAccessToken,
} from '../utils/tokenManager.js';

dotenv.config();

/**
 * Register a new user
 */
async function registerUser(name, email, password) {
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Generate tokens for auto-login after registration
        const { accessToken, refreshToken } = await generateTokens(user._id.toString(), user.role);
        return { user, accessToken, refreshToken };
    } catch (error) {
        throw new Error(`Registration failed: ${error.message}`);
    }
}

/**
 * Authenticate user and generate tokens
 */
async function authenticateUser(email, password) {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Authentication failed: User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Authentication failed: Invalid password');
        }

        const { accessToken, refreshToken } = await generateTokens(user._id.toString(), user.role);
        return { user, accessToken, refreshToken };
    } catch (error) {
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

/**
 * Logout user by blacklisting access token and revoking refresh token
 */
async function logoutUser(accessToken, refreshToken, userId) {
    try {
        // Get token expiration time
        const decoded = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

        // Blacklist the access token
        if (expiresIn > 0) {
            await blacklistAccessToken(accessToken, expiresIn);
        }

        // Revoke the refresh token
        if (refreshToken && userId) {
            await revokeRefreshToken(userId, refreshToken);
        }

        return true;
    } catch (error) {
        throw new Error(`Logout failed: ${error.message}`);
    }
}

/**
 * Logout from all devices by revoking all refresh tokens
 */
async function logoutFromAllDevices(userId) {
    try {
        await revokeAllRefreshTokens(userId);
        return true;
    } catch (error) {
        throw new Error(`Logout from all devices failed: ${error.message}`);
    }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(oldRefreshToken) {
    try {
        // Verify refresh token signature
        const decoded = verifyRefreshToken(oldRefreshToken);
        const userId = decoded.userId;
        // Note: We might need to fetch user role here if we want to keep it in the new token
        // For now, we'll assume the user role hasn't changed or we accept it might be missing in refreshed tokens
        // Ideally, we should fetch the user here.
        const user = await User.findById(userId);
        const role = user ? user.role : 'user';

        // Validate refresh token exists in Redis
        const isValid = await validateRefreshTokenInRedis(userId, oldRefreshToken);
        if (!isValid) {
            throw new Error('Refresh token has been revoked or expired');
        }

        // Generate new tokens
        const { accessToken, refreshToken } = await generateTokens(userId, role);

        // Revoke old refresh token
        await revokeRefreshToken(userId, oldRefreshToken);

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error(`Token refresh failed: ${error.message}`);
    }
}

export {
    registerUser,
    authenticateUser,
    logoutUser,
    logoutFromAllDevices,
    refreshAccessToken,
};