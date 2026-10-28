import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AppDataSource } from "../config/database.js";
import { Permission } from "../entities/Permission.entity.js";
import { Role } from "../entities/Role.entity.js";
import { RolePermission } from "../entities/RolePermission.entity.js";

export class AuthorizePermissionMiddleware {
  public requirePermission(permissionName: string): RequestHandler {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        // Authentication middleware must run first.
        if (!req.user?.userId || !req.user.role) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }

        const roleRepository = AppDataSource.getRepository(Role);
        const permissionRepository = AppDataSource.getRepository(Permission);
        const rolePermissionRepository =
          AppDataSource.getRepository(RolePermission);

        // Find the user's current role in the database.
        const role = await roleRepository.findOne({
          where: { name: req.user.role },
        });

        if (!role) {
          res.status(403).json({
            success: false,
            message: "Access denied",
          });
          return;
        }

        // Find the permission required by this route.
        const permission = await permissionRepository.findOne({
          where: { name: permissionName },
        });

        if (!permission) {
          res.status(403).json({
            success: false,
            message: "Access denied",
          });
          return;
        }

        // Check whether the role has the required permission.
        const mapping = await rolePermissionRepository.findOne({
          where: {
            role: { id: role.id },
            permission: { id: permission.id },
          },
          relations: {
            role: true,
            permission: true,
          },
        });

        if (!mapping) {
          res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action",
          });
          return;
        }

        // Permission granted: continue to the controller.
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export const authorizePermission = new AuthorizePermissionMiddleware();
