import { Router } from "express";
import { DepartmentController } from "../controllers/department.controller.js";
import { AuthenticateTokenMiddleware } from "../middlewares/authenticate-token.middleware.js";
import { authorizePermission } from "../middlewares/authorize-permission.middleware.js";

export class DepartmentRoutes {
  public readonly router: Router;

  private readonly departmentController: DepartmentController;
  private readonly authenticateToken: AuthenticateTokenMiddleware;

  constructor() {
    this.router = Router();
    this.departmentController = new DepartmentController();
    this.authenticateToken = new AuthenticateTokenMiddleware();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Read all departments
    this.router.get(
      "/",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("department:read"),
      this.departmentController.getAll,
    );

    // Read one department
    this.router.get(
      "/:id",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("department:read"),
      this.departmentController.getById,
    );

    // Create a department
    this.router.post(
      "/",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("department:create"),
      this.departmentController.create,
    );

    // Update a department
    this.router.patch(
      "/:id",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("department:update"),
      this.departmentController.update,
    );

    // Delete a department
    this.router.delete(
      "/:id",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("department:delete"),
      this.departmentController.delete,
    );
  }
}
