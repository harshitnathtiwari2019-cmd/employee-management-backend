import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { loginSchema } from "../dto/auth.dto.js";
import { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await this.authService.login(parsed.data);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          accessToken: result.accessToken,
          tokenType: result.tokenType,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken: unknown = req.cookies?.refreshToken;

      if (typeof refreshToken !== "string" || !refreshToken) {
        res.status(401).json({
          success: false,
          message: "Refresh token is required",
        });
        return;
      }

      const result = await this.authService.refresh(refreshToken);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: result.accessToken,
          tokenType: result.tokenType,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken: unknown = req.cookies?.refreshToken;

      await this.authService.logout(
        typeof refreshToken === "string" ? refreshToken : undefined,
      );

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
      });

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  };
}
