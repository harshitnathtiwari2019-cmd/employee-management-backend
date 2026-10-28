import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller.js";
import { profilePhotoUpload } from "../middlewares/upload.middleware.js";
import { AuthenticateTokenMiddleware } from "../middlewares/authenticate-token.middleware.js";
import { authorizePermission } from "../middlewares/authorize-permission.middleware.js";

export class EmployeeRoutes {
  public readonly router: Router;

  private readonly employeeController: EmployeeController;
  private readonly authenticateToken: AuthenticateTokenMiddleware;

  constructor() {
    this.router = Router();
    this.employeeController = new EmployeeController();
    this.authenticateToken = new AuthenticateTokenMiddleware();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Read employees
    this.router.get(
      "/",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("employee:read"),
      this.employeeController.getAll,
    );

    this.router.get(
      "/:id",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("employee:read"),
      this.employeeController.getById,
    );

    // Create an employee
    this.router.post(
      "/",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("employee:create"),
      this.employeeController.create,
    );

    // Update an employee
    this.router.patch(
      "/:id",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("employee:update"),
      this.employeeController.update,
    );

    // Deactivate an employee
    this.router.patch(
      "/:id/deactivate",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("employee:delete"),
      this.employeeController.deactivate,
    );

    // Upload or replace an employee's profile photo
    this.router.post(
      "/:id/profile-photo",
      this.authenticateToken.handle,
      authorizePermission.requirePermission("employee:update"),
      profilePhotoUpload,
      this.employeeController.uploadProfilePhoto,
    );
  }
}
