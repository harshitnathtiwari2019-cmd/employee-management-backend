import { createHash, randomBytes, randomUUID } from "node:crypto";

import { AppDataSource } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import { RefreshToken } from "../entities/RefreshToken.entity.js";
import { User } from "../entities/User.entity.js";
import type { LoginDto } from "../dto/auth.dto.js";
import { UserRepository } from "../repositories/user.repository.js";
import { PasswordService } from "./password.service.js";
import { TokenService } from "./token.service.js";
import { createSession, getSession, deleteSession } from "./session.service.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository = new UserRepository(),
    private readonly passwordService: PasswordService = new PasswordService(),
    private readonly tokenService: TokenService = new TokenService(),
  ) {}

  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  }

  private getRefreshTokenExpiry(): Date {
    return new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  public async login(data: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    expiresIn: string;
  }> {
    const email = data.email.toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new AppError("Invalid email or password", 401);
    }

    const passwordMatches = await this.passwordService.comparePassword(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError("Invalid email or password", 401);
    }

    const sessionId = randomUUID();
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshToken);

    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    const tokenRecord = refreshTokenRepository.create({
      user,
      sessionId,
      tokenHash,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    await refreshTokenRepository.save(tokenRecord);

    try {
      await createSession(sessionId, user.id);
    } catch {
      // Redis session creation failed. Revoke the refresh token
      // so a partially completed login cannot be refreshed.
      await refreshTokenRepository.update(
        { id: tokenRecord.id },
        { revokedAt: new Date() },
      );

      throw new AppError(
        "Unable to create login session. Please try again.",
        503,
      );
    }

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.role.name,
      sessionId,
    );

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_TTL,
    };
  }

  public async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    expiresIn: string;
  }> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    // Find the session before rotating the refresh token.
    const existingToken = await refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (
      !existingToken ||
      existingToken.revokedAt !== null ||
      existingToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const sessionId = existingToken.sessionId;
    const session = await getSession(sessionId);

    if (!session || session.userId !== existingToken.user.id) {
      throw new AppError("Session expired or revoked", 401);
    }

    const result = await AppDataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(RefreshToken);

      const storedToken = await tokenRepository.findOne({
        where: { tokenHash },
        relations: { user: true },
        lock: { mode: "pessimistic_write" },
      });

      if (
        !storedToken ||
        storedToken.revokedAt !== null ||
        storedToken.expiresAt.getTime() <= Date.now() ||
        storedToken.sessionId !== sessionId
      ) {
        throw new AppError("Invalid or expired refresh token", 401);
      }

      const userRepository = manager.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: storedToken.user.id },
        relations: { role: true },
      });

      if (!user || !user.isActive) {
        throw new AppError("Invalid or expired refresh token", 401);
      }

      // Revoke the old token.
      storedToken.revokedAt = new Date();
      await tokenRepository.save(storedToken);

      // Issue a replacement token for the SAME session.
      const newRefreshToken = this.generateRefreshToken();

      const newTokenRecord = tokenRepository.create({
        user,
        sessionId,
        tokenHash: this.hashRefreshToken(newRefreshToken),
        expiresAt: this.getRefreshTokenExpiry(),
      });

      await tokenRepository.save(newTokenRecord);

      const accessToken = this.tokenService.generateAccessToken(
        user.id,
        user.role.name,
        sessionId,
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: "Bearer" as const,
        expiresIn: env.JWT_ACCESS_TTL,
      };
    });

    return result;
  }

  public async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = this.hashRefreshToken(refreshToken);
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    const storedToken = await refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!storedToken) {
      return;
    }

    const sessionId = storedToken.sessionId;

    // Revoke every refresh token belonging to this session.
    await refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('"session_id" = :sessionId', { sessionId })
      .andWhere("revoked_at IS NULL")
      .execute();

    // Invalidate access tokens associated with this session.
    await deleteSession(sessionId);
  }
}
