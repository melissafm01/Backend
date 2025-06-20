import { Router } from "express";
import {
  createTask,  
  deleteTask,
  getTask,
  getTasks,
  updateTask,
  getOthersTasks, //listar  actividades de usuarios//
  searchTask,    
  togglePromotion, //  activar/desactivar promoción
  getPromotedTasks //obtener actividades promocionadas
} 
from "../controllers/tasks.controllers.js";

import { auth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createTaskSchema,  promotionSchema } from "../schemas/task.schema.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

//creacion de actividad con imagen
router.post(
  "/tasks",
  auth,
  upload.single("image"), // Procesa la imagen si existe, si no, continúa
  validateSchema(createTaskSchema),
  createTask
);

//  ruta para obtener actividades promocionadas
router.get("/tasks/promoted", auth, getPromotedTasks);

//  ruta para activar y desactivar promocion
router.patch("/tasks/:id/promotion", auth, validateSchema(promotionSchema), togglePromotion);

//Listado de actividades de usuarios//
router.get("/tasks/others", auth, getOthersTasks);

router.get("/tasks/search", auth, searchTask);

//Creacion de actividades//
router.get("/tasks", auth, getTasks);
router.get("/tasks/:id", auth, getTask);
router.put("/tasks/:id", auth, updateTask);
router.delete("/tasks/:id", auth, deleteTask);

export default router;