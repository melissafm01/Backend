import mongoose from "mongoose";
import {MONGODB_URL } from "./config.js";

export const connectDB = async () => {  
  try {
    await mongoose.connect(MONGODB_URL);   
    console.log("MongoDB is connected");
  } catch (error) {
    console.error(error);
  }
}; 


