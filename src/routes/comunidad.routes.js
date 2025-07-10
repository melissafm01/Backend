import express from 'express';
import Comunidad from '../models/comunidad.js';
import Mensaje from '../models/mensaje.js';
import User from '../models/user.model.js';

import auth from '../middlewares/auth.middleware.js';

const router = express.Router();


// Middleware para validar si el usuario es miembro de la comunidad
async function validarMiembro(req, res, next) {
  const { comunidadId } = req.params;
  const userId = req.user.id;

  const comunidad = await Comunidad.findById(comunidadId);
  if (!comunidad) return res.status(404).json({ error: 'Comunidad no encontrada' });

  const miembro = comunidad.miembros.find(m => m.usuario.toString() === userId);
  if (!miembro) return res.status(403).json({ error: 'No eres miembro de esta comunidad' });

  req.rol = miembro.rol;
  next();
}

// Crear una nueva comunidad
router.post('/comunidades', auth, async (req, res) => {
  const { nombre } = req.body;
  const userId = req.user.id;

  const comunidad = new Comunidad({
    nombre,
    creador: userId,
    miembros: [{ usuario: userId, rol: 'admin' }]
  });

  await comunidad.save();
  res.status(201).json(comunidad);
});

// Unirse a una comunidad
router.post('/comunidades/:comunidadId/unirse', auth, async (req, res) => {
  const { comunidadId } = req.params;
  const userId = req.user.id;

  const comunidad = await Comunidad.findById(comunidadId);
  if (!comunidad) return res.status(404).json({ error: 'Comunidad no encontrada' });

  const yaMiembro = comunidad.miembros.some(m => m.usuario.toString() === userId);
  if (yaMiembro) return res.status(400).json({ error: 'Ya eres miembro' });

  comunidad.miembros.push({ usuario: userId });
  await comunidad.save();
  res.json({ mensaje: 'Unido correctamente' });
});

// Obtener todos los mensajes de una comunidad
router.get('/comunidades/:comunidadId/mensajes', auth, validarMiembro, async (req, res) => {
  const mensajes = await Mensaje
    .find({ comunidad: req.params.comunidadId })
    .populate('autor', 'username');

  res.json(mensajes);
});

// Enviar un mensaje (texto o audio)
router.post('/comunidades/:comunidadId/mensajes', auth, validarMiembro, async (req, res) => {
  const { texto, audioUrl, tipo } = req.body;

  const mensaje = new Mensaje({
    comunidad: req.params.comunidadId,
    autor: req.user.id,
    texto,
    audioUrl,
    tipo: tipo || (audioUrl ? 'audio' : 'texto')
  });

  await mensaje.save();
  res.status(201).json(mensaje);
});

// Eliminar un mensaje (autor o admin)
router.delete('/comunidades/:comunidadId/mensajes/:mensajeId', auth, validarMiembro, async (req, res) => {
  const { mensajeId } = req.params;

  const mensaje = await Mensaje.findById(mensajeId);
  if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

  if (mensaje.autor.toString() !== req.user.id && req.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para eliminar este mensaje' });
  }

  await mensaje.deleteOne();
  res.json({ mensaje: 'Mensaje eliminado' });
});

// Eliminar una comunidad (solo admin)
router.delete('/comunidades/:comunidadId', auth, validarMiembro, async (req, res) => {
  if (req.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo el administrador puede eliminar la comunidad' });
  }

  await Comunidad.findByIdAndDelete(req.params.comunidadId);
  await Mensaje.deleteMany({ comunidad: req.params.comunidadId });

  res.json({ mensaje: 'Comunidad eliminada' });
});

export default router;