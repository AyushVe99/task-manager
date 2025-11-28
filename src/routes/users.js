import express from 'express';
import User from '../models/user.js';
import { authMiddleware } from '../middleware/auth.js';

const usersRouter = express.Router();

/**
 * GET /api/users
 * Get all users (id, name, email)
 */
usersRouter.get('/', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({}, 'name email');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default usersRouter;
