import Task from "../models/task.model.js";

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).populate(
      "user",
      "email _id"
    );
    res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, date, place, responsible } = req.body;
    const newTask = new Task({
      title,
      description,
      date,
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

export const deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask)
      return res.status(404).json({ message: "Task not found" });

    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, date, place, responsible } = req.body;
    const taskUpdated = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { title, description, date, place, responsible },
      { new: true }
    );
    return res.json(taskUpdated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Controlador para obtener actividades de otros usuarios
export const getOthersTasks = async (req, res) => {
  try {
    const activities = await Task.find({
      user: { $ne: req.user.id },
    })
      .populate("user", "email _id") // Trae solo el email del usuario creador
      .select("-__v");

    res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades" });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("user", "email _id") // Muestra email del creador
      .select("-__v");

    if (!task)
      return res.status(404).json({ message: "Actividad no encontrada" });

    // Agregar propiedad 'isOwner' para uso en frontend
    const response = task.toObject();
    response.isOwner = task.user._id.toString() === req.user.id;

    res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// promociónar

// Activar/desactivar promoción
export const togglePromotion = async (req, res) => {
  try {
    const { isPromoted, promotion } = req.body;

    // Verificar que el usuario sea dueño de la actividad
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: "Actividad no encontrada" });
    if (task.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar esta actividad" });
    // Actualizar el estado de promoción
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        isPromoted,
        ...(promotion && { promotion }),
      },
      { new: true }
    );
    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Obtener actividades promocionadas
export const getPromotedTasks = async (req, res) => {
  try {
    const promotedTasks = await Task.find({
      isPromoted: true,
    })
      .populate("user", "email _id")
      .select("-__v");

    res.json(promotedTasks);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al obtener actividades promocionadas" });
  }
};

// Añade esta función al final del archivo
export const generateShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { socialNetwork, description } = req.body;
    const userId = req.user.id;

    // Verificar existencia de la tarea
    const task = await Task.findById(id);
    if (!task)
      return res.status(404).json({ message: "Actividad no encontrada" });

    // Generar URL base del frontend
    const baseURL = process.env.BASE_FRONTEND_URL || "http://localhost:3000";
    const taskURL = `${baseURL}/tasks/${id}`;

    // Mapear redes sociales
    const socialFormats = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        description
      )}&url=${encodeURIComponent(taskURL)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        taskURL
      )}&quote=${encodeURIComponent(description)}`,
      instagram: `https://www.instagram.com/create/story?text=${encodeURIComponent(
        description + " " + taskURL
      )}`,
    };

    if (!socialFormats[socialNetwork]) {
      return res.status(400).json({ message: "Red social no soportada" });
    }

    res.json({
      success: true,
      shareUrl: socialFormats[socialNetwork],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al generar enlace: " + error.message });
  }
};
