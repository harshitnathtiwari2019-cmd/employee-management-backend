import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";

export class AuthRoutes {
  public readonly router: Router;
  private readonly authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post("/login", this.authController.login);
    this.router.post("/refresh", this.authController.refresh);
    this.router.post("/logout", this.authController.logout);
  }
}
