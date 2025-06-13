import mongoose from "mongoose";

const userSchema = new mongoose.Schema(   
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,       
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema); 



