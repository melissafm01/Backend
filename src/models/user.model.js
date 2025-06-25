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
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false,     
    },
    verificationToken: {
      type: String,
    },

    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
   
    googleId: {
      type: String,
    },
    lastInteraction: {
      type: Date,
      default: Date.now
    },
    lastLogin: Date,
    profile: {
      firstName: String,
      lastName: String,
      bio: String,
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        delete ret.password;
        delete ret.passwordResetToken; 
        return ret;
      }
    }
  }
);

// Índices para búsquedas rápidas
userSchema.index({ username: 'text', email: 'text' });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ passwordResetToken: 1 }); // Índice para búsquedas de reset

export default mongoose.model("User", userSchema);