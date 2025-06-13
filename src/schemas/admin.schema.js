// admin.schema.js
import { z } from "zod";

export const updateAdminSchema = z.object({
  username: z.string().min(1, "Username is required").optional(),
  email: z.string().email("Email is not valid").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
}).refine(data => {
  // Al menos uno de los campos debe estar presente
  return data.username || data.email || data.password;
}, {
  message: "Se debe proporcionar al menos un campo (nombre de usuario, correo electrónico o contraseña)",
});