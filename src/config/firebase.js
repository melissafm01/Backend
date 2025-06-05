

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

//  Asegura que estás obteniendo la ruta correcta al archivo JSON
const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

// Lee y parsea el archivo de credenciales
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

//  Inicializa la app de Firebase Admin (solo una vez)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

//  Obtén el bucket de Firebase Storage
const bucket = admin.storage().bucket();

//  Exporta el bucket para usarlo en controladores
export { bucket };
