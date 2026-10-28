import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  EmployeeService,
  type EmployeeActor,
} from "../services/employee.service.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../dto/employee.dto.js";
import { employeeQuerySchema } from "../dto/employee-query.dto.js";
import { AppError } from "../errors/AppError.js";

const employeeIdSchema = z.object({
  id: z.string().uuid("Employee ID must be a valid UUID"),
});

export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService = new EmployeeService(),
  ) {}

  private getActor(req: Request): EmployeeActor {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    return {
      userId: req.user.userId,
      role: req.user.role,
    };
  }

  public readonly getAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const queryResult = employeeQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid employee query parameters",
          errors: queryResult.error.issues,
        });
        return;
      }

      const result = await this.employeeService.getPaginatedEmployees(
        queryResult.data,
        this.getActor(req),
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public readonly uploadProfilePhoto = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = employeeIdSchema.safeParse({
        id: req.params.id,
      });

      if (!params.success) {
        res.status(400).json({
          success: false,
          message: "Invalid employee ID",
          errors: params.error.issues,
        });
        return;
      }

      if (!req.file) {
        throw new AppError(
          "Please upload a profile photo using the profilePhoto field",
          400,
        );
      }

      const employee = await this.employeeService.updateProfilePhoto(
        params.data.id,
        req.file,
        this.getActor(req),
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: "Profile photo uploaded successfully",
        data: {
          employeeId: employee.id,
          profilePhoto: employee.profilePhoto,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public readonly getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = employeeIdSchema.safeParse({
        id: req.params.id,
      });

      if (!params.success) {
        res.status(400).json({
          success: false,
          message: "Invalid employee ID",
          errors: params.error.issues,
        });
        return;
      }

      const employee = await this.employeeService.getEmployeeById(
        params.data.id,
        this.getActor(req),
      );

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public readonly create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = createEmployeeSchema.safeParse(req.body);

      if (!body.success) {
        res.status(400).json({
          success: false,
          message: "Invalid employee data",
          errors: body.error.issues,
        });
        return;
      }

      const employee = await this.employeeService.createEmployee(
        body.data,
        this.getActor(req),
        req.ip,
      );

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: employee,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public readonly update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = employeeIdSchema.safeParse({
        id: req.params.id,
      });

      if (!params.success) {
        res.status(400).json({
          success: false,
          message: "Invalid employee ID",
          errors: params.error.issues,
        });
        return;
      }

      const body = updateEmployeeSchema.safeParse(req.body);

      if (!body.success) {
        res.status(400).json({
          success: false,
          message: "Invalid employee data",
          errors: body.error.issues,
        });
        return;
      }

      const employee = await this.employeeService.updateEmployee(
        params.data.id,
        body.data,
        this.getActor(req),
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        data: employee,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public readonly deactivate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = employeeIdSchema.safeParse({
        id: req.params.id,
      });

      if (!params.success) {
        res.status(400).json({
          success: false,
          message: "Invalid employee ID",
          errors: params.error.issues,
        });
        return;
      }

      const employee = await this.employeeService.deactivateEmployee(
        params.data.id,
        this.getActor(req),
        req.ip,
      );

      res.status(200).json({
        success: true,
        message: "Employee deactivated successfully",
        data: employee,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
