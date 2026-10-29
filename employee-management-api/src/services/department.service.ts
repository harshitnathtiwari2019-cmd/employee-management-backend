import { redisClient } from "../config/redis.js";
import { Department } from "../entities/Department.entity.js";
import { DepartmentRepository } from "../repositories/department.repository.js";
import type { CreateDepartmentDto } from "../dto/department.dto.js";
import type { UpdateDepartmentDto } from "../dto/update-department.dto.js";
import { AppError } from "../errors/AppError.js";

const DEPARTMENT_LIST_KEY = "departments:all";
const DEPARTMENT_KEY_PREFIX = "department:";
const CACHE_TTL_SECONDS = 300;

export class DepartmentService {
  constructor(
    private readonly departmentRepository: DepartmentRepository = new DepartmentRepository(),
  ) {}

  private async invalidateDepartmentCache(id?: string): Promise<void> {
    if (!redisClient.isReady) return;

    await redisClient.del(DEPARTMENT_LIST_KEY);

    if (id) {
      await redisClient.del(`${DEPARTMENT_KEY_PREFIX}${id}`);
    }
  }

  /**
   * Database-only lookup for write operations.
   * Never returns a JSON-parsed Redis object.
   */
  private async getDepartmentFromDatabase(id: string): Promise<Department> {
    const department = await this.departmentRepository.findById(id);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    return department;
  }

  public async getAllDepartments(): Promise<Department[]> {
    if (redisClient.isReady) {
      const cached = await redisClient.get(DEPARTMENT_LIST_KEY);

      if (cached) {
        return JSON.parse(cached) as Department[];
      }
    }

    const departments = await this.departmentRepository.findAll();

    if (redisClient.isReady) {
      await redisClient.set(DEPARTMENT_LIST_KEY, JSON.stringify(departments), {
        EX: CACHE_TTL_SECONDS,
      });
    }

    return departments;
  }

  public async getDepartmentById(id: string): Promise<Department> {
    const cacheKey = `${DEPARTMENT_KEY_PREFIX}${id}`;

    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as Department;
      }
    }

    const department = await this.getDepartmentFromDatabase(id);

    if (redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(department), {
        EX: CACHE_TTL_SECONDS,
      });
    }

    return department;
  }

  public async createDepartment(
    data: CreateDepartmentDto,
  ): Promise<Department> {
    const normalizedName = data.name.trim();

    const existingDepartment =
      await this.departmentRepository.findByName(normalizedName);

    if (existingDepartment) {
      throw new AppError("Department already exists", 409);
    }

    const department = await this.departmentRepository.create({
      name: normalizedName,
      description: data.description?.trim() || null,
    });

    await this.invalidateDepartmentCache();

    return department;
  }

  public async updateDepartment(
    id: string,
    data: UpdateDepartmentDto,
  ): Promise<Department> {
    // Always read fresh entity data from PostgreSQL before writing.
    const department = await this.getDepartmentFromDatabase(id);

    if (data.name !== undefined) {
      const normalizedName = data.name.trim();

      const existingDepartment =
        await this.departmentRepository.findByName(normalizedName);

      if (existingDepartment && existingDepartment.id !== department.id) {
        throw new AppError("Department already exists", 409);
      }

      department.name = normalizedName;
    }

    if (data.description !== undefined) {
      department.description = data.description?.trim() || null;
    }

    const updatedDepartment = await this.departmentRepository.update(
      department,
      {
        name: department.name,
        description: department.description,
      },
    );

    await this.invalidateDepartmentCache(id);

    return updatedDepartment;
  }

  public async deleteDepartment(id: string): Promise<void> {
    // Always read fresh entity data from PostgreSQL before deleting.
    const department = await this.getDepartmentFromDatabase(id);

    const hasEmployees = await this.departmentRepository.hasEmployees(
      department.id,
    );

    if (hasEmployees) {
      throw new AppError(
        "Cannot delete department because employees are assigned to it",
        409,
      );
    }

    await this.departmentRepository.delete(department);

    await this.invalidateDepartmentCache(id);
  }
}
