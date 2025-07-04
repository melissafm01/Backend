import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from "../libs/jwt.js";
import { admin } from "../config/firebase.js";
import crypto from "crypto";
import { getAuth } from "../config/firebase.js";
import { 
  sendEmail, 
  getVerificationEmailTemplate, 
  getResendVerificationTemplate, 
  getPasswordResetTemplate 
} from "../libs/sendEmail.js";



export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userFound = await User.findOne({ email });

    if (userFound)
      return res.status(400).json({ message: ["El correo electrónico ya está en uso"] });

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      username,
      email,
      password: passwordHash,
      isVerified: false,
      verificationToken,
    });

    const userSaved = await newUser.save();

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verifica tu cuenta - PanasCOOP",
      text: `Hola ${username}, verifica tu cuenta en: ${verificationLink}`, // Fallback texto plano
      html: getVerificationEmailTemplate(username, verificationLink) // Template HTML
    });

    res.status(201).json({
      message: "Usuario registrado. Revisa tu correo para verificar la cuenta.",
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: error.message });
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userFound = await User.findOne({ email });

    if (!userFound)
      return res.status(400).json({
        message: ["El correo electrónico no existe"],
      });

    if (!userFound.isActive) {
      return res.status(403).json({
        message: ["Su cuenta ha sido desactivada. Por favor, contacte con el servicio de asistencia."],
      });
    }

    if (userFound.role === 'user' && !userFound.isVerified) {
     return res.status(403).json({
    message: ["Debes verificar tu cuenta antes de iniciar sesión. Revisa tu correo electrónico."],
    });
   }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      return res.status(400).json({
        message: ["La contraseña es incorrecta"],
      });
    }

    // Actualizar fechas de login e interacción
    userFound.lastLogin = new Date();
    userFound.lastInteraction = new Date();
    await userFound.save();

    const token = await createAccessToken({
      id: userFound._id,
      username: userFound.username,
    });
  
res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",          
 maxAge: 1000 * 60 * 60 * 24, 
});


  res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



export const verifyToken = async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.send(false);

  jwt.verify(token, TOKEN_SECRET, async (error, user) => {
    if (error) return res.sendStatus(401);

    const userFound = await User.findById(user.id);
    if (!userFound || !userFound.isActive) return res.sendStatus(401);

    // CORRECCIÓN: Los superadmins y admins no necesitan verificación de email
    if (userFound.role === 'user' && !userFound.isVerified) {
      return res.sendStatus(401);
    }

    return res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
    });
  });
};


export const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    
    console.log('Token recibido para verificación:', token);
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: "Token de verificación es requerido" 
      });
    }
    
    const user = await User.findOne({ 
      verificationToken: token,
      isVerified: false
    });

    if (!user) {
      console.log('Token no encontrado o usuario ya verificado');
      return res.status(400).json({ 
        success: false,
        message: "Token de verificación inválido, expirado o cuenta ya verificada" 
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    console.log(`Usuario ${user.email} verificado exitosamente`);

    const token_jwt = await createAccessToken({
      id: user._id,
      username: user.username,
    });


res.cookie("token", token_jwt, {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",          
 maxAge: 1000 * 60 * 60 * 24, 
});

    res.json({
      success: true,
      message: `¡Bienvenido a PanasCOOP, ${user.username}! Tu cuenta ha sido verificada exitosamente.`,
      user: {
        id: user._id,
        username: user.username,
        name: user.username,
        email: user.email,
        role: user.role || 'user',
        isVerified: true
      }
    });

  } catch (error) {
    console.error('Error en verificación de email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al verificar la cuenta' 
    });
  }
};



export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isVerified: false });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Usuario no encontrado o ya verificado" 
      });
    }

    const now = new Date();
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (user.lastVerificationEmailSent && now - user.lastVerificationEmailSent < FIVE_MINUTES) {
      return res.status(429).json({
        success: false,
        message: "Espera 5 minutos antes de reenviar el email de verificación."
      });
    }

    if (!user.verificationToken) {
      user.verificationToken = crypto.randomBytes(32).toString("hex");
    }

    user.lastVerificationEmailSent = new Date();
    await user.save();

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;

    // CAMBIO AQUÍ: Usar el template HTML
    await sendEmail({
      to: email,
      subject: "Verifica tu cuenta - PanasCOOP",
      text: `Hola ${user.username}, verifica tu cuenta en: ${verificationLink}`, // Fallback texto plano
      html: getResendVerificationTemplate(user.username, verificationLink) // Template HTML
    });

    res.json({
      success: true,
      message: "Email de verificación reenviado. Revisa tu correo."
    });

  } catch (error) {
    console.error("Error al reenviar email:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al reenviar el email" 
    });
  }
};



