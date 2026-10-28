import { Repository } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { Department } from "../entities/Department.entity.js";
import { Employee } from "../entities/Employee.entity.js";

export class DepartmentRepository {
  private readonly repository: Repository<Department>;

  constructor() {
    this.repository = AppDataSource.getRepository(Department);
  }

  public async findAll(): Promise<Department[]> {
    return this.repository.find({
      order: {
        name: "ASC",
      },
    });
  }

  public async findById(id: string): Promise<Department | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  public async findByName(name: string): Promise<Department | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  public async create(
    data: Pick<Department, "name" | "description">,
  ): Promise<Department> {
    const department = this.repository.create(data);
    return this.repository.save(department);
  }

  public async update(
    department: Department,
    data: Partial<Pick<Department, "name" | "description">>,
  ): Promise<Department> {
    Object.assign(department, data);
    return this.repository.save(department);
  }

  public async hasEmployees(departmentId: string): Promise<boolean> {
    const employeeCount = await AppDataSource.getRepository(Employee).count({
      where: {
        department: {
          id: departmentId,
        },
      },
    });

    return employeeCount > 0;
  }

  public async delete(department: Department): Promise<void> {
    await this.repository.remove(department);
  }
}
