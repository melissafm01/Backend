import cron from 'node-cron';
import Notification from './models/notification.model.js';
import Task from './models/task.model.js';
import User from './models/user.model.js';
import dayjs from 'dayjs';
import { sendEmail, getReminderTemplate, getConfirmationTemplate } from './libs/sendEmail.js';
import { sendPushNotification } from './libs/sendPushNotification.js';
import Attendance from './models/attendance.model.js';

// CONFIGURACIÓN DE REINTENTO PARA EMAILS
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 segundos

// Función para reintento de envío
const sendEmailWithRetry = async (emailData, attempt = 1) => {
  try {
    await sendEmail(emailData);
    return true;
  } catch (error) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      console.log(`⚠️ Intento ${attempt} fallido, reintentando en ${RETRY_DELAY/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return sendEmailWithRetry(emailData, attempt + 1);
    }
    throw error;
  }
};

export const runNotificationCheck = async (io) => {
  console.log("🔔 ===============================================");
  console.log("🔔 INICIANDO VERIFICACIÓN DE NOTIFICACIONES");
  console.log("🔔 ===============================================");
  
  const now = dayjs();
  const today = now.startOf('day');
  console.log(`⏰ Fecha y hora actual: ${now.format('YYYY-MM-DD HH:mm:ss')}`);

  try {
    // 1. Obtener configuraciones activas que no se hayan enviado hoy
    console.log("📋 Buscando configuraciones de notificaciones...");
    const notifications = await Notification.find({
      isActive: { $ne: false },
      $or: [
        { lastSentDate: null },
        { lastSentDate: { $lt: today.toDate() } }
      ]
    })
      .populate("task")
      .populate("user");

    console.log(`📊 Total de configuraciones encontradas: ${notifications.length}`);

    if (notifications.length === 0) {
      console.log("✅ No hay notificaciones pendientes por enviar");
      return;
    }

    let notificationsSent = 0;
    const batchSize = 10; // Procesar en lotes para evitar sobrecarga

    // 2. Procesar en lotes para mejorar rendimiento
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      console.log(`\n📦 Procesando lote ${Math.floor(i/batchSize) + 1} (${batch.length} notificaciones)`);

      // Procesar cada notificación del lote
      await Promise.all(batch.map(async (config, index) => {
        const globalIndex = i + index;
        console.log(`\n--- PROCESANDO CONFIGURACIÓN ${globalIndex + 1}/${notifications.length} ---`);
        console.log(`ID de configuración: ${config._id}`);

        const { task, user, daysBefore, type = "recordatorio" } = config;

        // 3. Validaciones básicas
        if (!task) {
          console.warn(`❌ Configuración ${config._id}: No tiene tarea asociada`);
          return;
        }
        if (!user) {
          console.warn(`❌ Configuración ${config._id}: No tiene usuario asociado`);
          return;
        }
        if (!task.date) {
          console.warn(`❌ Configuración ${config._id}: La tarea no tiene fecha`);
          return;
        }

        // 4. Verificar si la tarea ya pasó
        const taskDate = dayjs(task.date);
        if (taskDate.isBefore(now)) {
          console.log(`⏰ La tarea ya pasó, desactivando notificación...`);
          await Notification.findByIdAndUpdate(config._id, { isActive: false });
          return;
        }

        // 5. Verificar si el usuario aún está registrado como asistente
        console.log(`🔍 Verificando asistencia del usuario...`);
        const stillAttending = await Attendance.findOne({ 
          task: task._id, 
          $or: [
            { user: user._id },
            { email: user.email?.toLowerCase() }, 
          ]
        });
        
        if (!stillAttending) {
          console.log(`⚠️ Usuario ${user.username} ya no es asistente de "${task.title}"`);
          await Notification.findByIdAndUpdate(config._id, { isActive: false });
          return;
        }
        console.log(`✅ Usuario confirmado como asistente`);

        // 6. Calcular fechas
        const notifyDate = taskDate.subtract(daysBefore, 'day').startOf('day');

        console.log(`📊 CÁLCULO DE FECHAS:`);
        console.log(`   - Fecha de la tarea: ${taskDate.format('YYYY-MM-DD')}`);
        console.log(`   - Fecha de notificación: ${notifyDate.format('YYYY-MM-DD')}`);
        console.log(`   - Fecha actual: ${today.format('YYYY-MM-DD')}`);
        console.log(`   - ¿Es hoy el día de notificar?: ${notifyDate.isSame(today, 'day') ? '✅ SÍ' : '❌ NO'}`);

        // 7. Solo enviar si es el día correcto Y no se ha enviado hoy
        if (notifyDate.isSame(today, 'day')) {
          console.log(`🚨 ¡ES HORA DE NOTIFICAR!`);
          
          // Verificar doble que no se haya enviado hoy
          const lastSent = config.lastSentDate ? dayjs(config.lastSentDate).startOf('day') : null;
          if (lastSent && lastSent.isSame(today, 'day')) {
            console.log(`⚠️ Ya se envió esta notificación hoy, saltando...`);
            return;
          }

          notificationsSent++;

          // MEJORAS EN LOS TEXTOS PARA EVITAR SPAM
          let subject, text, htmlTemplate;
          if (type === "confirmación") {
            subject = `Confirma tu participación: ${task.title}`;
            text = `Hola ${user.username}, necesitamos confirmar si asistirás a "${task.title}" el ${taskDate.format('DD/MM/YYYY')}. Puedes responder este mensaje con "SÍ" o "CONFIRMO" si vas a asistir, o "NO" si no podrás participar.`;
            htmlTemplate = getConfirmationTemplate(
              user.username, 
              task.title, 
              taskDate.format('DD/MM/YYYY')
            );
          } else {
            subject = `Recordatorio: ${task.title}`;
            text = `Hola ${user.username}, recuerda que tienes una actividad "${task.title}" el ${taskDate.format('DD/MM/YYYY')}.`;
            htmlTemplate = getReminderTemplate(user.username, task.title, taskDate.format('DD/MM/YYYY'));
          }

          console.log(`📧 ENVIANDO NOTIFICACIONES:`);
          console.log(`   - Asunto: ${subject}`);
          console.log(`   - Tipo: ${type}`);

          try {
            // 8. Marcar como enviado ANTES de enviar
            await Notification.findByIdAndUpdate(config._id, {
              lastSentDate: now.toDate(),
              $inc: { sentCount: 1 }
            });

            // 9. Enviar correo electrónico con reintento
            console.log(`📬 Enviando correo electrónico con reintento...`);
            await sendEmailWithRetry({
              to: user.email,
              subject,
              text,
              html: htmlTemplate
            });
            console.log(`✅ Correo enviado exitosamente a ${user.email}`);

            // 10. Enviar notificación push (sin bloquear el proceso)
            if (user.fcmToken) {
              console.log(`📱 Enviando notificación push...`);
              try {
                await sendPushNotification(user.fcmToken, {
                  title: subject,
                  body: text
                });
                console.log(`✅ Notificación push enviada a ${user.username}`);
              } catch (pushErr) {
                console.error(`❌ Error al enviar push a ${user.username}:`, pushErr.message);
              }
            }

            // 11. Enviar notificación en tiempo real via socket
            if (io) {
              console.log(`🔌 Enviando notificación en tiempo real...`);
              try {
                const socketNotification = {
                  id: `notif_${Date.now()}_${user._id}`,
                  title: subject,
                  message: text,
                  taskId: task._id,
                  type: type || "recordatorio",
                  timestamp: new Date(),
                  read: false,
                  userId: user._id
                };

                const notificationSent = io.sendNotificationToUser(user._id, socketNotification);
                if (notificationSent) {
                  console.log(`✅ Notificación socket enviada exitosamente a ${user.username}`);
                } else {
                  console.log(`❌ No se pudo enviar notificación socket - Usuario no conectado`);
                }
                
              } catch (socketErr) {
                console.error(`❌ Error al enviar notificación socket:`, socketErr.message);
              }
            }

          } catch (error) {
            console.error(`❌ Error al enviar notificaciones para ${user.username}:`, error.message);
            // Revertir el marcado como enviado si falló
            await Notification.findByIdAndUpdate(config._id, {
              $unset: { lastSentDate: 1 },
              $inc: { sentCount: -1 }
            });
          }
        } else {
          console.log(`⏭️ No es el día de notificar, continuando...`);
        }
      }));

      // Pausa pequeña entre lotes para no sobrecargar
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n🔔 ===============================================`);
    console.log(`🔔 VERIFICACIÓN COMPLETADA`);
    console.log(`🔔 Total de notificaciones enviadas: ${notificationsSent}`);
    console.log(`🔔 ===============================================`);

  } catch (error) {
    console.error("❌ ERROR CRÍTICO en el cron de notificaciones:");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
  }
};

