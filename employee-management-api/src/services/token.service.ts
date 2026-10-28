import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: string;
  sid: string;
}

export class TokenService {
  public generateAccessToken(
    userId: string,
    role: string,
    sessionId: string,
  ): string {
    return jwt.sign({ userId, role, sid: sessionId }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
    });
  }

  public verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

      if (
        typeof decoded === "string" ||
        typeof decoded.userId !== "string" ||
        typeof decoded.role !== "string" ||
        typeof decoded.sid !== "string"
      ) {
        throw new AppError("Invalid access token", 401);
      }

      return decoded as AccessTokenPayload;
    } catch {
      throw new AppError("Invalid or expired access token", 401);
    }
  }
}
