import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (error) => {
    console.error('Redis Client Error:', error);
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

await redisClient.connect();

export default redisClient;
