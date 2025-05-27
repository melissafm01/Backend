import express from "express";
import {
  confirmAttendance,
  cancelAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance
} from "../controllers/attendance.controller.js";
import { auth} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Rutas protegidas donde se requiere autenticación
router.post("/confirm",auth, confirmAttendance);
router.delete("/cancel/:taskId", cancelAttendance);

router.get("/:taskId", auth, getAttendance);
router.put("/:id", auth, updateAttendance);
router.delete("/:id", auth, deleteAttendance);
router.get("/export/:taskId", auth, exportAttendance);

export default router;
