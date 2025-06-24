import mongoose from "mongoose";
import Task from "../models/task.model.js";
import { bucket } from "../config/firebase.js";

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
    console.log("=== DEBUG: Datos recibidos ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const { title, description, place, date } = req.body;
    
    // === Procesar responsible ===
    let responsible = [];
    if (req.body.responsible) {
      try {
        // Si viene como string JSON, parsearlo
        if (typeof req.body.responsible === 'string') {
          responsible = JSON.parse(req.body.responsible);
        } else if (Array.isArray(req.body.responsible)) {
          responsible = req.body.responsible;
        }
        console.log("Responsible procesado:", responsible);
      } catch (parseError) {
        console.error("Error al parsear responsible:", parseError);
        // Si falla el parse, tratarlo como string simple
        responsible = req.body.responsible ? [req.body.responsible] : [];
      }
    }

    // === Validación de campos requeridos ===
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'El título es requerido' });
    }

    // === Validación de fecha ===
    if (!date) {
      return res.status(400).json({ message: 'La fecha es requerida' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);

    if (taskDate < today) {
      return res.status(400).json({ message: 'No puedes crear actividades con fecha pasada' });
    }

    // === Subida de imagen ===
    let imageUrl = null;

    if (req.file) {
      console.log("=== Procesando imagen ===");
      console.log("File info:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const filename = `task-images/${Date.now()}_${req.file.originalname}`;
      const blob = bucket.file(filename);

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', async () => {
          await blob.makePublic();
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          console.log("Imagen subida exitosamente:", imageUrl);
          resolve();
        });
        blobStream.end(req.file.buffer);
      });
    } else {
      console.log("=== Sin imagen - continuando sin imagen ===");
    }

    // === Crear la tarea en la base de datos ===
    console.log("=== Creando tarea en BD ===");
    console.log("Datos a guardar:", {
      title,
      description,
      place,
      date: taskDate,
      responsible,
      image: imageUrl,
      user: req.user.id
    });

    const newTask = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      place: place?.trim() || '',
      date: taskDate,
      responsible: responsible,
      image: imageUrl,
      user: req.user.id,
      status: 'pending'
    });

    const populatedTask = await newTask.populate('user', 'username email');

    console.log("=== Tarea creada exitosamente ===");
    console.log("Tarea creada:", populatedTask);

    res.status(201).json({ 
      message: 'Actividad creada con éxito', 
      task: populatedTask 
    });

  } catch (error) {
    console.error('=== ERROR en createTask ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      message: 'Error al crear la actividad',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      now.setHours(0, 0, 0, 0);

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
    const activities = await Task.find({ user: { $ne: req.user.id }, status: 'approved' })
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
    const filters = { status: 'approved'};
   
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
      .populate("user", "username email _id")
      .populate("asistentes", "username");

    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      date: task.date,
      place: task.place,
      estado: task.estado,
      isPromoted: task.isPromoted,
      image: task.image, 
      responsible: task.responsible,
      totalAsistentes: task.asistentes?.length || 0,
      user: {
        username: task.user?.username,
        email: task.user?.email,
        _id: task.user?._id,
      },
      isOwner: task.user?._id?.toString() === req.user.id,
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

const isOwner = task.user.toString() === req.user.id;
const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";

if (!isOwner && !isAdmin)
  return res.status(403).json({ message: "No tienes permiso para modificar esta actividad" });


    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        isPromoted,
        estado: isPromoted ? "promocionadas" : "todas",
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