import cron from "node-cron";
import { IsNull } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { Employee } from "../entities/Employee.entity.js";
import { Activity } from "../entities/activity.entity.js";

export function startActivityCron(): void {
  cron.schedule("0 * * * *", async () => {
    console.log("[Activity Cron] Started:", new Date().toISOString());

    try {
      if (!AppDataSource.isInitialized) {
        throw new Error("Database is not initialized");
      }

      const employeeRepository = AppDataSource.getRepository(Employee);
      const activityRepository = AppDataSource.getRepository(Activity);

      const employees = await employeeRepository.find({
        where: { profilePhoto: IsNull() },
      });

      console.log(
        `[Activity Cron] Found ${employees.length} employees without profile photos`,
      );

      for (const employee of employees) {
        await activityRepository.save({
          employeeId: employee.id,
          description: "Employee has no profile photo",
        });
      }

      console.log("[Activity Cron] Completed successfully");
    } catch (error) {
      console.error("[Activity Cron] Failed:", error);
    }
  });
}
