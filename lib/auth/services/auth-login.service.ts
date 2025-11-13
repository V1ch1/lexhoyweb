import { supabase } from '@/lib/supabase';
import { AuthResponse, LoginCredentials } from '../types/auth.types';

/**
 * Servicio para manejar la autenticación de usuarios.
 * Se encarga de:
 * - Iniciar sesión de usuarios
 * - Cerrar sesión
 * - Manejar tokens de sesión
 * - Sincronizar datos de usuario con la base de datos
 */
export class AuthLoginService {
  /**
   * Inicia sesión de un usuario con correo electrónico y contraseña.
   * 
   * @param {LoginCredentials} credentials - Credenciales de inicio de sesión
   * @returns {Promise<AuthResponse>} Respuesta con el usuario autenticado o error
   * 
   * @example
   * const { user, error } = await AuthLoginService.login({
   *   email: 'usuario@ejemplo.com',
   *   password: 'contraseñaSegura123'
   * });
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Limpiar JWT previo
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase_jwt');
      }
      
      // Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      // Guardar JWT
      const jwt = authData?.session?.access_token;
      if (jwt && typeof window !== 'undefined') {
        window.localStorage.setItem('supabase_jwt', jwt);
      }

      if (authError) {
        return this.handleLoginError(authError);
      }

      if (!authData.user) {
        return {
          user: null,
          error: 'No se pudo obtener la información del usuario',
        };
      }

      // TEMPORALMENTE: Usar solo datos básicos de Supabase Auth
      // La consulta a la tabla 'users' se está colgando, probablemente por problemas de RLS
      const basicUserData = {
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Usuario',
          role: (authData.user.user_metadata?.role as 'super_admin' | 'despacho_admin' | 'usuario') || 'usuario',
        },
        error: null,
      };
      
      return basicUserData;
      
      // TODO: Investigar y arreglar la consulta a la tabla 'users'
      // Posibles causas:
      // 1. Tabla 'users' no existe
      // 2. Políticas RLS (Row Level Security) no configuradas correctamente
      // 3. Permisos insuficientes para el usuario autenticado
      
      /* CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (userError) {
          console.warn('⚠️ No se encontraron datos adicionales del usuario, usando datos básicos:', userError);
          
          const basicUserData = {
            user: {
              id: authData.user.id,
              email: authData.user.email || '',
              name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Usuario',
              role: authData.user.user_metadata?.role || 'usuario',
            },
            error: null,
          };
          
          return basicUserData;
        }

        // Si encontramos datos adicionales, usarlos
        if (userData) {
          // Actualizar último acceso
          await this.updateLastAccess(userData.id);

          const fullUserData = {
            user: {
              id: userData.id || authData.user.id,
              email: userData.email || authData.user.email || '',
              name: userData.nombre || 
                    `${userData.nombre || ''} ${userData.apellidos || ''}`.trim() || 
                    authData.user.user_metadata?.name || 
                    authData.user.email?.split('@')[0] || 
                    'Usuario',
              role: userData.rol || 'usuario',
            },
            error: null,
          };
          
          return fullUserData;
        }
      } catch (error) {
        console.error('❌ Error al procesar datos del usuario:', error);
      }

      // Si llegamos aquí, devolver los datos básicos del usuario
      const fallbackUserData = {
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Usuario',
          role: authData.user.user_metadata?.role || 'usuario',
        },
        error: null,
      };
      
      return fallbackUserData;
      */
    } catch (error) {
      console.error('Error en AuthLoginService.login:', error);
      return {
        user: null,
        error: 'Error de conexión. Por favor, inténtalo de nuevo.',
      };
    }
  }

  /**
   * Cierra la sesión del usuario actual.
   * 
   * @returns {Promise<{ error: string | null }>} Objeto con error en caso de fallo
   * 
   * @example
   * const { error } = await AuthLoginService.logout();
   * if (!error) {
   *   // Redirigir al login
   * }
   */
  static async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Limpiar JWT
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase_jwt');
      }
      
      return { error: error?.message || null };
    } catch (error) {
      console.error('Error en AuthLoginService.logout:', error);
      return { error: 'Error al cerrar la sesión' };
    }
  }

  /**
   * Crea un registro de usuario en la base de datos.
   * Se utiliza cuando un usuario inicia sesión por primera vez
   * y no tiene un perfil en la base de datos.
   * 
   * @private
   * @param {string} userId - ID único del usuario en Auth
   * @param {string} email - Correo electrónico del usuario
   * @param {string} nombre - Nombre del usuario
   * @param {string} apellidos - Apellidos del usuario
   * @param {string} [telefono] - Teléfono del usuario (opcional)
   * @returns {Promise<any>} Usuario creado o null en caso de error
   */
  private static async createUserRecord(
    userId: string,
    email: string,
    nombre: string,
    apellidos: string,
    telefono?: string
  ): Promise<{ id: string; email: string; nombre: string; apellidos: string; telefono?: string; rol: string } | null> {
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

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error al crear registro de usuario:', error);
      return null;
    }
  }

  /**
   * Actualiza la fecha de último acceso del usuario.
   * 
   * @private
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  private static async updateLastAccess(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error al actualizar último acceso:', error);
    }
  }

  /**
   * Maneja los errores específicos del inicio de sesión.
   * 
   * @private
   * @param {any} error - Error capturado durante el inicio de sesión
   * @returns {AuthResponse} Respuesta con el error correspondiente
   */
  private static handleLoginError(error: Error & { message: string }): AuthResponse {
    console.error('Error en login:', error);

    if (error.message.includes('Invalid login credentials')) {
      return {
        user: null,
        error: 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
      };
    }

    if (error.message.includes('Email not confirmed')) {
      return {
        user: null,
        error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.',
      };
    }

    return {
      user: null,
      error: error.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.',
    };
  }
}
