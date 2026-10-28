import express, { type Express } from "express";
import cookieParser from "cookie-parser";

import { DepartmentRoutes } from "./routes/department.routes.js";
import { EmployeeRoutes } from "./routes/employee.routes.js";
import { AuthRoutes } from "./routes/auth.routes.js";
import { ErrorMiddleware } from "./middlewares/error.middleware.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

export class App {
  public readonly app: Express;

  constructor() {
    this.app = express();

    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "1mb",
      }),
    );

    this.app.use(cookieParser());
  }

  private configureRoutes(): void {
    // Health check
    this.app.get("/health", (_req, res) => {
      res.status(200).json({
        success: true,
        message: "Employee Management API is running",
      });
    });

    // Swagger API documentation
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Application routes
    this.app.use("/api/departments", new DepartmentRoutes().router);

    this.app.use("/api/employees", new EmployeeRoutes().router);

    this.app.use("/api/auth", new AuthRoutes().router);

    // Keep the 404 handler after all valid routes
    this.app.use((_req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });
  }

  private configureErrorHandling(): void {
    const errorMiddleware = new ErrorMiddleware();
    this.app.use(errorMiddleware.handle);
  }
}
