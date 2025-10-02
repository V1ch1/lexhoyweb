import { Resend } from "resend";
import { supabase } from "./supabase";

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface EmailTemplateData {
  userName: string;
  despachoName?: string;
  userEmail?: string;
  fecha?: string;
  motivoRechazo?: string;
  url?: string;
}

export class EmailService {
  private static FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL || "notificaciones@lexhoy.com";

  /**
   * Enviar email genérico
   */
  static async send(data: EmailData): Promise<boolean> {
    try {
      console.log("📧 Enviando email a:", data.to);

      const { error } = await resend.emails.send({
        from: data.from || this.FROM_EMAIL,
        to: Array.isArray(data.to) ? data.to : [data.to],
        subject: data.subject,
        html: data.html,
      });

      if (error) {
        console.error("❌ Error enviando email:", error);
        return false;
      }

      console.log("✅ Email enviado correctamente");
      return true;
    } catch (error) {
      console.error("💥 Error en EmailService.send:", error);
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
      console.log("👑 Enviando email a super admins");

      // Obtener emails de super admins
      const { data: superAdmins, error } = await supabase
        .from("users")
        .select("email")
        .eq("rol", "super_admin");

      if (error) {
        console.error("❌ Error obteniendo super admins:", error);
        return false;
      }

      if (!superAdmins || superAdmins.length === 0) {
        console.warn("⚠️ No hay super admins para enviar email");
        return false;
      }

      const emails = superAdmins.map((admin) => admin.email);

      return await this.send({
        to: emails,
        subject: data.subject,
        html: data.html,
      });
    } catch (error) {
      console.error("💥 Error en EmailService.sendToSuperAdmins:", error);
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
              
              <a href="${data.url || process.env.NEXT_PUBLIC_BASE_URL + "/admin/users?tab=solicitudes"}" class="button">
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
              
              <a href="${data.url || process.env.NEXT_PUBLIC_BASE_URL + "/dashboard/settings?tab=mis-despachos"}" class="button">
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
   * Template: Usuario Nuevo (Para Super Admin)
   */
  static templateUsuarioNuevo(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👤 Nuevo Usuario Registrado</h1>
            </div>
            <div class="content">
              <p>Hola Administrador,</p>
              <p>Un nuevo usuario se ha registrado en la plataforma.</p>
              
              <div class="info-box">
                <p><strong>👤 Nombre:</strong> ${data.userName}</p>
                <p><strong>📧 Email:</strong> ${data.userEmail}</p>
                <p><strong>📅 Fecha de registro:</strong> ${data.fecha}</p>
              </div>

              <p>Puedes revisar el perfil del usuario desde el panel de administración.</p>
              
              <a href="${data.url || process.env.NEXT_PUBLIC_BASE_URL + "/admin/users"}" class="button">
                Ver Usuarios
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
}
