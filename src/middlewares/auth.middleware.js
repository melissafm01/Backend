import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const auth = (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1]);

    if (!token)
      return res.status(401).json({ message: "No token, authorization denied" });

    jwt.verify(token, TOKEN_SECRET, (error, user) => {
      if (error) return res.status(401).json({ message: "Token is not valid" });

      req.user = user; // <- el payload del token
      req.userId = user.id || user._id
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
