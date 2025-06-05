import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  place: z.string({ message: "place is required" }).max(30),
  responsible: z.array(z.string().max(70)).optional(),
});

// Nuevo esquema para la promoción
export const promotionSchema = z.object({
  isPromoted: z.boolean({
    required_error: "isPromoted is required",
  }),
  promotion: z
    .object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
});
