// Servicio para envío de emails de confirmación
// Configuración para Supabase Auth con templates personalizados

interface EmailTemplateConfig {
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
}

interface EmailVariables {
  CONFIRMATION_URL: string;
  USER_NAME?: string;
  USER_EMAIL?: string;
}

export class EmailService {
  
  /**
   * Plantilla de email de confirmación
   */
  static getConfirmationTemplate(): EmailTemplateConfig {
    return {
      subject: "Confirma tu cuenta en LexHoy Despachos",
      htmlTemplate: this.getHtmlTemplate(),
      textTemplate: this.getTextTemplate()
    };
  }

  /**
   * Reemplaza variables en la plantilla
   */
  static replaceVariables(template: string, variables: EmailVariables): string {
    let processedTemplate = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{ ${key} }}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value || '');
    });
    
    return processedTemplate;
  }

  /**
   * Configuración para Supabase Auth
   * Usar en el dashboard de Supabase → Authentication → Email Templates
   */
  static getSupabaseConfig() {
    return {
      // Configuración para el email template en Supabase
      confirmationEmail: {
        subject: "Confirma tu cuenta en LexHoy Despachos",
        body: this.getSupabaseTemplate(),
        // Redirect URL para producción
        redirectTo: "https://despachos.lexhoy.com/auth/confirm"
      }
    };
  }

  /**
   * Template optimizado para Supabase (usa variables de Supabase)
   */
  static getSupabaseTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu cuenta - LexHoy Despachos</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .button-container { text-align: center; }
        .footer { background: #2c3e50; color: white; padding: 30px 20px; text-align: center; font-size: 14px; }
        @media (max-width: 600px) { .container { margin: 0; border-radius: 0; } .content { padding: 30px 20px; } .button { display: block; width: 100%; box-sizing: border-box; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">LexHoy Despachos</div>
            <div>Plataforma de gestión para despachos jurídicos</div>
        </div>
        <div class="content">
            <h1 class="greeting">¡Bienvenido a LexHoy Despachos!</h1>
            <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro y comenzar a utilizar todas las funcionalidades, confirma tu dirección de correo electrónico.</p>
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">✉️ Confirmar mi cuenta</a>
            </div>
            <p><strong>🔒 Información de seguridad:</strong><br>
            Este enlace es válido por 24 horas y solo puede ser usado una vez.</p>
            <p>Una vez confirmada tu cuenta, podrás acceder a tu panel de control donde podrás:</p>
            <ul>
                <li>📋 Gestionar la información de tu despacho</li>
                <li>📊 Recibir y gestionar leads qualificados</li>
                <li>📈 Acceder a métricas y reportes</li>
                <li>⚙️ Configurar tu perfil y preferencias</li>
            </ul>
        </div>
        <div class="footer">
            © 2025 LexHoy Despachos. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Obtiene el template HTML completo
   */
  private static getHtmlTemplate(): string {
    // Aquí cargarías el contenido del archivo email-confirmation.html
    // En producción podrías leer el archivo o tenerlo como string
    return ""; // Implementar lectura del archivo HTML
  }

  /**
   * Obtiene el template de texto plano
   */
  private static getTextTemplate(): string {
    // Aquí cargarías el contenido del archivo email-confirmation.txt
    return ""; // Implementar lectura del archivo TXT
  }
}

/**
 * INSTRUCCIONES PARA CONFIGURAR EN SUPABASE:
 * 
 * 1. Ve a tu proyecto de Supabase → Authentication → Email Templates
 * 2. Selecciona "Confirm signup"
 * 3. Configura:
 *    - Subject: "Confirma tu cuenta en LexHoy Despachos"
 *    - Body: Usa EmailService.getSupabaseTemplate()
 *    - Redirect URL: "https://despachos.lexhoy.com/auth/confirm"
 * 
 * 4. Para desarrollo local:
 *    - Redirect URL: "http://localhost:3000/auth/confirm"
 * 
 * 5. Variables disponibles en Supabase:
 *    - {{ .ConfirmationURL }} - URL de confirmación generada por Supabase
 *    - {{ .Email }} - Email del usuario
 *    - {{ .SiteURL }} - URL del sitio configurada
 */

export default EmailService;