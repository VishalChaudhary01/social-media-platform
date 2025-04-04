import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisClient = new Redis();

redisClient.connect();

export const emailQueue = new Queue('emailQueue', { connection: redisClient });
