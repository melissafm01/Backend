import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  // En producción (Render): lee desde variable de entorno y repara los \n
  const raw = JSON.parse(process.env.FIREBASE_CONFIG);
  raw.private_key = raw.private_key.replace(/\\n/g, '\n'); // <- ESTA LÍNEA ES LA CLAVE
  serviceAccount = raw;

}else {
  // ✅ En local: lee desde archivo
  const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

export { admin, bucket };
