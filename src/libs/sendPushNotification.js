import { admin } from '../config/firebase.js';

/**
 * Envía una notificación push a un dispositivo.
 * @param {string} fcmToken - Token FCM del dispositivo del usuario.
 * @param {object} notification - Objeto con title y body.
 */
export const sendPushNotification = async (fcmToken, notification) => {
  try {
    const message = {
      token: fcmToken,
      notification,
    };

    const response = await admin.messaging().send(message);
    console.log(' Notificación enviada:', response);
    return response;
  } catch (error) {
    console.error(' Error al enviar notificación push:', error);
    throw error;
  }
};
