import express from 'express';
import Task from '../models/Task.js';
import User from '../models/user.js';
import { authMiddleware } from '../middleware/auth.js';
import { getIO } from '../services/socket.js';

const taskRouter = express.Router();

taskRouter.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, tags } = req.body;
        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate,
            tags,
            owner: req.user.userId,
        });

        // Emit event
        const io = getIO();
        io.to(req.user.userId).emit('task.created', task);

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

taskRouter.get('/', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const tasks = await Task.find({ owner: req.user.userId }).skip(skip).limit(limit);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

taskRouter.get('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

taskRouter.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { role, userId } = req.user;
        const updates = req.body;
        const taskId = req.params.id;

        let task;

        if (role === 'admin') {
            // Admin can update any task
            task = await Task.findByIdAndUpdate(taskId, updates, { new: true });
        } else {
            // Regular user can only update their own task
            task = await Task.findOneAndUpdate(
                { _id: taskId, owner: userId },
                updates,
                { new: true }
            );
        }

        if (!task) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }

        // Emit event
        const io = getIO();
        io.to(req.user.userId).emit('task.updated', task);

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

taskRouter.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Emit event
        const io = getIO();
        io.to(req.user.userId).emit('task.deleted', { id: req.params.id });

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default taskRouter;
