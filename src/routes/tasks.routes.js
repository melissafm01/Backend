import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
  getOthersTasks,
  searchTask,
  promoteTask,
 
  togglePromotion, //  activar/desactivar promoción
  getPromotedTasks //obtener actividades promocionadas
} 
from "../controllers/tasks.controllers.js";

import { auth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createTaskSchema,  promotionSchema } from "../schemas/task.schema.js";

const router = Router();

// Nueva ruta para obtener actividades promocionadas
router.get("/tasks/promoted", auth, getPromotedTasks);

// Nueva ruta para activar y desactivar promocion
router.patch("/tasks/:id/promotion", auth, validateSchema(promotionSchema), togglePromotion);


//Listado de actividades de usuarios//
router.get("/tasks/others", auth, getOthersTasks);



router.get("/tasks/search", auth, searchTask);
router.put ("/tasks/:id/promote", promoteTask);

//Creacion de actividades//
router.get("/tasks", auth, getTasks);
router.post("/tasks", auth, validateSchema(createTaskSchema), createTask);


router.get("/tasks/:id", auth, getTask);
router.put("/tasks/:id", auth, updateTask);
router.delete("/tasks/:id", auth, deleteTask);

export default router;
