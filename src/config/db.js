import dotenv from 'dotenv';
import mongoose from 'mongoose';
import os from 'os';
import poolMonitor from '../utils/poolMonitor.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/task-manager';

// Initial pool size calculation (conservative defaults)
const CPU_CORES = os.cpus().length;
const INITIAL_PEAK_RPS = parseInt(process.env.INITIAL_PEAK_RPS) || 50;
const INITIAL_AVG_DB_CALLS = parseFloat(process.env.INITIAL_AVG_DB_CALLS) || 1;

let maxPoolSize = Math.min(
    CPU_CORES * 5,
    INITIAL_PEAK_RPS * INITIAL_AVG_DB_CALLS * 0.2,
    200
);
let minPoolSize = Math.max(2, Math.round(maxPoolSize * 0.2));

console.log('=== MongoDB Connection Pool Configuration ===');
console.log(`CPU Cores: ${CPU_CORES}`);
console.log(`Initial Pool Sizes: maxPoolSize=${maxPoolSize}, minPoolSize=${minPoolSize}`);
console.log('Dynamic monitoring enabled - pool recommendations will be logged periodically');

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGO_URI, {
            maxPoolSize,
            minPoolSize,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✓ Connected to MongoDB');
        console.log(`Active Pool Configuration: max=${maxPoolSize}, min=${minPoolSize}`);

        // Start monitoring and periodic logging
        startPoolMonitoring();

    } catch (error) {
        console.error('✗ Error connecting to MongoDB:', error);
        throw error;
    }
}

// Monitor pool usage and log recommendations
function startPoolMonitoring() {
    // Log metrics every 5 minutes
    setInterval(() => {
        const poolSizes = poolMonitor.calculatePoolSizes();
        const metrics = poolSizes.metrics;

        console.log('\n=== Pool Monitor Report ===');
        console.log(`Current RPS: ${metrics.currentRPS} | Peak RPS: ${metrics.peakRPS}`);
        console.log(`Avg DB Calls/Request: ${metrics.avgDBCalls}`);
        console.log(`Total Requests: ${metrics.totalRequests} | Total DB Calls: ${metrics.totalDBCalls}`);
        console.log('\nCalculation Breakdown:');
        console.log(`  CPU-based: ${poolSizes.calculation.cpuBased}`);
        console.log(`  Traffic-based: ${poolSizes.calculation.trafficBased}`);
        console.log(`  Ceiling: ${poolSizes.calculation.ceiling}`);
        console.log(`\nRecommended Pool Sizes:`);
        console.log(`  maxPoolSize: ${poolSizes.maxPoolSize} (current: ${maxPoolSize})`);
        console.log(`  minPoolSize: ${poolSizes.minPoolSize} (current: ${minPoolSize})`);

        // Warning if recommended size differs significantly
        if (Math.abs(poolSizes.maxPoolSize - maxPoolSize) > 5) {
            console.log(`⚠️  WARNING: Recommended maxPoolSize (${poolSizes.maxPoolSize}) differs from current (${maxPoolSize})`);
            console.log(`   Consider updating INITIAL_PEAK_RPS in .env and restarting the application`);
        }

        console.log('========================\n');

    }, 5 * 60 * 1000); // Every 5 minutes

    // Reset peak RPS daily to adapt to changing traffic patterns
    setInterval(() => {
        poolMonitor.resetPeak();
        console.log('📊 Peak RPS counter reset for fresh daily metrics');
    }, 24 * 60 * 60 * 1000); // Every 24 hours
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

export { connectToDatabase };