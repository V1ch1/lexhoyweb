import { EmailTemplateData } from "@/lib/services/emailService";

/**
 * Template: Bienvenida - Primera Aprobación
 * Usado cuando: pendiente → aprobado (primera vez)
 * Tono: Entusiasta, informativo, acogedor
 */
export function templateSolicitudBienvenida(data: EmailTemplateData): string {
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .content { 
            background: #ffffff; 
            padding: 30px; 
            border-radius: 0 0 10px 10px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .welcome-box { 
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            padding: 25px; 
            border-radius: 8px; 
            margin: 25px 0; 
            border-left: 4px solid #10b981;
          }
          .feature-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .feature-item {
            margin: 15px 0;
            padding-left: 30px;
            position: relative;
          }
          .feature-item::before {
            content: "✅";
            position: absolute;
            left: 0;
            font-size: 18px;
          }
          .steps-box {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .step {
            margin: 12px 0;
            padding-left: 35px;
            position: relative;
            font-weight: 500;
          }
          .step::before {
            content: attr(data-number);
            position: absolute;
            left: 0;
            background: #3b82f6;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
          .button { 
            display: inline-block; 
            background: #10b981; 
            color: white !important; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
          }
          .button:hover {
            background: #059669;
            box-shadow: 0 6px 8px rgba(16, 185, 129, 0.4);
          }
          .tips-box {
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
          .resources {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          .resource-link {
            flex: 1;
            min-width: 150px;
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            text-decoration: none;
            color: #4b5563;
            border: 1px solid #e5e7eb;
          }
          .resource-link:hover {
            background: #e5e7eb;
            border-color: #d1d5db;
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
            .container { padding: 10px; }
            .content { padding: 20px 15px; }
            .resources { flex-direction: column; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-weight: 700; font-size: 32px;">🎉 ¡Bienvenido a LexHoy!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Tu despacho ha sido aprobado</p>
          </div>
          <div class="content">
            <p style="margin-top: 0; font-size: 16px;">Hola <strong>${data.userName}</strong>,</p>
            
            <div class="welcome-box">
              <p style="font-size: 18px; margin: 0; font-weight: 600; color: #065f46;">
                ¡Excelentes noticias! Tu solicitud para gestionar el despacho <strong>"${data.despachoName}"</strong> ha sido aprobada.
              </p>
              <p style="margin: 10px 0 0 0; color: #047857;">
                ¡Bienvenido a la comunidad de LexHoy! 🚀
              </p>
            </div>

            <h2 style="color: #1f2937; font-size: 20px; margin-top: 30px;">🏢 ¿Qué es LexHoy?</h2>
            <p style="color: #4b5563;">
              LexHoy es la plataforma líder que conecta despachos de abogados con clientes potenciales de alta calidad. 
              Ahora que eres parte de nuestra comunidad, tendrás acceso a:
            </p>

            <div class="feature-box">
              <div class="feature-item">
                <strong>Leads Verificados</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Clientes potenciales pre-calificados por IA según tu especialidad</span>
              </div>
              <div class="feature-item">
                <strong>Sistema de Subastas</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Compite por los mejores casos y obtén precios competitivos</span>
              </div>
              <div class="feature-item">
                <strong>Compra Directa</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Adquiere leads instantáneamente sin esperar</span>
              </div>
              <div class="feature-item">
                <strong>Gestión de Despacho</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Administra tu perfil, especialidades y estadísticas</span>
              </div>
            </div>

            <h2 style="color: #1f2937; font-size: 20px; margin-top: 30px;">🚀 Primeros Pasos</h2>
            <div class="steps-box">
              <div class="step" data-number="1">Completa el perfil de tu despacho</div>
              <div class="step" data-number="2">Configura tus áreas de práctica</div>
              <div class="step" data-number="3">Explora los leads disponibles</div>
              <div class="step" data-number="4">¡Empieza a recibir clientes!</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.url || 'https://despachos.lexhoy.com/dashboard/despachos'}" class="button">
                Ir a Mi Despacho
              </a>
            </div>

            <h2 style="color: #1f2937; font-size: 20px; margin-top: 30px;">💡 Consejos para Empezar</h2>
            <div class="tips-box">
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Mantén tu perfil actualizado para recibir leads relevantes</li>
                <li style="margin: 8px 0;">Revisa diariamente los nuevos leads en tu especialidad</li>
                <li style="margin: 8px 0;">Participa en subastas para obtener mejores precios</li>
                <li style="margin: 8px 0;">Responde rápidamente a los leads para mayor conversión</li>
              </ul>
            </div>

            <h2 style="color: #1f2937; font-size: 20px; margin-top: 30px;">📚 Recursos Útiles</h2>
            <div class="resources">
              <a href="https://lexhoy.com/guia-inicio" class="resource-link">
                <div style="font-size: 24px; margin-bottom: 5px;">📖</div>
                <div style="font-weight: 600; font-size: 14px;">Guía de Inicio</div>
              </a>
              <a href="https://lexhoy.com/faq" class="resource-link">
                <div style="font-size: 24px; margin-bottom: 5px;">❓</div>
                <div style="font-weight: 600; font-size: 14px;">Preguntas Frecuentes</div>
              </a>
              <a href="mailto:soporte@lexhoy.com" class="resource-link">
                <div style="font-size: 24px; margin-bottom: 5px;">📧</div>
                <div style="font-weight: 600; font-size: 14px;">Soporte</div>
              </a>
            </div>

            <div class="footer">
              <p style="margin: 5px 0;">
                <a href="https://despachos.lexhoy.com" style="color: #10b981; text-decoration: none; font-weight: 600;">
                  LexHoy
                </a> - Plataforma de Leads Legales
              </p>
              <p style="margin: 5px 0; color: #9ca3af;">
                ¡Estamos emocionados de tenerte con nosotros!
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
