import multer from "multer";

// Configuración para almacenar en memoria (ideal para Firebase)
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
