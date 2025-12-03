import { EmailTemplateData } from "@/lib/services/emailService";

/**
 * Template: Acceso Revocado - Remoción de Propietario
 * Usado cuando: aprobado → rechazado/cancelada
 * Tono: Formal, claro, respetuoso
 */
export function templateSolicitudAccesoRevocado(data: EmailTemplateData): string {
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
          .alert-box { 
            background: #fee2e2;
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #ef4444;
          }
          .reason-box {
            background: #fef2f2;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border: 1px solid #fecaca;
          }
          .info-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #6b7280;
          }
          .info-item {
            margin: 12px 0;
            padding-left: 25px;
            position: relative;
            color: #4b5563;
          }
          .info-item::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #6b7280;
            font-size: 24px;
            line-height: 1;
          }
          .contact-box {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #3b82f6;
          }
          .footer { 
            text-align: center; 
            color: #6b7280; 
            font-size: 13px; 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          @media (max-width: 600px) {
            .container { padding: 10px; }
            .content { padding: 20px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-weight: 700; font-size: 28px;">⚠️ Actualización Importante</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Sobre tu despacho en LexHoy</p>
          </div>
          <div class="content">
            <p style="margin-top: 0; font-size: 16px;">Hola <strong>${data.userName}</strong>,</p>
            
            <div class="alert-box">
              <p style="font-size: 16px; margin: 0; font-weight: 600; color: #991b1b;">
                Te informamos que tu acceso como administrador del despacho <strong>"${data.despachoName}"</strong> ha sido revocado.
              </p>
            </div>

            ${data.motivoRechazo ? `
            <h3 style="color: #1f2937; font-size: 18px; margin-top: 25px;">📋 Motivo</h3>
            <div class="reason-box">
              <p style="margin: 0; color: #7f1d1d; font-size: 15px;">
                ${data.motivoRechazo}
              </p>
            </div>
            ` : ''}

            <h3 style="color: #1f2937; font-size: 18px; margin-top: 25px;">⚠️ Cambios en tu Cuenta</h3>
            <div class="info-box">
              <div class="info-item">Ya no podrás gestionar el despacho "${data.despachoName}"</div>
              <div class="info-item">Tu rol ha sido cambiado a "Usuario"</div>
              <div class="info-item">Tus leads existentes permanecen accesibles en tu historial</div>
              <div class="info-item">Puedes seguir accediendo a tu cuenta de LexHoy</div>
            </div>

            <p style="color: #4b5563; margin-top: 25px;">
              Entendemos que esta decisión puede ser inesperada. Si consideras que es incorrecta o deseas más información, 
              nuestro equipo está disponible para atenderte.
            </p>

            <div class="contact-box">
              <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">📞 Contacto</h4>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>Email:</strong> 
                <a href="mailto:soporte@lexhoy.com" style="color: #3b82f6; text-decoration: none;">soporte@lexhoy.com</a>
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00
              </p>
            </div>

            <div class="footer">
              <p style="margin: 5px 0;">
                <a href="https://despachos.lexhoy.com" style="color: #ef4444; text-decoration: none; font-weight: 600;">
                  LexHoy
                </a> - Plataforma de Leads Legales
              </p>
              <p style="margin: 15px 0 5px 0; color: #9ca3af;">
                Este es un mensaje automático, por favor no respondas a este correo.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
