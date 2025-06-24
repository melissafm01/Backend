
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
        message: ["El correo electrónico no existe"],      //en caso de q el email.no exista//
      });

    // Verificar si el usuario está activo
    if (!userFound.isActive) {
      return res.status(403).json({
        message: ["Su cuenta ha sido desactivada. Por favor, contacte con el servicio de asistencia."],
      });
    }


    const isMatch = await bcrypt.compare(password, userFound.password);          //comparamos la contraseña normal con la haseada si coinciden es correscta //
    if (!isMatch) {
      return res.status(400).json({
        message: ["La contraseña es incorrecta "],
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
    httpOnly: true,    //servidor//
    secure: true,    //https//
    expires: new Date(0),  
  });
  return res.sendStatus(200);
};
/*
export const loginWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { id, name, email } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ name, email, googleId: id });
    }

    // Ahora genera tu propio JWT
    const token = generateJWT(user); // <-- tu función JWT

    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ message: "Token inválido de Google" });
  }
};

// si el usuario olvida la contraseña, puede solicitar un enlace de restablecimiento por medio de su corrreo y gracias a firebase se le enviara un enlace para que pueda restablecer su contraseña


export const sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const link = await getAuth().generatePasswordResetLink(email);
    // Aquí podrías enviar este link por correo usando nodemailer (opcional)
    res.json({ message: "Enlace de recuperación generado", resetLink: link });
  } catch (error) {
    console.error("Error al generar el enlace de recuperación:", error);
    res.status(400).json({ message: "Error al enviar enlace de recuperación" });
  }
};
  */
