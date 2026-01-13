import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

export interface EmailTemplateData {
  userName: string;
  despachoName?: string;
  userEmail?: string;
  fecha?: string;
  url?: string;
  verificationUrl?: string;
  resetUrl?: string;
  [key: string]: any;
}

export class EmailService {
  private static fromEmail = process.env.RESEND_FROM_EMAIL || 'notificaciones@lexhoy.com';
  private static fromName = 'LexHoy';
  private static resendInstance: Resend | null = null;

  private static getResend(): Resend {
    if (!this.resendInstance) {
      this.resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resendInstance;
  }

  /**
   * Verificar preferencias del usuario antes de enviar (con filtros avanzados)
   */
  private static async checkUserPreferences(
    userId: string,
    notificationType: string,
    leadData?: {
      especialidad?: string;
      precio?: number;
      urgencia?: string;
    }
  ): Promise<{ shouldSend: boolean; useDaily: boolean }> {
    try {
      const { data: prefs } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Si no hay preferencias, asumir que quiere recibir todo
      if (!prefs) return { shouldSend: true, useDaily: false };

      // Verificar la preferencia específica del tipo de email
      const prefKey = `email_${notificationType}` as keyof typeof prefs;
      if (prefs[prefKey] === false) {
        return { shouldSend: false, useDaily: false };
      }

      // Si es notificación de nuevo lead, aplicar filtros avanzados
      if (notificationType === 'new_lead' && leadData) {
        // Filtro de especialidades
        if (prefs.especialidades_interes && prefs.especialidades_interes.length > 0) {
          if (leadData.especialidad && !prefs.especialidades_interes.includes(leadData.especialidad)) {
            console.log(`🚫 Lead filtrado: especialidad "${leadData.especialidad}" no está en intereses`);
            return { shouldSend: false, useDaily: false };
          }
        }

        // Filtro de precio
        if (leadData.precio) {
          if (prefs.precio_min && leadData.precio < prefs.precio_min) {
            console.log(`🚫 Lead filtrado: precio ${leadData.precio}€ < mínimo ${prefs.precio_min}€`);
            return { shouldSend: false, useDaily: false };
          }
          if (prefs.precio_max && leadData.precio > prefs.precio_max) {
            console.log(`🚫 Lead filtrado: precio ${leadData.precio}€ > máximo ${prefs.precio_max}€`);
            return { shouldSend: false, useDaily: false };
          }
        }

        // Filtro de urgencia
        if (prefs.solo_alta_urgencia && leadData.urgencia !== 'alta' && leadData.urgencia !== 'urgente') {
          console.log(`🚫 Lead filtrado: urgencia "${leadData.urgencia}" no es alta`);
          return { shouldSend: false, useDaily: false };
        }

        // Verificar si prefiere resumen diario
        if (prefs.resumen_diario) {
          console.log(`📅 Lead guardado para resumen diario`);
          return { shouldSend: false, useDaily: true };
        }
      }

      return { shouldSend: true, useDaily: false };
    } catch (error) {
      console.error('Error verificando preferencias:', error);
      return { shouldSend: true, useDaily: false };
    }
  }

  /**
   * Obtener email del usuario
   */
  private static async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      return user?.email || null;
    } catch (error) {
      console.error('Error obteniendo email del usuario:', error);
      return null;
    }
  }

  public static getEmailTemplate(options: {
    title: string;
    message: string;
    details: string;
    ctaText: string;
    ctaUrl: string;
    highlight?: boolean;
  }): string {
    const { title, message, details, ctaText, ctaUrl, highlight } = options;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          <!-- Header -->
          <tr>
            <td style="background-color: #E04040; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">LexHoy</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 15px; opacity: 0.95; font-weight: 500;">Tu plataforma legal de confianza</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${highlight ? `<div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 20px; border-radius: 10px; margin-bottom: 28px; text-align: center; border: 2px solid #FCD34D;">
                <h2 style="margin: 0; color: #92400E; font-size: 26px; font-weight: 700;">${title}</h2>
              </div>` : `<h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 26px; font-weight: 700;">${title}</h2>`}
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.7; font-weight: 400;">${message}</p>
              
              <div style="color: #6b7280; font-size: 15px; line-height: 1.7;">${details}</div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 36px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display: inline-block; background-color: #E04040; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(224, 64, 64, 0.25); transition: all 0.3s;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Secondary link -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                      O copia este enlace: <a href="${ctaUrl}" style="color: #E04040; text-decoration: none; word-break: break-all;">${ctaUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 500;">
                © ${new Date().getFullYear()} LexHoy. Todos los derechos reservados.
              </p>
              <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 13px;">
                Conectando abogados con clientes que necesitan sus servicios
              </p>
              <p style="margin: 0; font-size: 13px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/notifications" style="color: #E04040; text-decoration: none; font-weight: 500; margin: 0 10px;">Preferencias</a>
                <span style="color: #d1d5db;">|</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/contacto" style="color: #E04040; text-decoration: none; font-weight: 500; margin: 0 10px;">Soporte</a>
                <span style="color: #d1d5db;">|</span>
                <a href="https://lexhoy.com" style="color: #E04040; text-decoration: none; font-weight: 500; margin: 0 10px;">Web</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // ==================== EMAILS EXISTENTES ====================

  static async sendWelcomeEmail(email: string, name: string) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set. Skipping email.");
      return;
    }

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: "Bienvenido a LexHoy",
        html: this.getEmailTemplate({
          title: '¡Bienvenido a LexHoy!',
          message: `Hola ${name}, gracias por registrarte en nuestra plataforma de leads legales.`,
          details: 'Empieza a recibir clientes potenciales hoy mismo. Configura tu perfil y comienza a gestionar tus leads.',
          ctaText: 'Ir al Dashboard',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          highlight: true,
        }),
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }

  static async sendLeadPurchasedEmail(
    email: string,
    leadName: string,
    leadId: string
  ) {
    if (!process.env.RESEND_API_KEY) return;

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `✅ Nuevo cliente: ${leadName}`,
        html: this.getEmailTemplate({
          title: '✅ Lead Adquirido',
          message: 'Has adquirido un nuevo lead. Contacta con el cliente lo antes posible.',
          details: `
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10b981;">
              <p style="margin: 8px 0;"><strong>ID:</strong> ${leadId}</p>
              <p style="margin: 8px 0;"><strong>Cliente:</strong> ${leadName}</p>
            </div>
          `,
          ctaText: 'Ver Detalles Completos',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${leadId}`,
          highlight: true,
        }),
      });
    } catch (error) {
      console.error("Error sending purchase email:", error);
    }
  }

  static async sendAuctionWonEmail(
    email: string,
    leadId: string,
    amount: number
  ) {
    if (!process.env.RESEND_API_KEY) return;

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `¡Has ganado la subasta del lead #${leadId.slice(0, 8)}!`,
        html: this.getEmailTemplate({
          title: '🎉 ¡Felicidades!',
          message: `Has ganado la subasta con una puja de ${amount}€.`,
          details: 'Accede a tu panel para ver los datos de contacto del cliente.',
          ctaText: 'Ver Lead',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${leadId}`,
          highlight: true,
        }),
      });
    } catch (error) {
      console.error("Error sending auction won email:", error);
    }
  }

  // ==================== EMAILS DE DESPACHOS ====================

  static async sendSolicitudCreated(userId: string, despachoNombre: string) {
    const { shouldSend } = await this.checkUserPreferences(userId, 'solicitud_status');
    if (!shouldSend) return;

    const email = await this.getUserEmail(userId);
    if (!email) return;

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `Solicitud recibida: ${despachoNombre}`,
        html: this.getEmailTemplate({
          title: '📋 Solicitud Recibida',
          message: `Hemos recibido tu solicitud para el despacho <strong>${despachoNombre}</strong>.`,
          details: 'Nuestro equipo la revisará pronto. Te notificaremos cuando sea aprobada.',
          ctaText: 'Ver Mi Solicitud',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        }),
      });
    } catch (error) {
      console.error("Error sending solicitud created email:", error);
    }
  }

  static async sendSolicitudApproved(userId: string, despachoNombre: string) {
    const { shouldSend } = await this.checkUserPreferences(userId, 'solicitud_status');
    if (!shouldSend) return;

    const email = await this.getUserEmail(userId);
    if (!email) return;

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `✅ Solicitud aprobada: ${despachoNombre}`,
        html: this.getEmailTemplate({
          title: '🎉 ¡Solicitud Aprobada!',
          message: `¡Felicidades! Tu solicitud para <strong>${despachoNombre}</strong> ha sido aprobada.`,
          details: 'Ya puedes acceder a tu panel de gestión y comenzar a recibir leads.',
          ctaText: 'Ir a Mi Dashboard',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          highlight: true,
        }),
      });
    } catch (error) {
      console.error("Error sending solicitud approved email:", error);
    }
  }

  static async sendSolicitudRejected(userId: string, despachoNombre: string, reason?: string) {
    const { shouldSend } = await this.checkUserPreferences(userId, 'solicitud_status');
    if (!shouldSend) return;

    const email = await this.getUserEmail(userId);
    if (!email) return;

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `Solicitud no aprobada: ${despachoNombre}`,
        html: this.getEmailTemplate({
          title: '❌ Solicitud No Aprobada',
          message: `Lamentamos informarte que tu solicitud para <strong>${despachoNombre}</strong> no ha sido aprobada.`,
          details: reason || 'Si tienes dudas, contacta con nuestro equipo de soporte.',
          ctaText: 'Contactar Soporte',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contacto`,
        }),
      });
    } catch (error) {
      console.error("Error sending solicitud rejected email:", error);
    }
  }

  static async sendOwnershipAssigned(userId: string, despachoNombre: string) {
    const { shouldSend } = await this.checkUserPreferences(userId, 'despacho_changes');
    if (!shouldSend) return;

    const email = await this.getUserEmail(userId);
    if (!email) return;

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `Propietario de despacho: ${despachoNombre}`,
        html: this.getEmailTemplate({
          title: '👑 Asignado como Propietario',
          message: `Has sido asignado como propietario del despacho <strong>${despachoNombre}</strong>.`,
          details: 'Ahora tienes acceso completo para gestionar el despacho y recibir leads.',
          ctaText: 'Gestionar Despacho',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/despachos`,
          highlight: true,
        }),
      });
    } catch (error) {
      console.error("Error sending ownership assigned email:", error);
    }
  }

  static async sendOwnershipRemoved(userId: string, despachoNombre: string) {
    const { shouldSend } = await this.checkUserPreferences(userId, 'despacho_changes');
    if (!shouldSend) return;

    const email = await this.getUserEmail(userId);
    if (!email) return;

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `Cambio de propiedad: ${despachoNombre}`,
        html: this.getEmailTemplate({
          title: '🔄 Cambio de Propiedad',
          message: `Has dejado de ser propietario del despacho <strong>${despachoNombre}</strong>.`,
          details: 'Si crees que esto es un error, contacta con soporte.',
          ctaText: 'Ver Mis Despachos',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/despachos`,
        }),
      });
    } catch (error) {
      console.error("Error sending ownership removed email:", error);
    }
  }

  static async sendNewLeadAvailable(userId: string, leadData: {
    id: string;
    especialidad: string;
    urgencia: string;
    puntuacion_calidad: number;
    precio: number;
  }) {
    // Verificar preferencias con filtros avanzados
    const { shouldSend, useDaily } = await this.checkUserPreferences(userId, 'new_lead', {
      especialidad: leadData.especialidad,
      precio: leadData.precio,
      urgencia: leadData.urgencia,
    });
    
    if (!shouldSend) return;
    
    // Si prefiere resumen diario, guardar para envío posterior
    if (useDaily) {
      try {
        const { error } = await supabase
          .from('pending_daily_notifications')
          .insert({
            user_id: userId,
            lead_id: leadData.id,
          });

        if (error) throw error;
        console.log(`📅 Lead ${leadData.id} guardado para resumen diario del usuario ${userId}`);
      } catch (error) {
        console.error('Error guardando lead para resumen diario:', error);
        // Fallback: enviar email inmediato si falla el guardado
        // Opcional: decidir si enviar o no. Por seguridad, mejor enviar.
      }
      return;
    }

    const email = await this.getUserEmail(userId);
    if (!email) return;

    const urgenciaEmoji = leadData.urgencia === 'alta' ? '🔴' : leadData.urgencia === 'media' ? '🟡' : '🟢';

    try {
      await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: `🎯 Nuevo lead: ${leadData.especialidad}`,
        html: this.getEmailTemplate({
          title: '🎯 Nuevo Lead Disponible',
          message: `Hay un nuevo lead de <strong>${leadData.especialidad}</strong> disponible.`,
          details: `
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0;"><strong>Especialidad:</strong> ${leadData.especialidad}</p>
              <p style="margin: 8px 0;"><strong>Urgencia:</strong> ${urgenciaEmoji} ${leadData.urgencia}</p>
              <p style="margin: 8px 0;"><strong>Calidad:</strong> ${leadData.puntuacion_calidad}/100</p>
              <p style="margin: 8px 0;"><strong>Precio:</strong> ${leadData.precio}€</p>
            </div>
          `,
          ctaText: 'Ver Lead',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${leadData.id}`,
          highlight: true,
        }),
      });
      console.log(`✅ Email de nuevo lead enviado a ${email}`);
    } catch (error) {
      console.error("Error sending new lead email:", error);
    }
  }

  static async sendDailySummaries() {
    try {
      // 1. Obtener usuarios que tienen resumen diario activado y hora actual coincide
      const currentHour = new Date().getHours();
      const { data: usersToNotify, error: usersError } = await supabase
        .from('user_notification_preferences')
        .select('user_id, hora_resumen')
        .eq('resumen_diario', true);
        
      if (usersError) throw usersError;

      if (!usersToNotify || usersToNotify.length === 0) {
        return { processed: [], message: 'No users to notify' };
      }

      const results = [];

      // 2. Para cada usuario, buscar notificaciones pendientes
      for (const user of usersToNotify) {
        // Verificar si es la hora correcta (formato HH:00)
        const userHour = parseInt(user.hora_resumen.split(':')[0]);
        if (userHour !== currentHour) continue;

        const { data: pendingLeads, error: leadsError } = await supabase
          .from('pending_daily_notifications')
          .select(`
            id,
            lead_id,
            leads (
              id,
              especialidad,
              urgencia,
              puntuacion_calidad,
              precio
            )
          `)
          .eq('user_id', user.user_id)
          .eq('processed', false);

        if (leadsError) {
          console.error(`Error fetching leads for user ${user.user_id}:`, leadsError);
          continue;
        }

        if (!pendingLeads || pendingLeads.length === 0) continue;

        // 3. Generar y enviar email de resumen
        const leadsListHtml = pendingLeads.map((item: any) => {
          const lead = item.leads;
          const urgenciaEmoji = lead.urgencia === 'alta' ? '🔴' : lead.urgencia === 'media' ? '🟡' : '🟢';
          return `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
              <p style="margin: 4px 0;"><strong>${lead.especialidad}</strong></p>
              <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">
                ${urgenciaEmoji} ${lead.urgencia} | Calidad: ${lead.puntuacion_calidad}/100 | ${lead.precio}€
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${lead.id}" style="color: #4f46e5; text-decoration: none; font-size: 14px;">Ver Lead →</a>
            </div>
          `;
        }).join('');

        // Obtener email del usuario
        const email = await this.getUserEmail(user.user_id);

        if (email) {
          await this.getResend().emails.send({
            from: `${this.fromName} <${this.fromEmail}>`,
            to: email,
            subject: `📅 Tu resumen diario de leads (${pendingLeads.length})`,
            html: this.getEmailTemplate({
              title: 'Resumen Diario de Leads',
              message: 'Aquí tienes los leads que coinciden con tus preferencias de hoy:',
              details: `
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  ${leadsListHtml}
                </div>
              `,
              ctaText: 'Ver todos en el Dashboard',
              ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads`
            })
          });

          // 4. Marcar notificaciones como procesadas
          const notificationIds = pendingLeads.map(n => n.id);
          await supabase
            .from('pending_daily_notifications')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .in('id', notificationIds);

          results.push({ userId: user.user_id, leadsCount: pendingLeads.length, sent: true });
        }
      }

      return { success: true, processed: results };
    } catch (error) {
      console.error('Error sending daily summaries:', error);
      throw error;
    }
  }

  // --- Generic Methods for API Compatibility ---

  static async send(options: { to: string; subject: string; html: string }) {
    try {
      const { data, error } = await this.getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('Error sending generic email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error sending generic email:', error);
      return false;
    }
  }

  static async sendToSuperAdmins(options: { subject: string; html: string }) {
    try {
      const { data: superAdmins, error } = await supabase
        .from('users')
        .select('email')
        .eq('rol', 'super_admin');

      if (error || !superAdmins) {
        console.error('Error fetching super admins:', error);
        return false;
      }

      const emails = superAdmins.map(admin => admin.email).filter(email => email);
      if (emails.length === 0) return false;

      // Send individually to avoid exposing other admins' emails
      await Promise.all(emails.map(email => 
        this.getResend().emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: email,
          subject: options.subject,
          html: options.html,
        })
      ));

      return true;
    } catch (error) {
      console.error('Error sending to super admins:', error);
      return false;
    }
  }

  // --- Templates ---

  static templateSolicitudRecibida(data: { userName: string; userEmail: string; despachoName: string; fecha: string; url: string }) {
    return this.getEmailTemplate({
      title: 'Nueva Solicitud de Despacho',
      message: `El usuario <strong>${data.userName}</strong> (${data.userEmail}) ha solicitado acceso al despacho <strong>${data.despachoName}</strong>.`,
      details: `<p>Fecha: ${data.fecha}</p>`,
      ctaText: 'Ver Solicitud',
      ctaUrl: data.url
    });
  }

  static templateVerificationEmail(data: { userName: string; verificationUrl: string }) {
    return this.getEmailTemplate({
      title: 'Verifica tu Email',
      message: `Hola ${data.userName}, gracias por registrarte en LexHoy. Por favor, verifica tu dirección de correo electrónico para continuar.`,
      details: '',
      ctaText: 'Verificar Email',
      ctaUrl: data.verificationUrl
    });
  }

  static templatePasswordReset(data: { userName: string; resetUrl: string }) {
    return this.getEmailTemplate({
      title: 'Recuperación de Contraseña',
      message: `Hola ${data.userName}, hemos recibido una solicitud para restablecer tu contraseña. Si no has sido tú, puedes ignorar este correo.`,
      details: '',
      ctaText: 'Restablecer Contraseña',
      ctaUrl: data.resetUrl
    });
  }

  static templateSolicitudRechazada(data: { userName: string; userEmail: string; despachoName: string; motivoRechazo?: string }) {
    return this.getEmailTemplate({
      title: 'Solicitud No Aprobada',
      message: `Hola ${data.userName}, lamentamos informarte que tu solicitud para gestionar el despacho <strong>${data.despachoName}</strong> no ha podido ser aprobada en este momento.`,
      details: data.motivoRechazo ? `<p><strong>Motivo:</strong> ${data.motivoRechazo}</p>` : '',
      ctaText: 'Contactar Soporte',
      ctaUrl: 'https://lexhoy.com/contacto'
    });
  }
}