// CREAR SUPER ADMIN INICIAL //


export const createInitialSuperAdmin = async (req, res) => {
  try {
    const { username, email, password, secretKey } = req.body;

    const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || "mi-clave-super-secreta-2024";
    
    if (secretKey !== SUPER_ADMIN_SECRET) {
      return res.status(403).json({ 
        message: ["Clave secreta no válida"] 
      });
    }

    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ 
        message: ["El superadministrador ya existe"] 
      });
    }

    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({ 
        message: ["El correo electrónico ya está en uso"] 
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newSuperAdmin = new User({
      username,
      email,
      password: passwordHash,
      role: "superadmin",
      isVerified: true,
      isActive: true,
    });

    const superAdminSaved = await newSuperAdmin.save();

    const token = await createAccessToken({
      id: superAdminSaved._id,
      username: superAdminSaved.username,
    });

 res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",           
  maxAge: 1000 * 60 * 60 * 24, l
});


     res.status(201).json({
      message: "Superadministrador creado exitosamente",
      user: {
        id: superAdminSaved._id,
        username: superAdminSaved.username,
        email: superAdminSaved.email,
        role: superAdminSaved.role,
      }
    });

  } catch (error) {
    console.error("Error al crear superadministrador:", error);
    res.status(500).json({ message: error.message });
  }
};



//REGISTRAR ADMINISTRADORES//

export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userFound = await User.findOne({ email });
    if (userFound)
      return res.status(400).json({ message: ["El correo electrónico ya está en uso"] });

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      username,
      email,
      password: passwordHash,
      role: "admin",
      isVerified: true,
      isActive: true,
    });

    const adminSaved = await newAdmin.save();

    res.status(201).json({
      message: "Admin creado con éxito",
      user: {
        id: adminSaved._id,
        username: adminSaved.username,
        email: adminSaved.email,
        role: adminSaved.role,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None", 
    path: "/",        
    expires: new Date(0),
  });
  return res.sendStatus(200);
};;

 

export const loginWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, name, email } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username: name || email.split('@')[0],
        email,
        googleId: uid,
        isVerified: true,
        isActive: true,
        role: 'user',
        password: 'google-oauth-user' // Placeholder para usuarios de Google
      });
      await user.save();
    }

    // Actualizar último login
    user.lastLogin = new Date();
    user.lastInteraction = new Date();
    await user.save();

    const token = await createAccessToken({
      id: user._id,
      username: user.username,
    });


     res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",           
  maxAge: 1000 * 60 * 60 * 24, l
});

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error en login con Google:", error);
    res.status(401).json({ message: "Token inválido de Google" });
  }
};


export const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email es requerido" 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "No existe una cuenta con este correo electrónico" 
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // CAMBIO AQUÍ: Usar el template HTML
    await sendEmail({
      to: email,
      subject: "Restablece tu contraseña - PanasCOOP",
      text: `Hola ${user.username}, restablece tu contraseña en: ${resetLink}`, // Fallback texto plano
      html: getPasswordResetTemplate(user.username, resetLink) // Template HTML
    });

    res.json({ 
      success: true,
      message: "Se ha enviado un enlace de restablecimiento a tu correo electrónico" 
    });

  } catch (error) {
    console.error("Error al enviar enlace de restablecimiento:", error);
    res.status(500).json({ 
      success: false,
      message: "Error interno del servidor al enviar enlace de restablecimiento" 
    });
  }
};


// Restablecer contraseña
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Token y nueva contraseña son requeridos" 
      });
    }

    // Buscar usuario con el token válido y no expirado
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Token inválido o expirado" 
      });
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar tokens
    user.password = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Contraseña restablecida exitosamente"
    });

  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ 
      success: false,
      message: "Error interno del servidor al restablecer contraseña" 
    });
  }
};