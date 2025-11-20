import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/task-manager';
console.log('MONGO_URI:', MONGO_URI);

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGO_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }).then(() => {
            console.log('Connected to MongoDB');
        }).catch((error) => {
            console.error('Error connecting to MongoDB:', error);
        });
    } catch (error) {
        console.error('Unexpected error while connecting to MongoDB:', error);

    }

}

export { connectToDatabase };