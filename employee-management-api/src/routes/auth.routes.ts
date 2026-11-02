import { Router } from "express";

import { AuthController } from "../controllers/auth.controller.js";
import { AuthenticateTokenMiddleware } from "../middlewares/authenticate-token.middleware.js";

export class AuthRoutes {
  public readonly router: Router;

  private readonly authController: AuthController;
  private readonly authenticateTokenMiddleware: AuthenticateTokenMiddleware;

  constructor() {
    this.router = Router();

    this.authController = new AuthController();
    this.authenticateTokenMiddleware = new AuthenticateTokenMiddleware();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Public authentication routes
    this.router.post("/login", this.authController.login);
    this.router.post("/refresh", this.authController.refresh);
    this.router.post("/logout", this.authController.logout);

    // Protected session-management routes
    this.router.get(
      "/sessions",
      this.authenticateTokenMiddleware.handle,
      this.authController.getSessions,
    );

    this.router.delete(
      "/sessions/:sessionId",
      this.authenticateTokenMiddleware.handle,
      this.authController.revokeSession,
    );
  }
}
