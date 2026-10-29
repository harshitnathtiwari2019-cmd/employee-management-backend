import cron from "node-cron";
import { IsNull } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { Employee } from "../entities/Employee.entity.js";
import { Activity } from "../entities/activity.entity.js";

type CronTask = ReturnType<typeof cron.schedule>;

let mobileTask: CronTask | undefined;

export async function checkMobile(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    throw new Error("Database is not initialized");
  }

  const employeeRepository = AppDataSource.getRepository(Employee);
  const activityRepository = AppDataSource.getRepository(Activity);

  const employees = await employeeRepository.find({
    where: {
      mobile: IsNull(),
      user: { id: IsNull() },
    },
    relations: { user: true },
  });

  console.log(
    `[Mobile Cron] Found ${employees.length} employees without a mobile number and linked user`,
  );

  for (const employee of employees) {
    await activityRepository.save({
      employeeId: employee.id,
      description: "This user does not have mobile number",
    });
  }

  console.log("[Mobile Cron] Completed successfully");
}

export function startMobileCron(): void {
  if (mobileTask) return;

  mobileTask = cron.schedule("*/30 * * * *", async () => {
    console.log("[Mobile Cron] Started:", new Date().toISOString());

    try {
      await checkMobile();
    } catch (error) {
      console.error("[Mobile Cron] Failed:", error);
    }
  });

  console.log("[Mobile Cron] Scheduled");
}

export function stopMobileCron(): void {
  mobileTask?.stop();
  mobileTask = undefined;
  console.log("[Mobile Cron] Stopped");
}
