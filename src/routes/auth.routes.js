import { Router } from "express";
import {
  login,
  logout,
  register,
  verifyToken,
  registerAdmin,
  createInitialSuperAdmin,
  verifyEmail,
  resendVerificationEmail,
  loginWithGoogle,
  sendPasswordResetEmail,
  resetPassword  ,
  cambiarFotoPerfil,
  eliminarFotoPerfil,
  cambiarInfoPerfil
} from "../controllers/auth.controller.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { loginSchema, registerSchema, superAdminSchema } from "../schemas/auth.schema.js";
import { auth } from "../middlewares/auth.middleware.js";
import { cambiarFoto } from "../middlewares/upload.middleware.js";

const router = Router();

// Ruta para crear el super admin inicial (NO requiere autenticación)
router.post("/superadmin/create", validateSchema(superAdminSchema), createInitialSuperAdmin);
// Permitir crear admin después de tener un superadmin autenticado
router.post(
  "/admin/register",
  async (req, res, next) => {
    // Middleware personalizado para verificar si necesita autenticación
    const User = (await import("../models/user.model.js")).default;
    
    try {
      const existingSuperAdmin = await User.findOne({ role: "superadmin" });
      
      if (!existingSuperAdmin) {
        // Si no hay superadmin, permitir crear admin sin autenticación
        return next();
      } else {
        // Si ya hay superadmin, requerir autenticación
        return auth(req, res, () => {
          authorizeRoles("superadmin")(req, res, next);
        });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  validateSchema(registerSchema),
  registerAdmin
);

router.post("/register", validateSchema(registerSchema), register);
router.post("/login", validateSchema(loginSchema), login);
router.get("/verify", verifyToken);
router.post("/logout", logout);

// Rutas de verificación de email
router.get("/verify-email", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

router.post("/google", loginWithGoogle);
router.post("/password-reset", sendPasswordResetEmail);
router.post("/reset-password", resetPassword); 


router.put('/profile/picture', auth, cambiarFoto,cambiarFotoPerfil)
router.put('/perfil', auth, cambiarInfoPerfil)
router.delete('/profile/picture', auth, eliminarFotoPerfil)
export default router;