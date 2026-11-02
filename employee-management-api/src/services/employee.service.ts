import { createHash } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import type { EntityManager } from "typeorm";

import { AppDataSource } from "../config/database.js";
import { Employee } from "../entities/Employee.entity.js";
import { AppError } from "../errors/AppError.js";
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from "../dto/employee.dto.js";
import type { EmployeeQueryDto } from "../dto/employee-query.dto.js";
import { validateAndSaveProfilePhoto } from "../middlewares/upload.middleware.js";
import { DepartmentRepository } from "../repositories/department.repository.js";
import {
  EmployeeRepository,
  type EmployeeAccessScope,
} from "../repositories/employee.repository.js";
import { AuditLogService } from "./audit-log.service.js";
import { cacheService } from "./cache.service.js";

const EMPLOYEE_CACHE_TTL_SECONDS = 300;

export interface EmployeeActor {
  userId: string;
  role: string;
}

export class EmployeeService {
  constructor(
    private readonly employeeRepository: EmployeeRepository = new EmployeeRepository(),
    private readonly departmentRepository: DepartmentRepository = new DepartmentRepository(),
    private readonly auditLogService: AuditLogService = new AuditLogService(),
  ) {}

  private async recordAudit(
    actor: EmployeeActor,
    action: string,
    employee: Employee,
    ipAddress?: string,
    metadata?: Record<string, unknown>,
    manager?: EntityManager,
  ): Promise<void> {
    await this.auditLogService.record(
      {
        userId: actor.userId,
        action,
        resourceType: "Employee",
        resourceId: employee.id,
        ipAddress: ipAddress ?? null,
        metadata: metadata ?? null,
      },
      manager,
    );
  }

  private createEmployeeListCacheKey(
    query: unknown,
    scope: EmployeeAccessScope,
  ): string {
    const normalizedInput = JSON.stringify({
      query,
      scope: {
        employeeId: scope.employeeId ?? null,
        departmentId: scope.departmentId ?? null,
      },
    });

    const filterHash = createHash("sha256")
      .update(normalizedInput)
      .digest("hex");

    return `employees:list:${filterHash}`;
  }

  private async getAccessScope(
    actor: EmployeeActor,
  ): Promise<EmployeeAccessScope> {
    const role = actor.role.toLowerCase();

    if (role === "admin" || role === "hr") {
      return {};
    }

    if (role === "manager") {
      const manager = await this.employeeRepository.findByUserId(actor.userId);

      if (!manager || !manager.isActive) {
        throw new AppError(
          "Your user account is not linked to an active employee record",
          403,
        );
      }

      return { departmentId: manager.department.id };
    }

    if (role === "employee") {
      const employee = await this.employeeRepository.findByUserId(actor.userId);

      if (!employee || !employee.isActive) {
        throw new AppError(
          "Your user account is not linked to an active employee record",
          403,
        );
      }

      return { employeeId: employee.id };
    }

    throw new AppError("Access denied", 403);
  }

  private async assertCanAccessEmployee(
    employee: Employee,
    actor: EmployeeActor,
  ): Promise<void> {
    const scope = await this.getAccessScope(actor);

    if (scope.employeeId && employee.id !== scope.employeeId) {
      throw new AppError("You are not allowed to access this employee", 403);
    }

    if (scope.departmentId && employee.department.id !== scope.departmentId) {
      throw new AppError("You are not allowed to access this employee", 403);
    }
  }

  private async invalidateEmployeeCache(employeeId?: string): Promise<void> {
    if (employeeId) {
      await cacheService.delete(`employee:${employeeId}`);
    }

    await cacheService.deleteByPattern("employees:list:*");
  }

  public async getAllEmployees(actor: EmployeeActor): Promise<Employee[]> {
    const scope = await this.getAccessScope(actor);
    const cacheKey = this.createEmployeeListCacheKey(
      { operation: "all" },
      scope,
    );

    const cachedEmployees = await cacheService.get<Employee[]>(cacheKey);

    if (cachedEmployees !== null) {
      return cachedEmployees;
    }

    const employees = await this.employeeRepository.findAll();

    const filteredEmployees = employees.filter((employee) => {
      if (scope.employeeId && employee.id !== scope.employeeId) {
        return false;
      }

      if (scope.departmentId && employee.department.id !== scope.departmentId) {
        return false;
      }

      return true;
    });

    await cacheService.set(
      cacheKey,
      filteredEmployees,
      EMPLOYEE_CACHE_TTL_SECONDS,
    );

    return filteredEmployees;
  }

  public async getEmployeeById(
    id: string,
    actor: EmployeeActor,
  ): Promise<Employee> {
    const cacheKey = `employee:${id}`;
    const cachedEmployee = await cacheService.get<Employee>(cacheKey);

    if (cachedEmployee !== null) {
      await this.assertCanAccessEmployee(cachedEmployee, actor);
      return cachedEmployee;
    }

    const employee = await this.employeeRepository.findById(id);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    await this.assertCanAccessEmployee(employee, actor);

    await cacheService.set(cacheKey, employee, EMPLOYEE_CACHE_TTL_SECONDS);

    return employee;
  }

  public async createEmployee(
    data: CreateEmployeeDto,
    actor: EmployeeActor,
    ipAddress?: string,
  ): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findByEmail(
      data.email,
    );

    if (existingEmployee) {
      throw new AppError("An employee with this email already exists", 409);
    }

