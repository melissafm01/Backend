import express from "express";
import {
  confirmAttendance,
  cancelAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendance.controller.js";
import { auth} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Rutas protegidas donde se requiere autenticación
router.post("/confirm",auth, confirmAttendance);
router.post("/cancel", auth, cancelAttendance); // puede ser sin login

router.get("/:taskId", auth, getAttendance);
router.put("/:id", auth, updateAttendance);
router.delete("/:id", auth, deleteAttendance);

export default router;
