import "dotenv/config";
import { AppDataSource } from "../config/database.js";
import { CreateAdmin } from "./CreateAdmin.js";

async function main(): Promise<void> {
  try {
    await AppDataSource.initialize();
    await new CreateAdmin().run();
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void main();