    const department = await this.departmentRepository.findById(
      data.departmentId,
    );

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    const createdEmployee = await AppDataSource.transaction(async (manager) => {
      const employee = new Employee();

      employee.firstName = data.firstName;
      employee.lastName = data.lastName;
      employee.email = data.email;
      employee.jobTitle = data.jobTitle;
      employee.joiningDate = data.joiningDate;
      employee.isActive = true;
      employee.department = department;

      const created = await this.employeeRepository.create(employee, manager);

      await this.recordAudit(
        actor,
        "EMPLOYEE_CREATED",
        created,
        ipAddress,
        { departmentId: department.id },
        manager,
      );

      return created;
    });

    await this.invalidateEmployeeCache();

    return createdEmployee;
  }

  public async getPaginatedEmployees(
    query: EmployeeQueryDto,
    actor: EmployeeActor,
  ): Promise<{
    data: Employee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const scope = await this.getAccessScope(actor);
    const cacheKey = this.createEmployeeListCacheKey(
      { operation: "paginated", ...query },
      scope,
    );

    const cachedResult = await cacheService.get<{
      data: Employee[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(cacheKey);

    if (cachedResult !== null) {
      return cachedResult;
    }

    const { employees, total } = await this.employeeRepository.findPaginated(
      query,
      scope,
    );

    const result = {
      data: employees,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };

    await cacheService.set(cacheKey, result, EMPLOYEE_CACHE_TTL_SECONDS);

    return result;
  }

  public async updateProfilePhoto(
    employeeId: string,
    file: Express.Multer.File,
    actor: EmployeeActor,
    ipAddress?: string,
  ): Promise<Employee> {
    const employee = await this.getEmployeeById(employeeId, actor);
    const filename = await validateAndSaveProfilePhoto(file);
    const previousPhoto = employee.profilePhoto;

    let updatedEmployee: Employee;

    try {
      updatedEmployee = await AppDataSource.transaction(async (manager) => {
        employee.profilePhoto = filename;

        const updated = await this.employeeRepository.update(employee, manager);

        await this.recordAudit(
          actor,
          "EMPLOYEE_PROFILE_PHOTO_UPDATED",
          updated,
          ipAddress,
          undefined,
          manager,
        );

        return updated;
      });
    } catch (error: unknown) {
      const newPath = path.resolve(
        process.cwd(),
        "uploads",
        "profiles",
        filename,
      );

      await unlink(newPath).catch(() => undefined);
      throw error;
    }

    await this.invalidateEmployeeCache(updatedEmployee.id);

    if (previousPhoto && previousPhoto !== filename) {
      const previousPath = path.resolve(
        process.cwd(),
        "uploads",
        "profiles",
        previousPhoto,
      );

      await unlink(previousPath).catch(() => undefined);
    }

    return updatedEmployee;
  }

  public async updateEmployee(
    id: string,
    data: UpdateEmployeeDto,
    actor: EmployeeActor,
    ipAddress?: string,
  ): Promise<Employee> {
    const employee = await this.getEmployeeById(id, actor);
    const changedFields: string[] = [];

    if (data.email !== undefined) {
      const existingEmployee = await this.employeeRepository.findByEmail(
        data.email,
      );

      if (existingEmployee && existingEmployee.id !== employee.id) {
        throw new AppError("An employee with this email already exists", 409);
      }

      employee.email = data.email;
      changedFields.push("email");
    }

    if (data.firstName !== undefined) {
      employee.firstName = data.firstName;
      changedFields.push("firstName");
    }

    if (data.lastName !== undefined) {
      employee.lastName = data.lastName;
      changedFields.push("lastName");
    }

    if (data.jobTitle !== undefined) {
      employee.jobTitle = data.jobTitle;
      changedFields.push("jobTitle");
    }

    if (data.joiningDate !== undefined) {
      employee.joiningDate = data.joiningDate;
      changedFields.push("joiningDate");
    }

    if (data.departmentId !== undefined) {
      const department = await this.departmentRepository.findById(
        data.departmentId,
      );

      if (!department) {
        throw new AppError("Department not found", 404);
      }

      if (
        actor.role.toLowerCase() === "manager" &&
        department.id !== employee.department.id
      ) {
        throw new AppError(
          "Managers cannot move employees to another department",
          403,
        );
      }

      employee.department = department;
      changedFields.push("departmentId");
    }

    const updatedEmployee = await AppDataSource.transaction(async (manager) => {
      const updated = await this.employeeRepository.update(employee, manager);

      await this.recordAudit(
        actor,
        "EMPLOYEE_UPDATED",
        updated,
        ipAddress,
        { changedFields },
        manager,
      );

      return updated;
    });

    await this.invalidateEmployeeCache(updatedEmployee.id);

    return updatedEmployee;
  }

  public async deactivateEmployee(
    id: string,
    actor: EmployeeActor,
    ipAddress?: string,
  ): Promise<Employee> {
    const employee = await this.getEmployeeById(id, actor);

    const updatedEmployee = await AppDataSource.transaction(async (manager) => {
      employee.isActive = false;

      const updated = await this.employeeRepository.update(employee, manager);

      await this.recordAudit(
        actor,
        "EMPLOYEE_DEACTIVATED",
        updated,
        ipAddress,
        undefined,
        manager,
      );

      return updated;
    });

    await this.invalidateEmployeeCache(updatedEmployee.id);

    return updatedEmployee;
  }
}
