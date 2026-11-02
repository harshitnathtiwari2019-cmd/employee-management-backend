import { redisClient } from "../config/redis.js";

const EMPLOYEE_TTL_SECONDS = 300;

export class CacheService {
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isReady) {
        return null;
      }

      const value = await redisClient.get(key);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Redis cache read failed:", error);
      return null;
    }
  }

  public async set(
    key: string,
    value: unknown,
    ttlSeconds = EMPLOYEE_TTL_SECONDS,
  ): Promise<void> {
    try {
      if (!redisClient.isReady) {
        return;
      }

      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch (error) {
      console.error("Redis cache write failed:", error);
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      if (!redisClient.isReady) {
        return;
      }

      await redisClient.del(key);
    } catch (error) {
      console.error("Redis cache invalidation failed:", error);
    }
  }

  public async deleteByPattern(pattern: string): Promise<void> {
    try {
      if (!redisClient.isReady) {
        return;
      }

      for await (const key of redisClient.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        await redisClient.del(key);
      }
    } catch (error) {
      console.error("Redis pattern invalidation failed:", error);
    }
  }
}

export const cacheService = new CacheService();
