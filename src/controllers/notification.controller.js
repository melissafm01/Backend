import { config } from "dotenv";
import Notification from "../models/notification.model.js";

export const saveNotificationConfig = async (req, res) => {
    const {task,daysBefore} = req.body;
    const userId = req.user.id;

    try {
        const existing = await Notification.findOne({
            user: userId,
            task: task
        });
        if (existing) {
            existing.daysBefore = daysBefore;
            await existing.save();
            return res.json({message: "Configuración Actualizada", config: existing})
        } 
        const config = await Notification.create({
            user: userId,
            task: task,
            daysBefore,
        });
        res.status(201).json({message: "Configuración guardada", config})
     
        }catch(err){
            res.status(500).json({message: "Error al guardar configuración", error: err.message});
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

    

