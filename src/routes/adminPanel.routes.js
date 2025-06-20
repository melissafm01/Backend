import { Router } from "express";
import { 
  getAllActivities, 
  approveActivity, 
  rejectActivity, 
  toggleActivityPromotion,
  getActivityStats
} from "../controllers/adminTasks.controller.js";

import { 
  getAllUsers,
  getUserDetails,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats
} from "../controllers/adminUsers.controller.js";

import { 
  getAllAttendances,
  getAttendanceStats,
  deleteAttendance
} from "../controllers/adminAttendances.controller.js";

import { auth } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Middleware para todas las rutas
router.use(auth);
router.use(authorizeRoles('admin', 'superadmin'));

// Rutas para gestión de actividades
router.get("/activities", getAllActivities);   //obtiene todas las actividades 
router.patch("/activities/:id/approve", approveActivity); // Aprobar Actividad pendiente :
router.patch("/activities/:id/reject", rejectActivity);   //Rechazar Actividad pendiente:
router.patch("/activities/:id/promotion", toggleActivityPromotion);  //Activa/desactiva la promoción de una actividad.
router.get("/activities/stats", getActivityStats); //Devuelve estadísticas de actividades.

// Rutas para gestión de usuarios
router.get("/users/stats", getUserStats);  //Proporciona estadísticas de usuarios.
router.get("/users", getAllUsers);  //Lista todos los usuarios //
router.get("/users/:id", getUserDetails); // Obtiene detalles completos de un usuario.
router.put("/users/:id", updateUser);  // Actualiza información de usuario.
router.patch("/users/:id/status", toggleUserStatus); //Activa/desactiva un usuario.
router.delete("/users/:id", deleteUser); //Elimina un usuario permanentemente.

// Rutas para gestión de asistencias
router.get("/attendances", getAllAttendances); // Lista todas las asistencias registradas.
router.get("/attendances/stats", getAttendanceStats); //Muestra métricas de asistencias.
router.delete("/attendances/:id", deleteAttendance); //Elimina un registro de asistencia.  //Datos incluidos: Top 5 actividades más populares, Top 5 usuarios más participativos, Totales generales.//









export default router;