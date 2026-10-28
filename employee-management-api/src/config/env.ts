import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_ACCESS_TTL: z.string().default("15m"),

  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),

  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  throw new Error("Application configuration is invalid");
}

export const env = Object.freeze(parsedEnv.data);
