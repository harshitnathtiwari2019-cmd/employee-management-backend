import type { Request, Response, NextFunction } from "express";

import { DepartmentService } from "../services/department.service.js";
import { createDepartmentSchema } from "../dto/department.dto.js";
import { departmentIdSchema } from "../dto/department-params.dto.js";
import { updateDepartmentSchema } from "../dto/update-department.dto.js";

export class DepartmentController {
  constructor(
    private readonly departmentService: DepartmentService = new DepartmentService(),
  ) {}

  public getAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const departments = await this.departmentService.getAllDepartments();

      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = departmentIdSchema.safeParse({
        id: req.params.id,
      });

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid department ID",
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const department = await this.departmentService.getDepartmentById(
        parsed.data.id,
      );

      res.status(200).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const paramsResult = departmentIdSchema.safeParse({
        id: req.params.id,
      });

      if (!paramsResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid department ID",
          errors: paramsResult.error.issues,
        });
        return;
      }

      const bodyResult = updateDepartmentSchema.safeParse(req.body);

      if (!bodyResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid department data",
          errors: bodyResult.error.issues,
        });
        return;
      }

      const department = await this.departmentService.updateDepartment(
        paramsResult.data.id,
        bodyResult.data,
      );

      res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: department,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public readonly delete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const paramsResult = departmentIdSchema.safeParse({
        id: req.params.id,
      });

      if (!paramsResult.success) {
        res.status(400).json({
          success: false,
          message: "Invalid department ID",
          errors: paramsResult.error.issues,
        });
        return;
      }

      await this.departmentService.deleteDepartment(paramsResult.data.id);

      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = createDepartmentSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid department data",
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const department = await this.departmentService.createDepartment(
        parsed.data,
      );

      res.status(201).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };
}
