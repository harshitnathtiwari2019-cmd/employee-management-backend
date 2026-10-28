import { z } from "zod";

export const employeeQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),

  departmentId: z
    .string()
    .uuid("Department ID must be a valid UUID")
    .optional(),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  jobTitle: z
    .string()
    .trim()
    .min(1, "Job title cannot be empty")
    .max(100, "Job title cannot exceed 100 characters")
    .optional(),

  sortBy: z
    .enum(["firstName", "lastName", "email", "joiningDate", "createdAt"])
    .default("lastName"),

  sortOrder: z.enum(["ASC", "DESC"]).default("ASC"),
});

export type EmployeeQueryDto = z.infer<typeof employeeQuerySchema>;
