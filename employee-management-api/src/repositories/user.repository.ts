import { Repository } from "typeorm";

import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.entity.js";

export class UserRepository {
  private readonly repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  // Used during login: explicitly retrieve the password hash.
  public async findByEmail(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .leftJoinAndSelect("user.role", "role")
      .where("user.email = :email", { email })
      .getOne();
  }

  // Ordinary user lookup: password hash stays excluded.
  public async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        role: true,
      },
    });
  }
}
