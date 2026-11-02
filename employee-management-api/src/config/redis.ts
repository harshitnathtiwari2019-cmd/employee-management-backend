import { createClient } from "redis";
import { env } from "./env.js";

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        return new Error("Redis connection failed after 3 retries");
      }

      return Math.min((retries + 1) * 500, 1500);
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
