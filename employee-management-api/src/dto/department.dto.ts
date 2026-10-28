import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Department name must contain at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
});

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
