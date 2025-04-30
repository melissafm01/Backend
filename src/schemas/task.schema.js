import { z } from "zod";

export const createTaskSchema = z.object({

  title: z.string({
    required_error: "Title is required",
  }),
  
  description: z.string().optional(),
  date: z.string().optional(),
  place: z.string().optional(), // Nuevo campo
  responsible: z.array(z.string()).optional(), // Nuevo campo
});
