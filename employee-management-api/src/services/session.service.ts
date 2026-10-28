import { redisClient } from "../config/redis.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionData {
  userId: string;
  status: "active";
}

function sessionKey(sessionId: string): string {
  return `auth:session:${sessionId}`;
}

export async function createSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  if (!redisClient.isReady) {
    throw new Error("Redis is unavailable");
  }

  const session: SessionData = {
    userId,
    status: "active",
  };

  await redisClient.set(sessionKey(sessionId), JSON.stringify(session), {
    EX: SESSION_TTL_SECONDS,
  });

  console.log("Session created in Redis");
}

export async function getSession(
  sessionId: string,
): Promise<SessionData | null> {
  if (!redisClient.isReady) {
    throw new Error("Redis is unavailable");
  }

  const data = await redisClient.get(sessionKey(sessionId));

  if (!data) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(data);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("userId" in parsed) ||
      typeof parsed.userId !== "string" ||
      !("status" in parsed) ||
      parsed.status !== "active"
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      status: "active",
    };
  } catch {
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!redisClient.isReady) {
    throw new Error("Redis is unavailable");
  }

  await redisClient.del(sessionKey(sessionId));

  console.log("Session deleted from Redis");
}
