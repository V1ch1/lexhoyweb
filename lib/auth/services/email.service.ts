import { supabase } from '@/lib/supabase';

/**
 * Opciones para el envío de correos electrónicos.
 */
type EmailOptions = {
  /** Destinatario(s) del correo */
  to?: string | string[];
  
  /** Asunto del correo */
  subject: string;
  
  /** Contenido HTML del correo */
  html: string;
  
  /** Versión de texto plano del correo (opcional, se genera automáticamente si no se proporciona) */
  text?: string;
};

/**
 * Servicio para el envío de correos electrónicos.
 * Proporciona métodos para enviar notificaciones a usuarios y administradores.
 */
export class EmailService {
  /**
   * Envía un correo electrónico a todos los super administradores del sistema.
   * 
   * @param {Omit<EmailOptions, 'to'>} options - Opciones del correo (excepto 'to' que se asigna automáticamente)
   * @returns {Promise<{ error?: string }>} Objeto con error en caso de fallo
   * 
   * @example
   * await EmailService.sendToSuperAdmins({
   *   subject: 'Nueva notificación',
   *   html: '<p>Mensaje importante</p>'
   * });
   */
  static async sendToSuperAdmins(options: Omit<EmailOptions, 'to'>) {
    try {
      // Obtener correos de super administradores
      const { data: admins, error } = await supabase
        .from('users')
        .select('email')
        .eq('rol', 'super_admin');

      if (error || !admins?.length) {
        console.error('No se encontraron administradores:', error);
        return { error: 'No se encontraron administradores para notificar' };
      }

      const adminEmails = admins.map(admin => admin.email);
      
      return this.send({
        ...options,
        to: adminEmails,
      });
    } catch (error) {
      console.error('Error en EmailService.sendToSuperAdmins:', error);
      return { error: 'Error al enviar notificación a administradores' };
    }
  }

  /**
   * Método interno para enviar correos electrónicos.
   * 
   * @private
   * @param {EmailOptions} options - Opciones del correo
   * @returns {Promise<{ error?: string }>} Objeto con error en caso de fallo
   */
  private static async send({ to, subject, html, text }: EmailOptions) {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || this.htmlToText(html),
        },
      });

      if (error) {
        console.error('Error al enviar correo:', error);
        return { error: 'Error al enviar el correo electrónico' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error inesperado en EmailService.send:', error);
      return { error: 'Error inesperado al enviar el correo' };
    }
  }

  /**
   * Convierte HTML a texto plano eliminando etiquetas y normalizando espacios.
   * 
   * @private
   * @param {string} html - Contenido HTML a convertir
   * @returns {string} Texto plano resultante
   */
  private static htmlToText(html: string): string {
    // Convertir etiquetas de salto de línea
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    
    // Eliminar otras etiquetas HTML
    text = text.replace(/<[^>]*>?/gm, ' ');
    
    // Reemplazar múltiples espacios por uno solo
    text = text.replace(/\s+/g, ' ').trim();
    
    // Reemplazar entidades HTML
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return text;
  }
}
