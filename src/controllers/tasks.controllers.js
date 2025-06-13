import mongoose from "mongoose";
import Task from "../models/task.model.js";

// Obtener todas las tareas del usuario actual
export const getTasks = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "No autorizado" });

    const tasks = await Task.find({ user: req.user.id }).populate("user", "email _id");
    res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Crear una nueva tarea
export const createTask = async (req, res) => {
  try {
    const { title, description, date, place, responsible } = req.body;

    const now = new Date();
    const taskDate = new Date(date);

    // Verificar que la fecha no sea pasada
    if (taskDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: "No puedes crear una actividad con fecha pasada" });
    }

    const newTask = new Task({
      title,
      description,
      date: taskDate,
      place,
      responsible,
      user: req.user.id,
    });

    await newTask.save();
    res.json(newTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Eliminar una tarea por ID
export const deleteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "ID inválido" });

    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ message: "Task not found" });

    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar una tarea por ID

export const updateTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "ID inválido" });

    const { title, description, date, place, responsible, promocionada } = req.body;

    const updateData = {
      title,
      description,
      date,
      place,
      responsible,
      promocionada: !!promocionada,
      estado: promocionada ? "promocionadas" : "todas",
    };

  if (date) {
      const newDate = new Date(date);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Eliminar horas para comparar solo fechas

      if (newDate < now) {
        return res.status(400).json({ message: "No puedes establecer una fecha pasada para la tarea" });
      }

      updateData.date = newDate;
    }


    const taskUpdated = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
    return res.json(taskUpdated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Obtener actividades de otros usuarios
export const getOthersTasks = async (req, res) => {
  try {
    const activities = await Task.find({ user: { $ne: req.user.id } })
      .populate("user", "email _id")
      .select("-__v");

    res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades" });
  }
};

// Obtener una tarea por ID
export const getTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "ID inválido" });

    const task = await Task.findById(req.params.id)
      .populate("user", "email _id")
      .select("-__v");

    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    const response = task.toObject();
    response.isOwner = task.user._id.toString() === req.user.id;
    res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



// Buscar tareas con filtros
export const searchTask = async (req, res) => {

  try {
    const { q, date, place, estado } = req.query;
    const filters = {};
   
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (date) {
      const now = new Date();
      if (date === "pasadas") filters.date = { $lt: now };
      if (date === "proximas") filters.date = { $gt: now };
   
    }
    
    //busqueda por lugar
    if (place){
       filters.place = { $regex: place.trim(), $options: "i" };

    }

    if (estado === "promocionadas") {
      filters.$or = [
        { estado: "promocionadas" },
        { promocionada: true },
        { isPromoted: true },
      ];
    }

    const tasks = await Task.find(filters)
      .populate("user", "username email")
      .populate("asistentes", "username");

    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      date: task.date,
      place: task.place,
      estado: task.estado,
      totalAsistentes: task.asistentes?.length || 0,
      user: {
        username: task.user?.username,
        email: task.user?.email,
        _id: task.user?._id,
      },
      isOwner: task.user?._id?.toString() === req.user.id, // <--- agrega esto
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error("Error al buscar tarea:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Activar o desactivar promoción
export const togglePromotion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "ID inválido" });

    const { isPromoted, promotion } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No tienes permiso para modificar esta actividad" });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        isPromoted,
        estado: isPromoted ? "promocionadas" : "todas", // ✅ aquí el cambio
        ...(promotion && { promotion }),
      },
      { new: true }
    );

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Obtener tareas promocionadas
export const getPromotedTasks = async (req, res) => {
  try {
    const promotedTasks = await Task.find({ isPromoted: true })
      .populate("user", "email _id")
      .select("-__v");

    res.json(promotedTasks);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades promocionadas" });
  }
};