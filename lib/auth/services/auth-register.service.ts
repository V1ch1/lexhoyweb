import { supabase } from '@/lib/supabase';
import { AuthResponse, RegisterUserData } from '../types/auth.types';
import { EmailService } from './email.service';

/**
 * Servicio para manejar el registro de nuevos usuarios en el sistema.
 * Se encarga de:
 * - Registrar el usuario en el sistema de autenticación
 * - Crear el perfil del usuario en la base de datos
 * - Notificar a los administradores sobre el nuevo registro
 */
export class AuthRegisterService {
  /**
   * Registra un nuevo usuario en el sistema.
   * 
   * @param {RegisterUserData} userData - Datos del usuario a registrar
   * @returns {Promise<AuthResponse>} Respuesta con el usuario registrado o error
   * 
   * @example
   * const { user, error } = await AuthRegisterService.register({
   *   nombre: 'Juan',
   *   apellidos: 'Pérez',
   *   email: 'juan@ejemplo.com',
   *   password: 'contraseñaSegura123',
   *   telefono: '612345678'
   * });
   */
  static async register(userData: RegisterUserData): Promise<AuthResponse> {
    try {
      const { email, password, ...userInfo } = userData;
      
      // 1. Registrar usuario en Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userInfo,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
        },
      });

      if (signUpError) {
        return this.handleRegisterError(signUpError);
      }

      if (!authData.user) {
        return {
          user: null,
          error: 'No se pudo crear el usuario. Por favor, inténtalo de nuevo más tarde.',
        };
      }

      // 2. Crear registro de usuario en la base de datos
      const { user, error: createUserError } = await this.createUserRecord(
        authData.user.id,
        email,
        userData.nombre,
        userData.apellidos,
        userData.telefono
      );

      if (createUserError || !user) {
        return {
          user: null,
          error: createUserError || 'Error al crear el perfil del usuario',
        };
      }

      // 3. Enviar notificación a administradores
      await this.notifyAdmins(userData);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.nombre} ${user.apellidos}`,
          role: user.rol,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error en AuthRegisterService.register:', error);
      return {
        user: null,
        error: 'Ocurrió un error inesperado al registrar el usuario.',
      };
    }
  }

  /**
   * Crea un registro de usuario en la base de datos.
   * 
   * @private
   * @param {string} userId - ID único del usuario en Auth
   * @param {string} email - Correo electrónico del usuario
   * @param {string} nombre - Nombre del usuario
   * @param {string} apellidos - Apellidos del usuario
   * @param {string} [telefono] - Teléfono del usuario (opcional)
   * @returns {Promise<{ user: any; error: string | null }>} Usuario creado o error
   */
  private static async createUserRecord(
    userId: string,
    email: string,
    nombre: string,
    apellidos: string,
    telefono?: string
  ): Promise<{ user: Record<string, unknown> | null; error: string | null }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email,
            nombre,
            apellidos,
            telefono,
            rol: 'usuario',
            ultimo_acceso: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      return { user, error: error?.message || null };
    } catch (error) {
      console.error('Error al crear registro de usuario:', error);
      return { user: null, error: 'Error al crear el registro del usuario' };
    }
  }

  /**
   * Envía una notificación por correo a los administradores sobre un nuevo registro.
   * 
   * @private
   * @param {RegisterUserData} userData - Datos del usuario registrado
   * @returns {Promise<void>}
   */
  private static async notifyAdmins(userData: RegisterUserData): Promise<void> {
    try {
      const subject = '👤 ¡Nuevo usuario registrado en LexHoy!';
      const fechaRegistro = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">¡Nuevo usuario registrado!</h1>
          </div>
          
          <!-- Contenido -->
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="margin-top: 0; color: #4b5563;">Se ha registrado un nuevo usuario en la plataforma LexHoy con los siguientes datos:</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #4f46e5;">
              <h3 style="margin-top: 0; color: #1f2937;">📋 Información del usuario</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Nombre completo:</strong></td>
                  <td style="padding: 8px 0;">${userData.nombre} ${userData.apellidos}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Correo electrónico:</strong></td>
                  <td style="padding: 8px 0;">${userData.email}</td>
                </tr>
                ${userData.telefono ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Teléfono:</strong></td>
                  <td style="padding: 8px 0;">${userData.telefono}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Fecha de registro:</strong></td>
                  <td style="padding: 8px 0;">${fechaRegistro}</td>
                </tr>
              </table>
            </div>
            
            <div style="margin-top: 24px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/usuarios" 
                 style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px;">
                Ver en el panel de administración
              </a>
            </div>
          </div>
          
          <!-- Pie de página -->
          <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">Este es un correo automático. Por favor, no respondas a este mensaje.</p>
            <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} LexHoy. Todos los derechos reservados.</p>
          </div>
        </div>
      `;

      await EmailService.sendToSuperAdmins({ subject, html });
    } catch (error) {
      console.error('Error al enviar notificación a administradores:', error);
      // No fallar el registro si hay un error en la notificación
    }
  }

  /**
   * Maneja los errores específicos del registro de usuarios.
   * 
   * @private
   * @param {any} error - Error capturado durante el registro
   * @returns {AuthResponse} Respuesta con el error correspondiente
   */
  private static handleRegisterError(error: Error & { message: string }): AuthResponse {
    console.error('Error en registro:', error);

    if (error.message.includes('already registered') || error.message.includes('User already registered')) {
      return {
        user: null,
        error: 'Este correo ya está registrado. Por favor, inicia sesión o usa la opción de recuperación de contraseña si no la recuerdas.',
        exists: true,
      };
    }

    if (error.message.includes('Invalid email')) {
      return {
        user: null,
        error: 'El formato del correo electrónico no es válido.',
      };
    }

    if (error.message.includes('Password should be at least')) {
      return {
        user: null,
        error: 'La contraseña debe tener al menos 6 caracteres.',
      };
    }

    if (error.message.includes('email rate limit exceeded')) {
      return {
        user: null,
        error: 'Se ha alcanzado el límite de envíos de correo. Por favor, inténtalo de nuevo más tarde.',
      };
    }

    return {
      user: null,
      error: error.message || 'Error desconocido al registrar el usuario',
    };
  }
}
