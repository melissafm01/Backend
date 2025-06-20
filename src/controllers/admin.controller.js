// admin.controller.js
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Obtener todos los administradores
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(admins);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Obtener un administrador específico
export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findOne({ _id: id, role: "admin" })
      .select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    
    res.json(admin);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Actualizar administrador
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;
    
    // Verificar que el administrador existe
    const admin = await User.findOne({ _id: id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    
    // Verificar que el email no esté siendo usado por otro usuario
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }
    
    // Preparar datos para actualizar
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // Si se proporciona nueva contraseña, encriptarla
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateData.password = passwordHash;
    }
    
    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({
      message: "Administrador actualizado con éxito",
      admin: updatedAdmin
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Desactivar administrador (cambiar rol a user)
export const deactivateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const admin = await User.findOne({ _id: id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    
    const deactivatedAdmin = await User.findByIdAndUpdate(
      id,
      { role: "user" },
      { new: true }
    ).select('-password');
    
    res.json({
      message: "Administrador desactivado exitosamente",
      admin: deactivatedAdmin
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Reactivar administrador (cambiar rol de user a admin)
export const reactivateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado o ya es administrador" });
    }
    
    const reactivatedAdmin = await User.findByIdAndUpdate(
      id,
      { role: "admin" },
      { new: true }
    ).select('-password');
    
    res.json({
      message: "Administrador reactivado exitosamente",
      admin: reactivatedAdmin
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Eliminar administrador completamente
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const admin = await User.findOne({ _id: id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    
   // Solo actualiza isActive, mantiene el rol "admin"
    const deactivatedAdmin = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    res.json({
      message: "Administrador desactivado exitosamente (rol conservado)",
      admin: deactivatedAdmin
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Obtener estadísticas de administradores
export const getAdminStats = async (req, res) => {
  try {
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalSuperAdmins = await User.countDocuments({ role: "superadmin" });
    
    res.json({
      totalAdmins,
      totalUsers,
      totalSuperAdmins,
      totalAccounts: totalAdmins + totalUsers + totalSuperAdmins
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};