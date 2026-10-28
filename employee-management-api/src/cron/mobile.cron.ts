import cron from "node-cron";
import { IsNull } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { Employee } from "../entities/Employee.entity.js";
import { Activity } from "../entities/activity.entity.js";

export async function checkMobile(): Promise<void> {
  const employeeRepository = AppDataSource.getRepository(Employee);
  const activityRepository = AppDataSource.getRepository(Activity);

  const employees = await employeeRepository.find({
    where: {
      mobile: IsNull(),
      user: { id: IsNull() },
    },
    relations: { user: true },
  });

  if (employees.length === 0) return;

  for (const employee of employees) {
    await activityRepository.save({
      employeeId: employee.id,
      description: "This user does not have mobile number",
    });
  }
}

export function startMobileCron(): void {
  cron.schedule("*/30 * * * *", async () => {
    try {
      await checkMobile();
    } catch (error) {
      console.error("Mobile cron failed:", error);
    }
  });
}
