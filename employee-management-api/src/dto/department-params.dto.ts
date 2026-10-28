import { z } from "zod";

export const departmentIdSchema = z.object({
  id: z.string().uuid("Department ID must be a valid UUID"),
});
