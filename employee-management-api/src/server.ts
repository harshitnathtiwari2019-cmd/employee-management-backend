import { createServer, type Server as HttpServer } from "node:http";
import { App } from "./app.js";
import { AppDataSource } from "./config/database.js";
import { env } from "./config/env.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { startActivityCron, stopActivityCron } from "./cron/activity.cron.js";

import { startMobileCron, stopMobileCron } from "./cron/mobile.cron.js";

class Server {
  private readonly application: App;
  private httpServer: HttpServer | null = null;
  private shuttingDown = false;

  constructor() {
    this.application = new App();
  }

  public async start(): Promise<void> {
    try {
      // 1. Connect to PostgreSQL first.
      await AppDataSource.initialize();
      console.log("PostgreSQL connected successfully");

      // 2. Connect to Redis before starting background jobs.
      await connectRedis();
      console.log("Redis connected successfully");

      // 3. Start cron jobs only after both connections succeed.
      startActivityCron();
      startMobileCron();

      // 4. Start accepting HTTP requests last.
      this.httpServer = createServer(this.application.app);

      await new Promise<void>((resolve, reject) => {
        const server = this.httpServer!;

        const onError = (error: Error) => {
          server.off("listening", onListening);
          reject(error);
        };

        const onListening = () => {
          server.off("error", onError);
          resolve();
        };

        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(env.PORT);
      });

      console.log(`Server is running at http://localhost:${env.PORT}`);
    } catch (error) {
      console.error("Failed to start the application:", error);

      try {
        await this.cleanup();
      } catch (cleanupError) {
        console.error("Startup cleanup failed:", cleanupError);
      } finally {
        process.exit(1);
      }
    }
  }

  public async shutdown(signal: string): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    try {
      await this.stopHttpServer();
    } catch (error) {
      console.error("Failed to close HTTP server:", error);
    }

    await this.cleanup();
    process.exit(0);
  }

  private async stopHttpServer(): Promise<void> {
    if (!this.httpServer?.listening) return;

    await new Promise<void>((resolve, reject) => {
      this.httpServer!.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    console.log("HTTP server closed");
    this.httpServer = null;
  }

  private async cleanup(): Promise<void> {
    // Stop cron timers before closing their dependencies.
    stopActivityCron();
    stopMobileCron();

    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
        console.log("PostgreSQL connection closed");
      } catch (error) {
        console.error("Failed to close PostgreSQL:", error);
      }
    }

    if (redisClient.isOpen) {
      try {
        await redisClient.quit();
        console.log("Redis connection closed");
      } catch (error) {
        console.error("Failed to close Redis:", error);
      }
    }
  }
}

const server = new Server();

process.once("SIGINT", () => {
  void server.shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void server.shutdown("SIGTERM");
});

void server.start();
