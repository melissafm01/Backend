
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from "../libs/jwt.js";



export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body; 

    const userFound = await User.findOne({ email });   

    if (userFound)
      return res.status(400).json({
        message: ["El correo electrónico ya está en uso"],
      });

      

   
    const passwordHash = await bcrypt.hash(password, 10); 

   
    const newUser = new User({
      username,
      email,
      password: passwordHash,
    });

    const userSaved = await newUser.save();
  

    const token = await createAccessToken({
      id: userSaved._id,
    });


    // guardar el token en la cookieee
res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",        
  maxAge: 1000 * 60 * 60 * 24, 
});



    res.json({
      id: userSaved._id,
      username: userSaved.username,
      email: userSaved.email,
    });

  } catch (error) {
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

    // Verificar si el usuario está activo
    if (!userFound.isActive) {
      return res.status(403).json({
        message: ["Su cuenta ha sido desactivada. Por favor, contacte con el servicio de asistencia."],
      });
    }


    const isMatch = await bcrypt.compare(password, userFound.password);    
    if (!isMatch) {
      return res.status(400).json({
        message: ["La contraseña es incorrecta "],
      });
    }

    const token = await createAccessToken({                
      id: userFound._id,
      username: userFound.username,
    });


    //Guardar el token en una cookie//
  
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



    //Buscar al usuario en la base de datos
    const userFound = await User.findById(user.id);  
  if (!userFound || !userFound.isActive)  return res.sendStatus(401);  


    //si todo va bien  //
    return res.json({
      id: userFound._id,
      username: userFound.username,  
      email: userFound.email,
      role: userFound.role, 
    });
  });
};




// CREAR SUPER ADMIN INICIAL //


export const createInitialSuperAdmin = async (req, res) => {
  try {
    const { username, email, password, secretKey } = req.body;

    // Verificar clave secreta (puedes cambiar esto por una variable de entorno)
    const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || "mi-clave-super-secreta-2024";
    
    if (secretKey !== SUPER_ADMIN_SECRET) {
      return res.status(403).json({ 
        message: ["Clave secreta no válida"] 
      });
    }

    // Verificar si ya existe un super admin
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ 
        message: ["El superadministrador ya existe"] 
      });
    }

    // Verificar si el email ya está en uso
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
    });

    const superAdminSaved = await newSuperAdmin.save();

    // Crear token para login automático
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
    });

    const adminSaved = await newAdmin.save();

    res.status(201).json({
      message: "Admin creado con exito",
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

 