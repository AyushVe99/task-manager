import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import TimeEntry from '../models/TimeEntry.js';

const timeEntryRouter = express.Router({ mergeParams: true });

// GET /api/tasks/:taskId/time-entries
timeEntryRouter.get('/', authMiddleware, async (req, res, next) => {
    try {
        const { taskId } = req.params;

        const timeEntries = await TimeEntry.find({ taskId })
            .sort({ date: -1, createdAt: -1 });

        res.status(200).json(timeEntries);
    } catch (error) {
        next(error);
    }
});

// POST /api/tasks/:taskId/time-entries
timeEntryRouter.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { hours, description, date } = req.body;

        const timeEntry = new TimeEntry({
            taskId,
            userId: req.user.userId,
            hours,
            description,
            date: date || new Date()
        });

        await timeEntry.save();

        res.status(201).json(timeEntry);
    } catch (error) {
        next(error);
    }
});

export default timeEntryRouter;
