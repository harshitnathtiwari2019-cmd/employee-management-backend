import { randomUUID } from "node:crypto";
import { AppDataSource } from "../config/database.js";
import { User } from "../entities/User.entity.js";
import { Role } from "../entities/Role.entity.js";
import { PasswordService } from "../services/password.service.js";

export class CreateAdmin {
  public async run(): Promise<void> {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "Set ADMIN_EMAIL and ADMIN_PASSWORD in your local .env file.",
      );
    }

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters.");
    }

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error(`A user with email ${email} already exists.`);
    }

    const adminRole = await roleRepository.findOne({
      where: { name: "Admin" },
    });

    if (!adminRole) {
      throw new Error(
        "Admin role not found. Run your existing seed script first.",
      );
    }

    const passwordService = new PasswordService();
    const passwordHash = await passwordService.hashPassword(password);

    const admin = userRepository.create({
      id: randomUUID(),
      email,
      passwordHash,
      isActive: true,
      role: adminRole,
    });

    await userRepository.save(admin);

    console.log(`Admin user created successfully: ${email}`);
  }
}
