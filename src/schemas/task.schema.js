import { z } from "zod";

export const createTaskSchema = z.object({

  title: z.string({
    required_error: "Title is required",
  }) .max(90),
  description: z.string().optional(),
  date: z.string().optional(),
  place: z.string({
    required_error: "place is required",
  }) .max(40),
  responsible: z.array(z.string().max(70)).optional(), 

});


// Nuevo esquema para la promoción
export const promotionSchema = z.object({
  isPromoted: z.boolean({
    required_error: "isPromoted is required",
  }),
  promotion: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),

  }).optional()
});

// pubicar en redes sociales
export const shareSchema = z.object({
  socialNetwork: z.enum(["twitter", "facebook", "instagram"], {
    required_error: "Red social es requerida",
    invalid_type_error: "Red social no válida"
  }),
  description: z.string().max(250, {
    message: "La descripción no puede exceder 250 caracteres"
  })
});