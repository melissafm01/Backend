import Attendance from '../models/attendance.model.js';
import mongoose from 'mongoose';


// confirmar asistencia a una actividad

export const confirmAttendance = async (req, res) => {
    try {
        const { taskId, name, email } = req.body;

        if (!taskId) {
            return res.status(400).json({ message: "taskId es requerido" });
        }

        const attendanceData = { task: taskId };

        if (req.user) {
            // Usuario autenticado
            attendanceData.user = req.user.id;
            attendanceData.name = req.user.name || name; // Usar name del body si no tiene en perfil
            attendanceData.email = req.user.email || email; // Usar email del body si no tiene en perfil
        } else {
            // Invitado
            if (!name || !email) {
                return res.status(400).json({
                    message: "Nombre y correo son requeridos para invitados"
                });
            }
            attendanceData.name = name;
            attendanceData.email = email;
        }

        // Usar el método estático para evitar duplicados
        const attendance = await Attendance.registerAttendance(attendanceData);
        
        return res.status(201).json({
            message: "Asistencia confirmada correctamente",
            attendance
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message.includes('Asistencia ya registrada') 
                   ? error.message 
                   : "Error al registrar asistencia",
            error: error.message
        });
    }
};

//cancelar asistencia a una actividad


export const cancelAttendance = async (req, res) => {
  const { taskId, email } = req.body;
  const userId = req.user?.id;

  // Validar el ID
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: "ID de actividad inválido" });
  }

  try {
    let result = null;

    if (email) {
      result = await Attendance.findOneAndDelete({ email, task: taskId });
    } else if (userId) {
      result = await Attendance.findOneAndDelete({ user: userId, task: taskId });
    } else {
      return res.status(400).json({ message: "Faltan datos para cancelar asistencia" });
    }

    if (!result) {
      return res.status(404).json({ message: "No se encontró la asistencia" });
    }

    res.json({ message: "Asistencia cancelada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al cancelar asistencia", error: error.message });
  }
};


//obtener asistencia a una actividad (creador o admin)
export const getAttendance = async (req, res) => {
    const { taskId } = req.params;

    try {
        const attendees = await Attendance.find({ task: taskId })
            .populate({
                path: 'user',
                select: 'name email -_id', // Solo traer name y email del usuario
                options: { lean: true }
            })
            .lean(); // Convertir a objetos simples

        // Normalizar la respuesta
        const normalizedAttendees = attendees.map(attendee => {
            return {
                name: attendee.user?.name || attendee.name,
                email: attendee.user?.email || attendee.email,
                isRegisteredUser: !!attendee.user,
                confirmed: attendee.confirmed,
                date: attendee.createdAt
            };
        });

        res.json(normalizedAttendees);
    } catch (error) {
        res.status(500).json({ 
            message: "Error al obtener asistencia", 
            error: error.message 
        });
    }
};

//editar asistente (nombre, email)

export const updateAttendance = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    try {
        const updated = await Attendance.findByIdAndUpdate(id, { name, email }, { new: true });
        if (!updated) return res.status(404).json({ message: "No se encontró la asistencia" });

        res.json({ message: "Asistencia actualizada correctamente", updated });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar asistencia", error: error.message });
    }
}

//Elimanr asistente 
export const deleteAttendance = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Attendance.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Asistente no encontrado" });

        res.json({ message: "Asistente eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar asistente", error: error.message });
    }
};