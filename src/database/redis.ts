import Redis from 'ioredis';

const redis = new Redis({
  port: parseInt(process.env.REDIS_PORT), // Redis port
  host: process.env.REDIS_HOST, // Redis host
  password: process.env.REDIS_PASSWORD,
  db: 0, // Defaults to 0
});

export default redis;
