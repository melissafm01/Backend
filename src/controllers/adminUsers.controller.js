import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import Attendance from "../models/attendance.model.js";

// Obtener todos los usuarios con filtros
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filters = {};
    
    if (role && ['user', 'admin'].includes(role)) {
      filters.role = role;
    }
    
    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    }
    
    if (search) {
      filters.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener detalles de un usuario específico
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Obtener estadísticas del usuario
    const createdActivities = await Task.countDocuments({ user: id });
    const attendedActivities = await Attendance.countDocuments({ user: id });
    
    res.json({
      user,
      stats: {
        createdActivities,
        attendedActivities
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive } = req.body;
    
    // Verificar que el usuario no sea superadmin
    const user = await User.findById(id);
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: "No se puede modificar el superadministrador" });
    }
    
    // Verificar que un admin no pueda modificar a otro admin (excepto superadmin)
    if (user.role === 'admin') {
      return res.status(403).json({ message: "Solo el super Administrador puede modificar un administrador" });
    }

    // Verificar que el email no esté en uso
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ message: "Correo electrónico ya en uso" });
      }
    }
    
    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, role, isActive },
      { new: true }
    ).select('-password');
    
    res.json({
      message: "Usuario actualizada con éxito",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Activar/desactivar usuario
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    // Verificar que el usuario no sea superadmin
    const user = await User.findById(id);
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: "No se puede modificar el superadministrador" });
    }
        if (user.role === 'admin') {
      return res.status(403).json({ message: "No se pueden modificar los  administradores" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');
    
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el usuario no sea superadmin
    const user = await User.findById(id);
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: "No se puede eliminar el superadministrador" });
    }

        // Verificar que un admin no pueda eliminar a otro admin (excepto superadmin)
    if (user.role === 'admin') {
      return res.status(403).json({ message: "Solo el super Administrador puede eliminar un Administrador " });
    }

    // Verificar si el usuario tiene interacciones
    const [createdActivities, attendedActivities] = await Promise.all([
      Task.countDocuments({ user: id }),
      Attendance.countDocuments({ user: id })
    ]);

    if (createdActivities > 0 || attendedActivities > 0) {
      return res.status(400).json({ 
        message: "No se puede eliminar al usuario porque ha interactuado con la plataforma (ha creado actividades o ha asistido a ellas)" 
      });
    }

    // Si no tiene interacciones, proceder con la eliminación
    await User.findByIdAndDelete(id);
    
    res.json({ message: "Usuario eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Obtener estadísticas de usuarios
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const regularUsers = await User.countDocuments({ role: 'user' });
    const admins = await User.countDocuments({ role: 'admin' });
    
    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      regularUsers,
      admins
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};