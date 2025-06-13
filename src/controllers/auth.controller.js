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
        message: ["The email is already in use"],
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


    // guardar el token en la cookie
    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
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
        message: ["The email does not exist"],      //en caso de q el email.no exista//
      });

    const isMatch = await bcrypt.compare(password, userFound.password);          //comparamos la contraseña normal con la haseada si coinciden es correscta //
    if (!isMatch) {
      return res.status(400).json({
        message: ["The password is incorrect"],
      });
    }

    const token = await createAccessToken({                  // Crear el token de acceso (JWT)//
      id: userFound._id,
      username: userFound.username,
    });


    //Guardar el token en una cookie//
    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",      
      secure: true,       // HTTPS.//
      sameSite: "none",      
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

  const { token } = req.cookies;                        //Aquí lee la cookie que se guardó en el navegador.//
  if (!token) return res.send(false);


  jwt.verify(token, TOKEN_SECRET, async (error, user) => {   //Si el token es válido y no ha expirado, te devuelve el payload //
    if (error) return res.sendStatus(401);



    //Buscar al usuario en la base de datos
    const userFound = await User.findById(user.id);  

    if (!userFound) 
    return res.sendStatus(401);  


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
        message: ["Invalid secret key"] 
      });
    }

    // Verificar si ya existe un super admin
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ 
        message: ["Super admin already exists"] 
      });
    }

    // Verificar si el email ya está en uso
    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({ 
        message: ["Email is already taken"] 
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
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
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
    console.error("Error creating super admin:", error);
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
    httpOnly: true,    //servidor//
    secure: true,    //https//
    expires: new Date(0),  
  });
  return res.sendStatus(200);
};
  