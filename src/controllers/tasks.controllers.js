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
      .populate("user", "email _id") 
      .select("-__v");

    res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades" });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("user", "email _id") 
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
