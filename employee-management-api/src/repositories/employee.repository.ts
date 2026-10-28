import { Repository, ILike, type EntityManager } from "typeorm";

import { AppDataSource } from "../config/database.js";
import { Employee } from "../entities/Employee.entity.js";
import type { EmployeeQueryDto } from "../dto/employee-query.dto.js";

export interface EmployeeAccessScope {
  employeeId?: string;
  departmentId?: string;
}

export class EmployeeRepository {
  private readonly repository: Repository<Employee>;

  constructor() {
    this.repository = AppDataSource.getRepository(Employee);
  }

  public async findByUserId(userId: string): Promise<Employee | null> {
    return this.repository.findOne({
      where: { user: { id: userId } },
      relations: {
        department: true,
        user: true,
      },
    });
  }

  public async findAll(): Promise<Employee[]> {
    return this.repository.find({
      relations: {
        department: true,
        user: true,
      },
      order: {
        lastName: "ASC",
        firstName: "ASC",
      },
    });
  }

  public async findPaginated(
    query: EmployeeQueryDto,
    scope?: EmployeeAccessScope,
  ): Promise<{ employees: Employee[]; total: number }> {
    const { page, limit, departmentId, isActive, jobTitle, sortBy, sortOrder } =
      query;

    const queryBuilder = this.repository
      .createQueryBuilder("employee")
      .leftJoinAndSelect("employee.department", "department")
      .leftJoinAndSelect("employee.user", "user");

    if (scope?.employeeId) {
      queryBuilder.andWhere("employee.id = :employeeId", {
        employeeId: scope.employeeId,
      });
    }

    if (scope?.departmentId) {
      queryBuilder.andWhere("department.id = :scopeDepartmentId", {
        scopeDepartmentId: scope.departmentId,
      });
    }

    if (departmentId !== undefined) {
      queryBuilder.andWhere("department.id = :departmentId", {
        departmentId,
      });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere("employee.isActive = :isActive", {
        isActive,
      });
    }

    if (jobTitle !== undefined) {
      queryBuilder.andWhere("employee.jobTitle ILIKE :jobTitle", {
        jobTitle: `%${jobTitle}%`,
      });
    }

    const allowedSortColumns: Record<string, string> = {
      firstName: "employee.firstName",
      lastName: "employee.lastName",
      email: "employee.email",
      jobTitle: "employee.jobTitle",
      joiningDate: "employee.joiningDate",
      createdAt: "employee.createdAt",
      updatedAt: "employee.updatedAt",
      isActive: "employee.isActive",
    };

    const sortColumn = allowedSortColumns[sortBy];

    if (!sortColumn) {
      throw new Error("Unsupported employee sort field");
    }

    queryBuilder
      .orderBy(sortColumn, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [employees, total] = await queryBuilder.getManyAndCount();

    return { employees, total };
  }

  public async findById(id: string): Promise<Employee | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        department: true,
        user: true,
      },
    });
  }

  public async findByEmail(email: string): Promise<Employee | null> {
    return this.repository.findOne({
      where: { email },
      relations: {
        department: true,
        user: true,
      },
    });
  }

  public async create(
    data: Partial<Employee>,
    manager?: EntityManager,
  ): Promise<Employee> {
    const repository = manager
      ? manager.getRepository(Employee)
      : this.repository;

    const employee = repository.create(data);

    return repository.save(employee);
  }

  public async update(
    employee: Employee,
    manager?: EntityManager,
  ): Promise<Employee> {
    const repository = manager
      ? manager.getRepository(Employee)
      : this.repository;

    return repository.save(employee);
  }
}
