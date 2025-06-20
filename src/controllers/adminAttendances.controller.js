import Attendance from "../models/attendance.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";

// Obtener todas las asistencias con filtros
export const getAllAttendances = async (req, res) => {
  try {
    const { activityId, userId, date } = req.query;
    const filters = {};
    
    if (activityId) {
      filters.task = activityId;
    }
    
    if (userId) {
      filters.user = userId;
    }
    
    if (date) {
      const dateFilter = new Date(date);
      filters.createdAt = {
        $gte: new Date(dateFilter.setHours(0, 0, 0)),
        $lte: new Date(dateFilter.setHours(23, 59, 59))
      };
    }
    
    const attendances = await Attendance.find(filters)
      .populate('task', 'title date')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener estadísticas de asistencias
export const getAttendanceStats = async (req, res) => {
  try {
    const totalAttendances = await Attendance.countDocuments();
    const uniqueUsersAttended = (await Attendance.distinct('user')).length;
    const activitiesWithAttendances = (await Attendance.distinct('task')).length;
    
    // Top 5 actividades con más asistentes
    const topActivities = await Attendance.aggregate([
      { $group: { _id: "$task", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "tasks", localField: "_id", foreignField: "_id", as: "task" } },
      { $unwind: "$task" },
      { $project: { _id: 0, activityId: "$task._id", title: "$task.title", count: 1 } }
    ]);
    
    // Top 5 usuarios que más asisten
    const topUsers = await Attendance.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 0, userId: "$user._id", username: "$user.username", count: 1 } }
    ]);
    
    res.json({
      totalAttendances,
      uniqueUsersAttended,
      activitiesWithAttendances,
      topActivities,
      topUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar asistencia
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    
    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};