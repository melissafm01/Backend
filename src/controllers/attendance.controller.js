import mongoose from 'mongoose';
import Task from '../models/task.model.js';
import Attendance from '../models/attendance.model.js';
import Notification from '../models/notification.model.js';
import { sendEmail } from '../libs/sendEmail.js';

export const confirmAttendance = async (req, res) => {
  const session = await mongoose.startSession();
  let emailToSend = null;
  let emailSubject = "";
  let emailText = "";

  try {
    session.startTransaction();

    const { taskId, name, email } = req.body;
    if (!taskId) return res.status(400).json({ message: "taskId es requerido" });

    const task = await Task.findById(taskId).session(session);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    const isAuthenticated = !!req.user;
    const isCreator = isAuthenticated && task.user.toString() === req.user.id;
    const isManual = name && email;

    let attendanceData = { task: taskId };
    

    // Usuario autenticado invitando a otro
    if (isAuthenticated && isManual) {
      attendanceData = {
        ...attendanceData,
        name,
        email: email.toLowerCase(),
      };

    // Usuario autenticado confirmando asistencia propia
    } else if (isAuthenticated && !isCreator) {
      attendanceData = {
        ...attendanceData,
        user: req.user.id,
        name: req.user.name || name || 'Asistente',
        email: req.user.email || email,
      };

    // Invitado no autenticado
    } else if (!isAuthenticated) {
      if (!name || !email)
        return res.status(400).json({ message: "Nombre y correo requeridos" });

      attendanceData = {
        ...attendanceData,
        name,
        email: email.toLowerCase(),
      };

    // Creador intentando registrarse
    } else {
      return res.status(403).json({ message: "No puedes confirmar asistencia a tu propia actividad" });
    }

    // Verificación de duplicados
    const duplicate = await Attendance.findOne({
      task: taskId,
      $or: [
        ...(attendanceData.user ? [{ user: attendanceData.user }] : []),
        ...(attendanceData.email ? [{ email: attendanceData.email.toLowerCase() }] : []),
      ],
    }).session(session);

    if (duplicate) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Ya estás registrado para esta actividad" });
    }

    // Guardar asistencia
    const newAttendance = await Attendance.create([attendanceData], { session });

    
   

    // Preparar correo de confirmación para autenticados
    if (req.user && req.user.email) {
      emailToSend = req.user.email;
      emailSubject = `Confirmación de asistencia a: ${task.title}`;
      emailText = `Hola ${req.user.username || req.user.name || 'usuario'}, confirmaste tu participación en la actividad "${task.title}" el ${task.date.toLocaleDateString()}.`;
      console.log("📧 Correo preparado para usuario autenticado:", req.user.id);

    // Preparar correo para invitados
    } else if (!req.user && email) {
      emailToSend = email.toLowerCase();
      emailSubject = `Confirmación de asistencia a: ${task.title}`;
      emailText = `Hola ${name || 'invitado'}, has confirmado tu participación en la actividad "${task.title}" el ${task.date.toLocaleDateString()}.`;
      console.log("📧 Correo preparado para invitado:", emailToSend);
    }

    await session.commitTransaction();
    res.status(201).json({ 
      message: "Asistencia confirmada", 
      attendance: newAttendance[0],
   
      notificationInfo: {
        created: false,
        message: "Para recibir recordatorios, configura las notificaciones manualmente"
      }
    });

    // Enviar correo fuera de la transacción
    if (emailToSend) {
      try {
        await sendEmail({
          to: emailToSend,
          subject: emailSubject,
          text: emailText,
        });
        console.log("📧 Correo enviado a:", emailToSend);
      } catch (emailErr) {
        console.error("❌ Error al enviar correo:", emailErr.message);
      }
    }

  } catch (error) {
    await session.abortTransaction();
    console.error("Error al confirmar asistencia:", error);
    res.status(500).json({ message: "Error al confirmar asistencia" });
  } finally {
    session.endSession();
  }
};


// Cancelar asistencia
export const cancelAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "ID inválido" });

    const criteria = req.user?.id
      ? { task: taskId, user: req.user.id }
      : { task: taskId, email: req.body.email?.toLowerCase() };

    const deleted = await Attendance.findOneAndDelete(criteria);
    if (!deleted) return res.status(404).json({ message: "Asistencia no encontrada" });

    res.json({ message: "Asistencia cancelada" });
  } catch (error) {
    res.status(500).json({ message: "Error al cancelar asistencia" });
  }
};

// Obtener todos los asistentes de una actividad
export const getAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    const attendees = await Attendance.find({ task: taskId }).select("-__v");
    res.json(attendees);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener asistentes" });
  }
};

// Actualizar asistente manual
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) return res.status(404).json({ message: "Asistente no encontrado" });

    const task = await Task.findById(attendance.task);
    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    attendance.name = name || attendance.name;
    attendance.email = email?.toLowerCase() || attendance.email;

    await attendance.save();
    res.json({ message: "Asistente actualizado", attendance });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar asistente" });
  }
};

// Eliminar asistente manual
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) return res.status(404).json({ message: "Asistente no encontrado" });

    const task = await Task.findById(attendance.task);
    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    await attendance.deleteOne();
    res.json({ message: "Asistente eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar asistente" });
  }
};

// Exportar lista de asistencia (JSON o CSV básico)
export const exportAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Actividad no encontrada" });

    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ message: "No autorizado" });

    const attendees = await Attendance.find({ task: taskId }).select("name email createdAt");

    const csv = attendees
      .map(a => `${a.name},${a.email},${a.createdAt.toISOString()}`)
      .join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(`asistentes_${taskId}.csv`);
    return res.send(`Nombre,Correo,RegistradoEn\n${csv}`);
  } catch (error) {
    res.status(500).json({ message: "Error al exportar lista de asistencia" });
  }

};


// Verificar si un usuario ya está registrado para una actividad específica
export const checkAttendance = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { email } = req.query; // Recibir email como query parameter

    if (!taskId) {
      return res.status(400).json({ message: "taskId es requerido" });
    }

    // Construir criterio de búsqueda
    let criteria = { task: taskId };
    
    if (req.user?.id) {
      // Usuario autenticado: buscar por user ID o email
      criteria = {
        task: taskId,
        $or: [
          { user: req.user.id },
          { email: req.user.email?.toLowerCase() }
        ]
      };
    } else if (email) {
      // Usuario no autenticado: buscar solo por email
      criteria.email = email.toLowerCase();
    } else {
      return res.status(400).json({ 
        message: "Email requerido para usuarios no autenticados" 
      });
    }

    const attendance = await Attendance.findOne(criteria);
    
    res.json({ 
      isAttending: !!attendance,
      attendance: attendance || null
    });
  } catch (error) {
    console.error("Error al verificar asistencia:", error);
    res.status(500).json({ message: "Error al verificar asistencia" });
  }
};



export const getUserAttendances = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const criteria = {
      $or: [
        { user: userId },
        { email: req.user.email?.toLowerCase() }
      ]
    };

    // 4. Búsqueda con validación de referencias
    const attendances = await Attendance.find(criteria)
      .populate({
        path: 'task',
        select: 'title date',
        match: { _id: { $exists: true } } // Filtra tareas existentes
      })
      .lean();

    // 5. Filtrado de resultados inconsistentes
    const validAttendances = attendances.filter(att => 
      att.task !== null && 
      (att.user?.toString() === req.user.id || att.email === req.user.email?.toLowerCase())
    );

    res.json(validAttendances);
  } catch (error) {
    res.status(500).json({ 
      message: "Error al obtener asistencias",
      error: error.message
    });
  }
};


