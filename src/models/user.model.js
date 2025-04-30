import mongoose from "mongoose";

const userSchema = new mongoose.Schema(   
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,        //para decirle que es lo que voy a guardar//
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);   //para poder interactuar con la base de datos con los metodos//



//basado en el schema que he creado lo voy a llamar user  y con el (model) voy a poder hacerle consuktas //
