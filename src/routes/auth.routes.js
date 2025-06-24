import { Router } from "express"; 
import {
  login,
  logout,
  register,
  verifyToken,
  registerAdmin,
  createInitialSuperAdmin , // <- Crear super admin inicial
 /*loginWithGoogle,
 sendPasswordResetEmail*/
} from "../controllers/auth.controller.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { loginSchema, registerSchema, superAdminSchema } from "../schemas/auth.schema.js";

import { auth } from "../middlewares/auth.middleware.js";
const router = Router();

// Ruta para crear el super admin inicial (NO requiere autenticación)
router.post("/superadmin/create",validateSchema(superAdminSchema), createInitialSuperAdmin);


router.post( "/admin/register", auth, //  debe estar autenticado
  authorizeRoles("superadmin"), //  solo superadmin puede hacer esto
  validateSchema(registerSchema),registerAdmin);

router.post("/register", validateSchema(registerSchema), register);
router.post("/login", validateSchema(loginSchema), login);
router.get("/verify", verifyToken);
router.post("/logout",  logout);
/*router.post("/google", loginWithGoogle);
router.post("/password-reset", sendPasswordResetEmail);*/
export default router;
