import { supabase } from "./supabase";
import { templateSolicitudBienvenida } from "./email-templates/solicitud-bienvenida";
import { templateSolicitudAccesoRestaurado } from "./email-templates/solicitud-acceso-restaurado";
import { templateSolicitudAccesoRevocado } from "./email-templates/solicitud-acceso-revocado";

// Configuración de emails
const FROM_EMAIL = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || "notificaciones@lexhoy.com";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@lexhoy.com";

// URL base de la API - usar localhost en desarrollo
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000'
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface EmailTemplateData {
  userName: string;
  userEmail: string;
  fecha?: string;
  role?: string;
  telefono?: string;
  despachoName?: string;
  motivoRechazo?: string;
  url?: string;
}

export class EmailService {
  private static FROM_EMAIL = FROM_EMAIL;
  private static ADMIN_EMAIL = ADMIN_EMAIL;

  /**
   * Enviar email genérico
   */
  static async send(data: EmailData): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.to,
          subject: data.subject,
          html: data.html,
          from: data.from || this.FROM_EMAIL,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error enviando email:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Error inesperado al enviar email:", error);
      return false;
    }
  }

  /**
   * Enviar email a todos los super admins
   */
  static async sendToSuperAdmins(data: {
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      // Obtener emails de super admins
      const { data: superAdmins, error } = await supabase
        .from("users")
        .select("email")
        .eq("rol", "super_admin")
        .eq("activo", true);

      if (error) {
        console.error("❌ Error obteniendo super admins:", error);
        // Enviar al correo del admin como respaldo
        return await this.send({
          to: this.ADMIN_EMAIL,
          subject: `[IMPORTANTE] ${data.subject}`,
          html: `<p>No se pudieron obtener los super administradores activos.</p>${data.html}`,
        });
      }

      let emails: string[] = [];
      
      if (!superAdmins || superAdmins.length === 0) {
        console.warn("⚠️ No hay super admins activos, enviando al correo del admin");
        emails = [this.ADMIN_EMAIL];
      } else {
        emails = superAdmins.map((admin) => admin.email).filter(Boolean) as string[];
      }

      if (emails.length === 0) {
        console.error("❌ No hay correos válidos de super administradores");
        return false;
      }

      return await this.send({
        to: emails,
        subject: data.subject,
        html: data.html,
      });
    } catch (error) {
      console.error("💥 Error en EmailService.sendToSuperAdmins:", error);
      // Último intento de enviar al correo del admin
      try {
        await this.send({
          to: this.ADMIN_EMAIL,
          subject: `[ERROR] Fallo en notificación a super admins`,
          html: `<p>Error al enviar notificaciones a super administradores:</p><pre>${JSON.stringify(error, null, 2)}</pre>`,
        });
      } catch (e) {
        console.error("💥 Error crítico al notificar al admin:", e);
      }
      return false;
    }
  }

  /**
   * Template: Solicitud Recibida (Para Super Admin)
   */
  static templateSolicitudRecibida(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nueva Solicitud de Despacho</h1>
            </div>
            <div class="content">
              <p>Hola Administrador,</p>
              <p><strong>${data.userName}</strong> ha solicitado acceso a un despacho.</p>
              
              <div class="info-box">
                <p><strong>📍 Despacho:</strong> ${data.despachoName}</p>
                <p><strong>📧 Email:</strong> ${data.userEmail}</p>
                <p><strong>📅 Fecha:</strong> ${data.fecha}</p>
              </div>

              <p>Puedes revisar y aprobar esta solicitud desde el panel de administración.</p>
              
              <a href="${data.url || 'https://despachos.lexhoy.com/admin/users?tab=solicitudes'}" class="button">
                Ver Solicitud
              </a>

              <div class="footer">
                <p>---</p>
                <p>LexHoy - Sistema de Gestión de Despachos</p>
                <p>Este es un email automático, por favor no respondas.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template: Solicitud Aprobada (Para Usuario)
   */
  static templateSolicitudAprobada(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ ¡Solicitud Aprobada!</h1>
            </div>
            <div class="content">
              <p>¡Buenas noticias <strong>${data.userName}</strong>!</p>
              
              <div class="success-box">
                <p style="font-size: 18px; margin: 0;">
                  Tu solicitud para el despacho <strong>"${data.despachoName}"</strong> ha sido aprobada.
                </p>
              </div>

              <p>Ya puedes acceder y gestionar tu despacho desde el panel de control.</p>
              
              <a href="${data.url || 'https://despachos.lexhoy.com/dashboard/settings?tab=mis-despachos'}" class="button">
                Ir a Mis Despachos
              </a>

              <div class="footer">
                <p>---</p>
                <p>LexHoy - Sistema de Gestión de Despachos</p>
                <p>Este es un email automático, por favor no respondas.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template: Solicitud Rechazada (Para Usuario)
   */
  static templateSolicitudRechazada(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning-box { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Actualización sobre tu solicitud</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${data.userName}</strong>,</p>
              
              <p>Lamentamos informarte que tu solicitud para el despacho <strong>"${data.despachoName}"</strong> no ha sido aprobada.</p>

              ${
                data.motivoRechazo
                  ? `
              <div class="warning-box">
                <p><strong>Motivo:</strong></p>
                <p>${data.motivoRechazo}</p>
              </div>
              `
                  : ""
              }

              <p>Si tienes alguna pregunta o deseas más información, no dudes en contactarnos.</p>

              <div class="footer">
                <p>---</p>
                <p>LexHoy - Sistema de Gestión de Despachos</p>
                <p>Este es un email automático, por favor no respondas.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Notificar a super admins sobre nuevo usuario registrado
   */
  static async notifyNewUserRegistration(userData: {
    id: string;
    email: string;
    nombre: string;
    apellidos: string;
    telefono?: string;
    rol: string;
  }): Promise<boolean> {
    try {
      const userProfileUrl = `https://despachos.lexhoy.com/admin/users/${userData.id}`;
      const adminPanelUrl = `https://despachos.lexhoy.com/admin/users`;
      
      const fecha = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nuevo Usuario Registrado</title>
            <style>
              body { 
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
                line-height: 1.6; 
                color: #1f2937;
                margin: 0;
                padding: 0;
                background-color: #f3f4f6;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
              }
              .header { 
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
                border-radius: 10px 10px 0 0; 
              }
              .content { 
                background: #ffffff; 
                padding: 30px; 
                border-radius: 0 0 10px 10px; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .info-box { 
                background: #f9fafb; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                border-left: 4px solid #4f46e5;
              }
              .info-item { 
                margin-bottom: 10px;
                display: flex;
                align-items: flex-start;
              }
              .info-label { 
                font-weight: 600; 
                min-width: 120px;
                color: #4b5563;
              }
              .info-value {
                flex: 1;
              }
              .button { 
                display: inline-block; 
                background: #4f46e5; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
                font-weight: 500;
                text-align: center;
              }
              .button:hover {
                background: #4338ca;
                text-decoration: none;
              }
              .footer { 
                text-align: center; 
                color: #6b7280; 
                font-size: 13px; 
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              @media (max-width: 600px) {
                .container {
                  padding: 10px;
                }
                .content {
                  padding: 20px 15px;
                }
                .info-item {
                  flex-direction: column;
                  margin-bottom: 15px;
                }
                .info-label {
                  margin-bottom: 3px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-weight: 600; font-size: 24px;">👤 Nuevo Usuario Registrado</h1>
              </div>
              <div class="content">
                <p style="margin-top: 0;">Hola Administrador,</p>
                <p>Un nuevo usuario se ha registrado en la plataforma de LexHoy.</p>
                
                <div class="info-box">
                  <div class="info-item">
                    <div class="info-label">👤 Nombre:</div>
                    <div class="info-value">${userData.nombre} ${userData.apellidos}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">📧 Email:</div>
                    <div class="info-value">${userData.email}</div>
                  </div>
                  ${userData.telefono ? `
                  <div class="info-item">
                    <div class="info-label">📞 Teléfono:</div>
                    <div class="info-value">${userData.telefono}</div>
                  </div>
                  ` : ''}
                  <div class="info-item">
                    <div class="info-label">👑 Rol:</div>
                    <div class="info-value">
                      <span style="display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 12px; font-size: 13px; font-weight: 500;">
                        ${userData.rol}
                      </span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">📅 Fecha de registro:</div>
                    <div class="info-value">${fecha}</div>
                  </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${userProfileUrl}" class="button" style="margin-right: 10px;">
                    Ver Perfil
                  </a>
                  <a href="${adminPanelUrl}" class="button" style="background: #f3f4f6; color: #4b5563 !important; border: 1px solid #e5e7eb;">
                    Ver Todos
                  </a>
                </div>

                <div class="footer">
                  <p style="margin: 5px 0;">
                    <a href="https://despachos.lexhoy.com" style="color: #4f46e5; text-decoration: none;">
                      <strong>LexHoy</strong> - Sistema de Gestión de Despachos
                    </a>
                  </p>
                  <p style="margin: 5px 0; color: #9ca3af;">
                    Este es un mensaje automático, por favor no respondas a este correo.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Enviar notificación a super administradores
      const result = await this.sendToSuperAdmins({
        subject: `👤 Nuevo usuario registrado: ${userData.nombre} ${userData.apellidos}`,
        html: html
      });

      if (!result) {
        console.warn("⚠️ No se pudo enviar notificación a super admins, intentando enviar al correo del admin");
        // Si falla, intentar enviar al correo del admin
        return await this.send({
          to: this.ADMIN_EMAIL,
          subject: `[IMPORTANTE] Nuevo usuario registrado: ${userData.email}`,
          html: `
            <p>No se pudo notificar a los super administradores sobre el nuevo usuario.</p>
            <p>Datos del usuario:</p>
            <ul>
              <li>Nombre: ${userData.nombre} ${userData.apellidos}</li>
              <li>Email: ${userData.email}</li>
              <li>Rol: ${userData.rol}</li>
              <li>Fecha: ${fecha}</li>
            </ul>
            <p><a href="${userProfileUrl}">Ver perfil del usuario</a></p>
          `
        });
      }

      return result;
    } catch (error) {
      console.error("💥 Error en notifyNewUserRegistration:", error);
      // Último intento de notificar al admin
      try {
        await this.send({
          to: this.ADMIN_EMAIL,
          subject: `[ERROR CRÍTICO] Fallo en notificación de nuevo usuario`,
          html: `
            <p>Error al notificar sobre nuevo usuario:</p>
            <pre>${JSON.stringify(error, null, 2)}</pre>
            <p>Datos del usuario:</p>
            <pre>${JSON.stringify(userData, null, 2)}</pre>
          `
        });
      } catch (e) {
        console.error("💥 Error crítico al notificar al admin:", e);
      }
      return false;
    }
  }

  /**
   * Template: Verificación de Email (Para Nuevo Usuario)
   */
  static templateVerificationEmail(data: { userName: string; verificationUrl: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
              line-height: 1.6; 
              color: #1f2937;
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #ffffff; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .button { 
              display: inline-block; 
              background: #ef4444; 
              color: white !important; 
              padding: 14px 32px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: 500;
              text-align: center;
            }
            .button:hover {
              background: #dc2626;
            }
            .footer { 
              text-align: center; 
              color: #6b7280; 
              font-size: 13px; 
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-weight: 600; font-size: 24px;">✉️ Verifica tu Email</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${data.userName}</strong>,</p>
              <p>¡Gracias por registrarte en LexHoy! Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationUrl}" class="button">Verificar Email</a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #ef4444; font-size: 13px;">${data.verificationUrl}</p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
                <strong>Nota:</strong> Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este email.
              </p>

              <div class="footer">
                <p style="margin: 5px 0;">
                  <a href="https://lexhoy.com" style="color: #ef4444; text-decoration: none;">
                    <strong>LexHoy</strong> - Plataforma de Leads Legales
                  </a>
                </p>
                <p style="margin: 5px 0; color: #9ca3af;">
                  Este es un mensaje automático, por favor no respondas a este correo.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template: Recuperación de Contraseña
   */
  static templatePasswordReset(data: { userName: string; resetUrl: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
              line-height: 1.6; 
              color: #1f2937;
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #ffffff; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .warning-box {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button { 
              display: inline-block; 
              background: #ef4444; 
              color: white !important; 
              padding: 14px 32px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: 500;
              text-align: center;
            }
            .button:hover {
              background: #dc2626;
            }
            .footer { 
              text-align: center; 
              color: #6b7280; 
              font-size: 13px; 
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-weight: 600; font-size: 24px;">🔒 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${data.userName}</strong>,</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en LexHoy.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" class="button">Restablecer Contraseña</a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #ef4444; font-size: 13px;">${data.resetUrl}</p>

              <div class="warning-box">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                  <strong>⚠️ Importante:</strong> Este enlace expira en 1 hora por seguridad.
                </p>
              </div>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña no cambiará.
              </p>

              <div class="footer">
                <p style="margin: 5px 0;">
                  <a href="https://lexhoy.com" style="color: #ef4444; text-decoration: none;">
                    <strong>LexHoy</strong> - Plataforma de Leads Legales
                  </a>
                </p>
                <p style="margin: 5px 0; color: #9ca3af;">
                  Este es un mensaje automático, por favor no respondas a este correo.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template: Bienvenida - Primera Aprobación
   * Usado cuando: pendiente → aprobado
   */
  static templateSolicitudBienvenida(data: EmailTemplateData): string {
    return templateSolicitudBienvenida(data);
  }

  /**
   * Template: Acceso Restaurado - Re-aprobación
   * Usado cuando: rechazado/cancelada → aprobado
   */
  static templateSolicitudAccesoRestaurado(data: EmailTemplateData): string {
    return templateSolicitudAccesoRestaurado(data);
  }

  /**
   * Template: Acceso Revocado - Remoción de Propietario
   * Usado cuando: aprobado → rechazado/cancelada
   */
  static templateSolicitudAccesoRevocado(data: EmailTemplateData): string {
    return templateSolicitudAccesoRevocado(data);
  }
}
