import request from "supertest";
import { App } from "../src/app.js";
import { describe, it, expect } from "@jest/globals";

describe("Employee Management API", () => {
  const app = new App().app;

  describe("GET /health", () => {
    it("should return 200 when the API is healthy", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Employee Management API is running",
      });
    });
  });

  describe("Unknown routes", () => {
    it("should return 404 for an unknown route", async () => {
      const response = await request(app).get("/unknown-route");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "Route not found",
      });
    });
  });
});
