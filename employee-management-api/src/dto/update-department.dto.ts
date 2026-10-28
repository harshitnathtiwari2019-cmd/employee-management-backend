import { z } from "zod";

export const updateDepartmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Department name must contain at least 2 characters")
      .max(100, "Department name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .nullable()
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field must be provided",
  });

export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
