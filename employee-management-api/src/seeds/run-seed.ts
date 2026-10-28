import { AppDataSource } from "../config/database.js";
import { InitialSeed } from "./InitialSeed.js";

class SeedRunner {
  public async run(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log("Database connected for seeding.");

      const seed = new InitialSeed();
      await seed.run(AppDataSource);

      console.log("Seed data inserted successfully.");
    } catch (error) {
      console.error("Seed process failed:", error);
      process.exitCode = 1;
    } finally {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    }
  }
}

const runner = new SeedRunner();
void runner.run();
