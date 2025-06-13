// admin.routes.js
import { Router } from "express";
import {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deactivateAdmin,
  reactivateAdmin,
  deleteAdmin,
  getAdminStats
} from "../controllers/admin.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { updateAdminSchema } from "../schemas/admin.schema.js";

const router = Router();

// Todas las rutas requieren autenticación y rol de superadmin
router.use(auth);
router.use(authorizeRoles("superadmin"));

// Obtener estadísticas de administradores
router.get("/stats", getAdminStats);

// Obtener todos los administradores
router.get("/", getAllAdmins);

// Obtener administrador específico
router.get("/:id", getAdminById);

// Actualizar administrador
router.put("/:id", validateSchema(updateAdminSchema), updateAdmin);

// Desactivar administrador (cambiar a user)
router.patch("/:id/deactivate", deactivateAdmin);

// Reactivar administrador (cambiar de user a admin)
router.patch("/:id/reactivate", reactivateAdmin);

// Eliminar administrador completamente
router.delete("/:id", deleteAdmin);

export default router;