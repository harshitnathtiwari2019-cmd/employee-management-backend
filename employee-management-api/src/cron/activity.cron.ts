import cron from "node-cron";
import { IsNull } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { Employee } from "../entities/Employee.entity.js";
import { Activity } from "../entities/activity.entity.js";

export function startActivityCron(): void {
  cron.schedule("0 * * * *", async () => {
    const employeeRepository = AppDataSource.getRepository(Employee);
    const activityRepository = AppDataSource.getRepository(Activity);

    const employees = await employeeRepository.find({
      where: { profilePhoto: IsNull() },
    });

    for (const employee of employees) {
      await activityRepository.save({
        employeeId: employee.id,
        description: "Employee has no profile photo",
      });
    }

    console.log("Activity cron completed");
  });
}
