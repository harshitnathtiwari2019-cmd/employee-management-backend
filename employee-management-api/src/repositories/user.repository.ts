import { Repository } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.entity.js";

export class UserRepository {
  private readonly repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations: {
        role: true,
      },
    });
  }

  public async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        role: true,
      },
    });
  }
}
