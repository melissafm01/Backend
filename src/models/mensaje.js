import mongoose from 'mongoose';

const MensajeSchema = new mongoose.Schema({
  comunidad: { type: mongoose.Schema.Types.ObjectId, ref: 'Comunidad', required: true },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  texto: String,
  audioUrl: String,
  tipo: {
    type: String,
    enum: ['texto', 'audio'],
    default: 'texto'
  },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Mensaje', MensajeSchema);