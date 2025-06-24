import { config } from "dotenv";
import Notification from "../models/notification.model.js";
import { sendPushNotification } from "../libs/sendPushNotification.js";

export const saveNotificationConfig = async (req, res) => {
  const { task, daysBefore } = req.body;
  const userId = req.user.id;

  try {
    const existing = await Notification.findOne({ user: userId, task });

    let config;
    if (existing) {
      existing.daysBefore = daysBefore;
      await existing.save();
      config = existing;
    } else {
      config = await Notification.create({ user: userId, task, daysBefore });
    }

    // Obtener usuario con su token
    const user = await User.findById(userId);
    if (user?.fcmToken) {
      await sendPushNotification(user.fcmToken, {
        title: 'Recordatorio configurado',
        body: `¡Recibirás una alerta ${daysBefore} día(s) antes de la tarea!`
      });
    }

    res.status(existing ? 200 : 201).json({
      message: existing ? "Configuración actualizada" : "Configuración guardada",
      config
    });
  } catch (err) {
    res.status(500).json({ message: "Error al guardar configuración", error: err.message });
  }
};

export const getUserNotifications = async (req, res) => {
        try{
            const configs = await Notification.find({user: req.user.id}).populate("task");
            res.json(configs);
        }catch(err){
            res.status(500).json({message: "Error al obtener configuraciones", error: err.message});
        }
    }

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.userId 
    });

    if (!notification) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.status(200).json({ message: "Notificación eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar notificación" });
  }
};

export const updateNotification = async (req, res) => {
  const { daysBefore } = req.body;
  const userId = req.user.id;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { daysBefore },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        message: "Notificación no encontrada o no tienes permisos",
        suggestion: "Verifica el ID y tus permisos"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notificación actualizada correctamente",
      data: notification
    });
  } catch (err) {res.status(500).json({ 
      success: false,
      message: "Error al actualizar notificación",
      error: err.message,
      systemSuggestion: "Intenta nuevamente o contacta al soporte"
    });
  }
};

