import { z } from "zod";

export const createEmployeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must contain at least 2 characters")
    .max(100, "First name cannot exceed 100 characters"),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must contain at least 2 characters")
    .max(100, "Last name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters")
    .transform((value) => value.toLowerCase()),

  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must contain at least 2 characters")
    .max(100, "Job title cannot exceed 100 characters"),

  joiningDate: z
    .string()
    .date("Joining date must be a valid date in YYYY-MM-DD format"),

  departmentId: z.string().uuid("Department ID must be a valid UUID"),
});

export const updateEmployeeSchema = z
  .object({
    firstName: createEmployeeSchema.shape.firstName.optional(),
    lastName: createEmployeeSchema.shape.lastName.optional(),
    email: createEmployeeSchema.shape.email.optional(),
    jobTitle: createEmployeeSchema.shape.jobTitle.optional(),
    joiningDate: createEmployeeSchema.shape.joiningDate.optional(),
    departmentId: createEmployeeSchema.shape.departmentId.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
