import { z } from "zod";

export const registerSchema = z.object({

  username: z.string({
    required_error: "Username is required",
  }),

  email: z.string({
      required_error: "Email is required",
    })

    .email({
      message: "Email is not valid",
    }),
          phone: z.string({
    required_error: "Teléfono es requerido",
  })
  .min(10, {
    message: "El teléfono debe tener al menos 10 dígitos"
  }),

  password: z.string({
      required_error: "Password is required",
    })
    .min(6, {
      message: "Password must be at least 6 characters",
    }),
});



  
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});


// crear super admin
export const superAdminSchema = z.object({
  username: z.string({
    required_error: "Username is required",
  }),
  email: z.string({
      required_error: "Email is required",
    })
    .email({
      message: "Email is not valid",
    }),
  password: z.string({
      required_error: "Password is required",
    })
    .min(6, {
      message: "Password must be at least 6 characters",
    }),
  secretKey: z.string({
    required_error: "Secret key is required",
  }),
});