// routes/attendance.routes.js
import express from "express";
import {
  confirmAttendance,
  cancelAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance,
  checkAttendance,
  getUserAttendances,

} from "../controllers/attendance.controller.js";

import {auth} from "../middlewares/auth.middleware.js";

const router = express.Router();


router.get("/mis-asistencias", auth, getUserAttendances); 
router.get('/check/:taskId', auth, checkAttendance);
router.get("/export/:taskId", auth, exportAttendance);
router.get("/:taskId", auth, getAttendance); 


router.post("/confirm", auth, confirmAttendance);
router.delete("/cancel/:taskId", cancelAttendance);
router.put("/:id", auth, updateAttendance);
router.delete("/:id", auth, deleteAttendance);

export default router;