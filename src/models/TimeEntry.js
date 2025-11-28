import mongoose from "mongoose";
import { dbCallTrackerPlugin } from "../utils/dbCallTracker.js";

const timeEntrySchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    hours: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

// Apply DB call tracking plugin
timeEntrySchema.plugin(dbCallTrackerPlugin);

const TimeEntry = mongoose.model("TimeEntry", timeEntrySchema);

export default TimeEntry;