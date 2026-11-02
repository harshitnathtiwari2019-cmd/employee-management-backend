import { Department } from "../entities/Department.entity.js";
import { DepartmentRepository } from "../repositories/department.repository.js";
import type { CreateDepartmentDto } from "../dto/department.dto.js";
import type { UpdateDepartmentDto } from "../dto/update-department.dto.js";
import { AppError } from "../errors/AppError.js";
import { cacheService } from "./cache.service.js";

const DEPARTMENT_LIST_KEY = "departments:all";
const DEPARTMENT_KEY_PREFIX = "department:";
const DEPARTMENT_CACHE_TTL_SECONDS = 300;

export class DepartmentService {
  constructor(
    private readonly departmentRepository: DepartmentRepository = new DepartmentRepository(),
  ) {}

  private async invalidateDepartmentCache(id?: string): Promise<void> {
    if (id) {
      await cacheService.delete(`${DEPARTMENT_KEY_PREFIX}${id}`);
    }

    await cacheService.delete(DEPARTMENT_LIST_KEY);
    await cacheService.deleteByPattern("departments:list:*");
  }

  private async getDepartmentFromDatabase(id: string): Promise<Department> {
    const department = await this.departmentRepository.findById(id);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    return department;
  }

  public async getAllDepartments(): Promise<Department[]> {
    const cached = await cacheService.get<Department[]>(DEPARTMENT_LIST_KEY);

    if (cached !== null) {
      return cached;
    }

    const departments = await this.departmentRepository.findAll();

    await cacheService.set(
      DEPARTMENT_LIST_KEY,
      departments,
      DEPARTMENT_CACHE_TTL_SECONDS,
    );

    return departments;
  }

  public async getDepartmentById(id: string): Promise<Department> {
    const cacheKey = `${DEPARTMENT_KEY_PREFIX}${id}`;
    const cached = await cacheService.get<Department>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const department = await this.getDepartmentFromDatabase(id);

    await cacheService.set(cacheKey, department, DEPARTMENT_CACHE_TTL_SECONDS);

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
