import { Router } from "express";
import { saveNotificationConfig, getUserNotifications,deleteNotification,updateNotification } from "../controllers/notification.controller.js";
import {auth} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/notifications", auth, saveNotificationConfig);
router.get("/notifications", auth, getUserNotifications);
router.delete("/notifications/:id", auth, deleteNotification);
router.put("/notifications/:id", auth, updateNotification);


export default router;