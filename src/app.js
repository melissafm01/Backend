import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import taksRoutes from "./routes/tasks.routes.js";
import { FRONTEND_URL } from "./config.js";
import notificationRoutes from "./routes/notifications.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminPanelRoutes from "./routes/adminPanel.routes.js";

const app = express();


const allowedOrigins = [
    'https://fronted-cyan.vercel.app'
];

// Configurar CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ,'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-panel", adminPanelRoutes);
app.use("/api", taksRoutes);
app.use("/api/attendances", attendanceRoutes);


app.get('/', (req, res) => {
  res.json({
    message: 'Servidor PanascOOp-backend activo ',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks'
    }
  });
});

export default app;