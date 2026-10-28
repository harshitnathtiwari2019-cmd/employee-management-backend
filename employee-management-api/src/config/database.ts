import { DataSource } from "typeorm";
import { env } from "./env.js";

import { Department } from "../entities/Department.entity.js";
import { Employee } from "../entities/Employee.entity.js";
import { Role } from "../entities/Role.entity.js";
import { Permission } from "../entities/Permission.entity.js";
import { User } from "../entities/User.entity.js";
import { RolePermission } from "../entities/RolePermission.entity.js";
import { RefreshToken } from "../entities/RefreshToken.entity.js";
import { AuditLog } from "../entities/AuditLog.entity.js";
import { Activity } from "../entities/activity.entity.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,

  entities: [
    Department,
    Employee,
    Role,
    Permission,
    User,
    RolePermission,
    RefreshToken,
    AuditLog,
    Activity,
  ],

  migrations: ["dist/migrations/*.js"],

  synchronize: false,

  logging: env.NODE_ENV === "development",
});
