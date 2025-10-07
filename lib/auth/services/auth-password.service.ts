import { supabase } from '@/lib/supabase';

/**
 * Servicio para manejar operaciones relacionadas con contraseñas de usuario.
 * Incluye funcionalidades para:
 * - Restablecimiento de contraseña
 * - Actualización de contraseña
 * - Manejo de errores específicos de contraseñas
 */
export class AuthPasswordService {
  /**
   * Envía un correo electrónico con un enlace para restablecer la contraseña.
   * 
   * @param {string} email - Correo electrónico del usuario
   * @returns {Promise<{ error: string | null }>} Objeto con error en caso de fallo
   * 
   * @example
   * const { error } = await AuthPasswordService.resetPassword('usuario@ejemplo.com');
   * if (!error) {
   *   // Mostrar mensaje de éxito
   * } else {
   *   // Mostrar mensaje de error
   * }
   */
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Error al enviar correo de restablecimiento:', error);
        return { 
          error: this.getResetPasswordError(error) 
        };
      }

      return { error: null };
    } catch (error) {
      console.error('Error inesperado en AuthPasswordService.resetPassword:', error);
      return { 
        error: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.' 
      };
    }
  }

  /**
   * Actualiza la contraseña del usuario actual.
   * 
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<{ error: string | null }>} Objeto con error en caso de fallo
   * 
   * @example
   * const { error } = await AuthPasswordService.updatePassword('nuevaContraseña123');
   * if (!error) {
   *   // Mostrar mensaje de éxito
   * } else {
   *   // Mostrar mensaje de error
   * }
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error al actualizar la contraseña:', error);
        return { 
          error: this.getUpdatePasswordError(error) 
        };
      }

      return { error: null };
    } catch (error) {
      console.error('Error inesperado en AuthPasswordService.updatePassword:', error);
      return { 
        error: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.' 
      };
    }
  }

  /**
   * Maneja los errores específicos del restablecimiento de contraseña.
   * 
   * @private
   * @param {any} error - Error capturado
   * @returns {string} Mensaje de error amigable para el usuario
   */
  private static getResetPasswordError(error: any): string {
    if (error.message.includes('user not found')) {
      return 'No existe ninguna cuenta asociada a este correo electrónico.';
    }

    if (error.message.includes('email rate limit exceeded')) {
      return 'Has superado el límite de intentos. Por favor, espera unos minutos antes de volver a intentarlo.';
    }

    return 'Error al enviar el correo de restablecimiento. Por favor, inténtalo de nuevo.';
  }

  /**
   * Maneja los errores específicos de la actualización de contraseña.
   * 
   * @private
   * @param {any} error - Error capturado
   * @returns {string} Mensaje de error amigable para el usuario
   */
  private static getUpdatePasswordError(error: any): string {
    if (error.message.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (error.message.includes('New password should be different')) {
      return 'La nueva contraseña debe ser diferente a la actual.';
    }

    return 'Error al actualizar la contraseña. Por favor, inténtalo de nuevo.';
  }
}
