import multer from "multer";

// Configuración para almacenar en memoria 
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
