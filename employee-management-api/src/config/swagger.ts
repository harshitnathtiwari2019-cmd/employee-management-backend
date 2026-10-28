import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Employee Management API",
      version: "1.0.0",
      description: "API documentation for the Employee Management System.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your access token.",
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Check API health",
          responses: {
            "200": {
              description: "API is running successfully",
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in",
          description: "Authenticate a user and obtain tokens.",
          responses: {
            "200": { description: "Login successful" },
            "400": { description: "Invalid request" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Authentication"],
          summary: "Refresh access token",
          responses: {
            "200": { description: "Token refreshed successfully" },
            "401": { description: "Refresh token is missing or invalid" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Log out",
          responses: {
            "200": { description: "Logout successful" },
            "401": { description: "Unauthorized" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