export const startNotificationCron = (io) => {
  console.log("🕐 Configurando cron de notificaciones...");
  
  // CAMBIAR A CADA 30 MINUTOS PARA MEJOR RENDIMIENTO
  const cronPattern = "*/30 * * * *"; // Cada 30 minutos
  
  console.log(`⚙️ Usando patrón de cron: ${cronPattern}`);
  console.log(`📝 Esto significa: ${getPatternDescription(cronPattern)}`);
  
  cron.schedule(cronPattern, () => {
    console.log(`\n⏰ CRON ACTIVADO: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    runNotificationCheck(io);
  }, {
    scheduled: true,
    timezone: "America/Bogota"
  });
  
  console.log(`✅ Cron configurado correctamente`);
  
  // Ejecutar una vez al inicio después de un delay más corto
  console.log("🚀 Ejecutando verificación inicial...");
  setTimeout(() => {
    runNotificationCheck(io);
  }, 10000); // 10 segundos en lugar de 5
};

// Función helper para describir el patrón cron
function getPatternDescription(pattern) {
  const patterns = {
    "* * * * *": "cada minuto",
    "*/30 * * * *": "cada 30 minutos",
    "0 * * * *": "cada hora",
    "0 7 * * *": "todos los días a las 7:00 AM",
    "*/5 * * * *": "cada 5 minutos",
    "0 */2 * * *": "cada 2 horas"
  };
  return patterns[pattern] || "patrón personalizado";
}

// Función para ejecutar manualmente
export const runNotificationCheckManually = (io) => {
  console.log("🔧 ==========================================");
  console.log("🔧 EJECUCIÓN MANUAL DE VERIFICACIÓN");
  console.log("🔧 ==========================================");
  return runNotificationCheck(io);
};

// Función para resetear notificaciones (útil para pruebas)
export const resetNotifications = async () => {
  console.log("🔄 Reseteando estado de notificaciones...");
  await Notification.updateMany({}, {
    $unset: { lastSentDate: 1 },
    sentCount: 0,
    isActive: true
  });
  console.log("✅ Notificaciones reseteadas");
};

