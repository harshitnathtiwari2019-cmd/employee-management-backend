import type { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/token.service.js";
import { getSession } from "../services/session.service.js";

export interface AuthenticatedUser {
  userId: string;
  role: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export class AuthenticateTokenMiddleware {
  private readonly tokenService: TokenService;

  constructor(tokenService: TokenService = new TokenService()) {
    this.tokenService = tokenService;
  }

  public handle = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authorization = req.headers.authorization;

    // Step 1: Check whether the access token exists.
    if (!authorization || !authorization.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      });
      return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      });
      return;
    }

    // Step 2: Verify the access token.
    let payload;

    try {
      payload = this.tokenService.verifyAccessToken(token);
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
      return;
    }

    // Step 3: Verify that the Redis session still exists.
    try {
      const session = await getSession(payload.sid);

      if (!session || session.userId !== payload.userId) {
        res.status(401).json({
          success: false,
          message: "Session expired or revoked",
        });
        return;
      }

      // Step 4: Attach authenticated user information to the request.
      req.user = {
        userId: payload.userId,
        role: payload.role,
        sessionId: payload.sid,
      };

      // Step 5: Continue to the next middleware or controller.
      next();
    } catch {
      res.status(503).json({
        success: false,
        message: "Authentication service temporarily unavailable",
      });
    }
  };
}
