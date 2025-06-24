import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import Attendance from "../models/attendance.model.js";

export const getAdminDashboard = async (req, res) => {
  try {
    // Obtener conteos básicos
    const [users, activities, attendances] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Attendance.countDocuments()
    ]);
    
    // Obtener actividades recientes pendientes
    const pendingActivities = await Task.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username');
    
    // Obtener últimos usuarios registrados
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt');
    
    // Obtener estadísticas de actividades por estado
    const activitiesByStatus = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Obtener actividades más populares
    const popularActivities = await Attendance.aggregate([
      { $group: { _id: "$task", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "tasks", localField: "_id", foreignField: "_id", as: "task" } },
      { $unwind: "$task" },
      { $project: { title: "$task.title", count: 1 } }
    ]);
    
    res.json({
      stats: {
        totalUsers: users,
        totalActivities: activities,
        totalAttendances: attendances
      },
      pendingActivities,
      recentUsers,
      activitiesByStatus,
      popularActivities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};