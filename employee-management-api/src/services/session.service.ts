import { randomUUID } from "node:crypto";
import { redisClient } from "../config/redis.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SESSION_KEY_PREFIX = "auth:session:";
const USER_SESSIONS_KEY_PREFIX = "auth:user-sessions:";

export interface SessionData {
  sessionId: string;
  userId: string;
  status: "active";
  createdAt: string;
  lastActivityAt: string;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
}

function sessionKey(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

function userSessionsKey(userId: string): string {
  return `${USER_SESSIONS_KEY_PREFIX}${userId}`;
}

function assertRedisAvailable(): void {
  if (!redisClient.isReady) {
    throw new Error("Redis is unavailable");
  }
}

export async function createSession(
  sessionId: string,
  userId: string,
  metadata?: {
    device?: string;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<void> {
  assertRedisAvailable();

  const now = new Date().toISOString();

  const session: SessionData = {
    sessionId,
    userId,
    status: "active",
    createdAt: now,
    lastActivityAt: now,
    ...metadata,
  };

  await redisClient
    .multi()
    .set(sessionKey(sessionId), JSON.stringify(session), {
      EX: SESSION_TTL_SECONDS,
    })
    .sAdd(userSessionsKey(userId), sessionId)
    .expire(userSessionsKey(userId), SESSION_TTL_SECONDS)
    .exec();
}

export async function getSession(
  sessionId: string,
): Promise<SessionData | null> {
  assertRedisAvailable();

  const data = await redisClient.get(sessionKey(sessionId));

  if (!data) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(data);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("sessionId" in parsed) ||
      parsed.sessionId !== sessionId ||
      !("userId" in parsed) ||
      typeof parsed.userId !== "string" ||
      !("status" in parsed) ||
      parsed.status !== "active" ||
      !("createdAt" in parsed) ||
      typeof parsed.createdAt !== "string" ||
      !("lastActivityAt" in parsed) ||
      typeof parsed.lastActivityAt !== "string"
    ) {
      return null;
    }

    return parsed as SessionData;
  } catch {
    return null;
  }
}

export async function listUserSessions(userId: string): Promise<SessionData[]> {
  assertRedisAvailable();

  const sessionIds = await redisClient.sMembers(userSessionsKey(userId));

  if (sessionIds.length === 0) {
    return [];
  }

  const sessions = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const session = await getSession(sessionId);

      if (!session || session.userId !== userId) {
        await redisClient.sRem(userSessionsKey(userId), sessionId);
        return null;
      }

      return session;
    }),
  );

  return sessions.filter((session): session is SessionData => session !== null);
}

export async function deleteSession(sessionId: string): Promise<void> {
  assertRedisAvailable();

  const session = await getSession(sessionId);

  if (!session) {
    await redisClient.del(sessionKey(sessionId));
    return;
  }

  await redisClient
    .multi()
    .del(sessionKey(sessionId))
    .sRem(userSessionsKey(session.userId), sessionId)
    .exec();
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  assertRedisAvailable();

  const session = await getSession(sessionId);

  if (!session) {
    return;
  }

  session.lastActivityAt = new Date().toISOString();

  await redisClient.set(sessionKey(sessionId), JSON.stringify(session), {
    EX: SESSION_TTL_SECONDS,
  });
}
