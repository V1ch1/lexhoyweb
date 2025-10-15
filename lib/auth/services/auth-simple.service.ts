import { supabase } from '@/lib/supabase';

/**
 * Servicio de autenticación simplificado que usa SOLO Supabase Auth
 * No depende de la tabla 'users' personalizada
 */
export class AuthSimpleService {
  /**
   * Iniciar sesión con email y contraseña
   */
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error de autenticación:', error);
        
        // Manejar diferentes tipos de errores de autenticación
        let errorMessage = 'Error de autenticación';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Correo electrónico o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, verifica tu correo electrónico antes de iniciar sesión';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Por favor, inténtalo de nuevo más tarde';
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet';
        }
        
        return { user: null, error: errorMessage };
      }

      if (!data.user) {
        return { user: null, error: 'No se pudo obtener la información del usuario' };
      }

      // Guardar JWT
      if (data.session?.access_token && typeof window !== 'undefined') {
        window.localStorage.setItem('supabase_jwt', data.session.access_token);
      }

      // Intentar obtener el rol desde la tabla users
      let userRole: 'super_admin' | 'despacho_admin' | 'usuario' = 'usuario';
      let userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuario';
      
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('rol, nombre, apellidos')
          .eq('id', data.user.id)
          .single();

        if (!userError && userData) {
          userRole = (userData.rol || 'usuario') as 'super_admin' | 'despacho_admin' | 'usuario';
          if (userData.nombre) {
            userName = `${userData.nombre} ${userData.apellidos || ''}`.trim();
          }
        } else {
          console.warn('⚠️ No se pudo obtener rol desde tabla users:', userError);
        }
      } catch (err) {
        console.warn('⚠️ Error al consultar tabla users:', err);
      }

      const user = {
        id: data.user.id,
        email: data.user.email || '',
        name: userName,
        role: userRole,
      };

      return { user, error: null };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Error de conexión' };
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error al cerrar sesión:', error);
        return { error: error.message };
      }

      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase_jwt');
        window.localStorage.removeItem('lexhoy_user');
        window.localStorage.removeItem('isAuthenticated');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Error en logout:', error);
      return { error: error instanceof Error ? error.message : 'Error al cerrar sesión' };
    }
  }

  /**
   * Obtener sesión actual
   */
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error al obtener sesión:', error);
        return { session: null, error: error.message };
      }

      return { session: data.session, error: null };
    } catch (error) {
      console.error('❌ Error en getSession:', error);
      return { session: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Obtener usuario actual (con rol desde la tabla users)
   */
  static async getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { user: null, error: null };
      }

      // Intentar obtener el rol desde la tabla users
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('rol, nombre, apellidos')
          .eq('id', session.user.id)
          .single();

        if (!userError && userData) {
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            name: userData.nombre ? `${userData.nombre} ${userData.apellidos || ''}`.trim() : session.user.email?.split('@')[0] || 'Usuario',
            role: (userData.rol || 'usuario') as 'super_admin' | 'despacho_admin' | 'usuario',
          };
          return { user, error: null };
        }
      } catch {
        console.warn('⚠️ No se pudo obtener rol desde tabla users, usando datos básicos');
      }

      // Fallback: usar datos de auth
      const user = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
        role: (session.user.user_metadata?.role || 'usuario') as 'super_admin' | 'despacho_admin' | 'usuario',
      };

      return { user, error: null };
    } catch (error) {
      console.error('❌ Error en getCurrentUser:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Escuchar cambios de autenticación
   */
  static onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        callback(event, session);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }

  /**
   * Registrar nuevo usuario
   */
  static async register(email: string, password: string, metadata?: { name?: string; role?: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) {
        console.error('❌ Error en registro:', error);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No se pudo crear el usuario' };
      }

      const user = {
        id: data.user.id,
        email: data.user.email || '',
        name: metadata?.name || data.user.email?.split('@')[0] || 'Usuario',
        role: (metadata?.role || 'usuario') as 'super_admin' | 'despacho_admin' | 'usuario',
      };

      return { user, error: null };
    } catch (error) {
      console.error('❌ Error en register:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Error al registrar' };
    }
  }

  /**
   * Resetear contraseña
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Error al enviar email' };
    }
  }

  /**
   * Actualizar contraseña
   */
  static async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Error al actualizar contraseña' };
    }
  }
}
