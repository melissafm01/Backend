import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Template base para emails
const getEmailTemplate = (content, title = "PanasCOOP") => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f3f4f6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #065f46 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 10px;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            text-align: center;
            line-height: 1;
        }
        
        .logo-text {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: -0.5px;
            color: #ffffff !important;
        }
        
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-top: 8px;
            color: white;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #065f46;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 30px;
            color: #4b5563;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #059669 0%, #065f46 100%);
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px 5px;
            transition: transform 0.2s ease;
            border: none;
            cursor: pointer;
        }
        
        .button:hover {
            transform: translateY(-2px);
        }
        
        .button-confirm {
            background: linear-gradient(135deg, #059669 0%, #065f46 100%) !important;
            color: white !important;
        }
        
        .button-decline {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
            color: white !important;
        }
        
        .info-box {
            background-color: #f0fdf4;
            border-left: 4px solid #059669;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .info-box .title {
            font-weight: 600;
            color: #065f46;
            margin-bottom: 8px;
        }
        
        .info-box .details {
            color: #374151;
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 15px;
        }
        
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
            font-size: 14px;
            color: #92400e;
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .confirmation-info {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        
        .confirmation-info .title {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 8px;
        }
        
        .confirmation-info .details {
            color: #374151;
            font-size: 14px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .logo-text {
                font-size: 20px;
            }
            
            .button {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">
                <div class="logo-text">PanasCOOP</div>
            </div>
            <div class="subtitle">Innovación social colectiva</div>
        </div>
        
        ${content}
        
        <div class="footer">
            <div class="footer-text">
                Este mensaje fue enviado desde PanasCOOP<br>
                <strong>"Juntos construimos el cambio que queremos ver"</strong>
            </div>
            <div class="footer-text" style="margin-top: 15px; font-size: 12px;">
                Si no deseas recibir más correos de este tipo, 
                <a href="#" style="color: #059669;">puedes darte de baja aquí</a>
            </div>
        </div>
    </div>
</body>
</html>`;
};

// Template para verificación de email 
export const getVerificationEmailTemplate = (username, verificationLink) => {
  const content = `
    <div class="content">
        <div class="greeting">¡Hola ${username}! 👋</div>
        
        <div class="message">
            ¡Bienvenido/a a nuestra gran comunidad solidaria! 🎉
            <br><br>
            Estás a un paso de formar parte de PanasCOOP, donde conectamos comunidades 
            y fomentamos el cooperativismo social para crear un impacto positivo.
        </div>
        
        <div class="button-container">
            <a href="${verificationLink}" class="button">
                ✅ Verificar mi cuenta
            </a>
        </div>
        
        <div class="info-box">
            <div class="title">¿Qué puedes hacer en PanasCOOP?</div>
            <div class="details">
                • Crear y participar en actividades solidarias<br>
                • Conectar con otros voluntarios apasionados<br>
                • Contribuir a causas importantes de tu comunidad<br>
                • Ser parte del cambio que quieres ver
            </div>
        </div>
        
        <div class="warning">
            <strong>Importante:</strong> Si no creaste esta cuenta, simplemente ignora este correo.
        </div>
    </div>
  `;
  
  return getEmailTemplate(content, "Verifica tu cuenta - PanasCOOP");
};

// Template para reenvío de verificación
export const getResendVerificationTemplate = (username, verificationLink) => {
  const content = `
    <div class="content">
        <div class="greeting">¡Hola ${username}! 🔄</div>
        
        <div class="message">
            Aquí tienes nuevamente el enlace para verificar tu cuenta en PanasCOOP.
            <br><br>
            No te preocupes, ¡todos necesitamos un recordatorio de vez en cuando!
        </div>
        
        <div class="button-container">
            <a href="${verificationLink}" class="button">
                ✅ Verificar mi cuenta ahora
            </a>
        </div>
        
        <div class="warning">
            <strong>Recuerda:</strong> Si no creaste esta cuenta, simplemente ignora este correo.
        </div>
    </div>
  `;
  
  return getEmailTemplate(content, "Verificación de cuenta - PanasCOOP");
};

// Template para restablecimiento de contraseña
export const getPasswordResetTemplate = (username, resetLink) => {
  const content = `
    <div class="content">
        <div class="greeting">¡Hola ${username}! 🔐</div>
        
        <div class="message">
            Recibimos una solicitud para restablecer tu contraseña en PanasCOOP.
            <br><br>
            Si fuiste tú quien solicitó este cambio, haz clic en el botón de abajo:
        </div>
        
        <div class="button-container">
            <a href="${resetLink}" class="button">
                🔑 Restablecer mi contraseña
            </a>
        </div>
        
        <div class="info-box">
            <div class="title">⏰ Información importante:</div>
            <div class="details">
                Este enlace expirará en <strong>1 hora</strong> por tu seguridad.
            </div>
        </div>
        
        <div class="warning">
            <strong>¿No solicitaste este cambio?</strong><br>
            Si no fuiste tú, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
        </div>
    </div>
  `;
  
  return getEmailTemplate(content, "Restablece tu contraseña - PanasCOOP");
};

// Template para recordatorios de tareas
export const getReminderTemplate = (username, taskTitle, taskDate) => {
  const content = `
    <div class="content">
        <div class="greeting">¡Hola ${username}! ⏰</div>
        
        <div class="message">
            Te recordamos que tienes una actividad próxima en PanasCOOP.
            <br><br>
            No queremos que te pierdas esta oportunidad de hacer la diferencia en tu comunidad.
        </div>
        
        <div class="info-box">
            <div class="title">📅 Detalles de tu actividad:</div>
            <div class="details">
                <strong>Actividad:</strong> ${taskTitle}<br>
                <strong>Fecha:</strong> ${taskDate}<br>
                <strong>Estado:</strong> Confirmado ✅
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 18px; color: #065f46; font-weight: 600;">
                ¡Te esperamos! 🤝
            </div>
        </div>
        
        <div class="message" style="margin-top: 25px; font-style: italic; text-align: center; color: #059669;">
            "Cada acción cuenta, cada persona importa. Gracias por ser parte del cambio."
        </div>
    </div>
  `;
  
  return getEmailTemplate(content, `Recordatorio: ${taskTitle} - PanasCOOP`);
};

// Template para confirmación de asistencia 
export const getConfirmationTemplate = (username, taskTitle, taskDate) => {
  const content = `
    <div class="content">
        <div class="greeting">¡Hola ${username}! 🤔</div>
        
        <div class="message">
            Queremos confirmar tu participación en una actividad próxima.
            <br><br>
            Tu confirmación nos ayuda a organizar mejor y asegurar que todo esté listo para ti.
        </div>
        
        <div class="info-box">
            <div class="title">📋 Detalles de la actividad:</div>
            <div class="details">
                <strong>Actividad:</strong> ${taskTitle}<br>
                <strong>Fecha:</strong> ${taskDate}<br>
                <strong>Estado:</strong> Pendiente de confirmación ⏳
            </div>
        </div>
        
        <div class="confirmation-info">
            <div class="title">📧 Para confirmar tu asistencia:</div>
            <div class="details">
                Por favor, responde a este correo indicando si podrás asistir o no.
                <br><br>
                Puedes escribir simplemente:
                <br>• <strong>"SÍ"</strong> o <strong>"CONFIRMO"</strong> si vas a asistir
                <br>• <strong>"NO"</strong> o <strong>"NO ASISTO"</strong> si no podrás participar
            </div>
        </div>
        
        <div class="message" style="margin-top: 25px; text-align: center; color: #059669; font-size: 16px; font-weight: 600;">
            ¡Esperamos tu confirmación! 🤝
        </div>
        
        <div style="margin-top: 25px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #059669; border-radius: 0 8px 8px 0;">
            <div style="font-weight: 600; color: #065f46; margin-bottom: 8px;">💡 ¿Por qué es importante tu confirmación?</div>
            <div style="color: #374151; font-size: 14px;">
                Nos ayuda a preparar los recursos necesarios, coordinar el espacio y asegurar una experiencia increíble para todos los participantes.
            </div>
        </div>
        
        <div class="message" style="margin-top: 25px; font-style: italic; text-align: center; color: #059669;">
            "Cada confirmación cuenta para hacer realidad nuestras actividades solidarias."
        </div>
    </div>
  `;
  
  return getEmailTemplate(content, `¿Confirmas tu participación en: ${taskTitle}?`);
};

// Función principal
export const sendEmail = async ({ to, subject, text, html }) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Correo enviado a ${to}`);
  } catch (error) {
    console.error(`❌ Error al enviar correo a ${to}:`, error.message);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};