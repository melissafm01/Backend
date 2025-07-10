import mongoose from 'mongoose';

const ComunidadSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  miembros: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rol: {
        type: String,
        enum: ['admin', 'moderador', 'miembro'],
        default: 'miembro'
      }
    }
  ]
});

export default mongoose.model('Comunidad', ComunidadSchema);