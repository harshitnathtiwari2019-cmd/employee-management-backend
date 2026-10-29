import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        return new Error("Redis connection failed after 3 retries");
      }

      return Math.min(retries * 500, 1000);
    },
  },
});

redisClient.on("error", (error: Error) => {
  console.error("Redis client error:", error.message);
});

export async function connectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    return;
  }

  await redisClient.connect();

  console.log("Redis connected successfully");
}
