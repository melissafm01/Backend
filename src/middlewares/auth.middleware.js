import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import User from "../models/user.model.js";

export const auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization?.startsWith("Bearer ") &&
        req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

  
    const decoded = jwt.verify(token, TOKEN_SECRET);

   
    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Construir objeto de usuario para el request
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      username: user.username || null,
      email: user.email || null,
      name: user.name || null,
      role: user.role || null,
      ...decoded,
    };

    req.userId = user._id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Authentication error",
      error: error.message,
    });
  }
};
