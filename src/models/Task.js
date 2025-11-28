import mongoose from "mongoose";
import { dbCallTrackerPlugin } from "../utils/dbCallTracker.js";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'completed'],
        default: 'todo'
    },
    priority: {
        type: Number,
        default: 3 // 1-High, 2-Medium, 3-Low
    },
    dueDate: {
        type: Date
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

taskSchema.index({ owner: 1, status: 1 })

// Apply DB call tracking plugin
taskSchema.plugin(dbCallTrackerPlugin);

const Task = mongoose.model("Task", taskSchema);

export default Task;