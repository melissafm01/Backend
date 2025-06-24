import { z } from "zod";

export const createTaskSchema = z.object({

  title: z.string({ required_error: "Title is required",}) .max(90),
  description: z.string().optional(),
  date: z.string().optional(),
  place: z.string({ required_error: "place is required", }) .max(30),
   responsible: z.string({ required_error: "Responsable es requerido", })
  //responsible: z.array(z.string().max(70)).optional(), 
});


// esquema para la promoción
export const promotionSchema = z.object({
  isPromoted: z.boolean({
    required_error: "isPromoted is required",
  }),
  promotion: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),

  }).optional()
});