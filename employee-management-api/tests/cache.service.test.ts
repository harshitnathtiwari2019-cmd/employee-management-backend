import { beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("CacheService", () => {
  let cacheService: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown, ttlSeconds?: number) => Promise<void>;
    delete: (key: string) => Promise<void>;
    deleteByPattern: (pattern: string) => Promise<void>;
  };

  let mockRedis: {
    isReady: boolean;
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    scanIterator: jest.Mock;
  };

  beforeEach(() => {
    jest.resetModules();

    mockRedis = {
      isReady: true,
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scanIterator: jest.fn(),
    };

    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.del.mockResolvedValue(1);
    mockRedis.scanIterator.mockImplementation(async function* () {});

    jest.doMock("../src/config/redis.js", () => ({
      redisClient: mockRedis,
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CacheService } = require("../src/services/cache.service.js");

    cacheService = new CacheService();
  });

  it("returns null on a cache miss", async () => {
    await expect(cacheService.get("employee:123")).resolves.toBeNull();
    expect(mockRedis.get).toHaveBeenCalledWith("employee:123");
  });

  it("returns cached data after parsing JSON", async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({ id: "123", name: "Test Employee" }),
    );

    await expect(cacheService.get("employee:123")).resolves.toEqual({
      id: "123",
      name: "Test Employee",
    });
  });

  it("sets a default TTL of 300 seconds", async () => {
    await cacheService.set("employee:123", { id: "123" });

    expect(mockRedis.set).toHaveBeenCalledWith(
      "employee:123",
      JSON.stringify({ id: "123" }),
      { EX: 300 },
    );
  });

  it("supports a custom TTL", async () => {
    await cacheService.set("employee:123", { id: "123" }, 60);

    expect(mockRedis.set).toHaveBeenCalledWith(
      "employee:123",
      JSON.stringify({ id: "123" }),
      { EX: 60 },
    );
  });

  it("deletes a cache key", async () => {
    await cacheService.delete("employee:123");

    expect(mockRedis.del).toHaveBeenCalledWith("employee:123");
  });

  it("returns null if Redis is not ready", async () => {
    mockRedis.isReady = false;

    await expect(cacheService.get("employee:123")).resolves.toBeNull();
    expect(mockRedis.get).not.toHaveBeenCalled();
  });

  it("handles Redis read errors", async () => {
    mockRedis.get.mockRejectedValue(new Error("Redis unavailable"));

    await expect(cacheService.get("employee:123")).resolves.toBeNull();
  });

  it("handles Redis write errors", async () => {
    mockRedis.set.mockRejectedValue(new Error("Redis unavailable"));

    await expect(
      cacheService.set("employee:123", { id: "123" }),
    ).resolves.toBeUndefined();
  });

  it("handles Redis deletion errors", async () => {
    mockRedis.del.mockRejectedValue(new Error("Redis unavailable"));

    await expect(cacheService.delete("employee:123")).resolves.toBeUndefined();
  });

  it("deletes keys matching a pattern", async () => {
    mockRedis.scanIterator.mockImplementation(async function* () {
      yield "employees:list:abc";
      yield "employees:list:def";
    });

    await cacheService.deleteByPattern("employees:list:*");

    expect(mockRedis.scanIterator).toHaveBeenCalledWith({
      MATCH: "employees:list:*",
      COUNT: 100,
    });

    expect(mockRedis.del).toHaveBeenNthCalledWith(1, "employees:list:abc");
    expect(mockRedis.del).toHaveBeenNthCalledWith(2, "employees:list:def");
  });
});
