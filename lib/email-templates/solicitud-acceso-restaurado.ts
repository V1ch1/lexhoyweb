import { EmailTemplateData } from "@/lib/services/emailService";

/**
 * Template: Acceso Restaurado - Re-aprobación
 * Usado cuando: rechazado/cancelada → aprobado
 * Tono: Positivo, conciso, profesional
 */
export function templateSolicitudAccesoRestaurado(data: EmailTemplateData): string {
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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
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
          .success-box { 
            background: #dbeafe;
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #3b82f6;
          }
          .features {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .feature-item {
            margin: 10px 0;
            padding-left: 25px;
            position: relative;
            color: #4b5563;
          }
          .feature-item::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-size: 24px;
            line-height: 1;
          }
          .button { 
            display: inline-block; 
            background: #3b82f6; 
            color: white !important; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
          }
          .button:hover {
            background: #2563eb;
            box-shadow: 0 6px 8px rgba(59, 130, 246, 0.4);
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
            <h1 style="margin: 0; font-weight: 700; font-size: 28px;">✅ Acceso Restaurado</h1>
          </div>
          <div class="content">
            <p style="margin-top: 0; font-size: 16px;">Hola <strong>${data.userName}</strong>,</p>
            
            <div class="success-box">
              <p style="font-size: 18px; margin: 0; font-weight: 600; color: #1e40af;">
                Buenas noticias: tu acceso al despacho <strong>"${data.despachoName}"</strong> ha sido restaurado.
              </p>
            </div>

            <p style="color: #4b5563;">
              Ya puedes volver a gestionar tu despacho y acceder a todas las funcionalidades de LexHoy:
            </p>

            <div class="features">
              <div class="feature-item">Gestión de leads y clientes potenciales</div>
              <div class="feature-item">Participación en subastas de casos</div>
              <div class="feature-item">Compra directa de leads</div>
              <div class="feature-item">Estadísticas y métricas de rendimiento</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.url || 'https://despachos.lexhoy.com/dashboard/despachos'}" class="button">
                Acceder a Mi Despacho
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si tienes alguna pregunta, no dudes en contactarnos en 
              <a href="mailto:soporte@lexhoy.com" style="color: #3b82f6; text-decoration: none;">soporte@lexhoy.com</a>
            </p>

            <div class="footer">
              <p style="margin: 5px 0;">
                <a href="https://despachos.lexhoy.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
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
