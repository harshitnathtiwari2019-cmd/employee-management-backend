import { App } from "./app.js";
import { AppDataSource } from "./config/database.js";
import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { startActivityCron } from "./cron/activity.cron.js";
import { startMobileCron } from "./cron/mobile.cron.js";

class Server {
  private readonly application: App;

  constructor() {
    this.application = new App();
  }

  public async start(): Promise<void> {
    try {
      await AppDataSource.initialize();

      console.log("PostgreSQL connected successfully");
      startActivityCron();
      startMobileCron();

      await connectRedis();

      this.application.app.listen(env.PORT, () => {
        console.log(`Server is running at http://localhost:${env.PORT}`);
      });
    } catch (error) {
      console.error("Failed to start the application.");
      console.error(error);
      process.exitCode = 1;
    }
  }
}

const server = new Server();
void server.start();
