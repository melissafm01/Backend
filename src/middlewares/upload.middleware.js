import multer from "multer";

// Configuración para almacenar en memoria (ideal para Firebase)
const storage = multer.memoryStorage();

const upload = multer({ storage });
export const cambiarFoto = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("fotoPerfil");

export default upload;