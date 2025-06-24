import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Obtener todas las actividades
export const getAllActivities = async (req, res) => {
  try {
    const { status, promoted, search, date } = req.query;
    const filters = {};

    // filtros
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filters.status = status;
    }
    
    if (promoted === 'true') {
      filters.isPromoted = true;
    } else if (promoted === 'false') {
      filters.isPromoted = false;
    }
    
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (date) {
      const dateFilter = new Date(date);
      filters.date = {
        $gte: new Date(dateFilter.setHours(0, 0, 0)),
        $lte: new Date(dateFilter.setHours(23, 59, 59))
      };
    }

    const activities = await Task.find(filters)
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Aprobar una actividad
export const approveActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Task.findByIdAndUpdate(
      id,
      { status: 'approved', approvedAt: new Date(), approvedBy: req.user.id },
      { new: true }
    ).populate('user', 'username email');
    
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    
    res.json({
      message: "Activity approved successfully",
      activity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rechazar una actividad
export const rejectActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const activity = await Task.findByIdAndUpdate(
      id,
      { 
        status: 'rejected', 
        rejectedAt: new Date(), 
        rejectedBy: req.user.id,
        rejectionReason: reason 
      },
      { new: true }
    ).populate('user', 'username email');
    
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    
    res.json({
      message: "Activity rejected successfully",
      activity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Promocionar/despromocionar actividad
export const toggleActivityPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { promotion } = req.body;

    // Solo admins o superadmins pueden promocionar
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: "No tienes permiso para realizar esta acción" });
    }

    const activity = await Task.findByIdAndUpdate(
      id,
      { isPromoted: promotion },
      { new: true }
    ).populate('user', 'username email');

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.json({
      message: `Activity ${promotion ? 'promoted' : 'unpromoted'} successfully`,
      activity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Obtener estadísticas de actividades
export const getActivityStats = async (req, res) => {
  try {
    const totalActivities = await Task.countDocuments();
    const pendingActivities = await Task.countDocuments({ status: 'pending' });
    const approvedActivities = await Task.countDocuments({ status: 'approved' });
    const rejectedActivities = await Task.countDocuments({ status: 'rejected' });
    const promotedActivities = await Task.countDocuments({ isPromoted: true });
    
    res.json({
      totalActivities,
      pendingActivities,
      approvedActivities,
      rejectedActivities,
      promotedActivities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};