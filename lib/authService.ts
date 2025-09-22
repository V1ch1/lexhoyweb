import { supabase } from './supabase';
import { User } from './types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'despacho_admin';
}

export class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  static async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Intentar autenticación con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'No se pudo obtener información del usuario' };
      }

      // Obtener datos adicionales del usuario desde nuestra tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) {
        console.error('User data error:', userError);
        // Si el usuario no existe en nuestra tabla, crearlo
        if (userError.code === 'PGRST116') {
          const newUser = await this.createUserRecord(authData.user.id, email);
          if (newUser) {
            return { 
              user: {
                id: newUser.id,
                email: newUser.email,
                name: `${newUser.nombre} ${newUser.apellidos}`,
                role: newUser.rol
              }, 
              error: null 
            };
          }
        }
        return { user: null, error: 'Error al obtener datos del usuario' };
      }

      // Actualizar último acceso
      await supabase
        .from('users')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', userData.id);

      return {
        user: {
          id: userData.id,
          email: userData.email,
          name: `${userData.nombre} ${userData.apellidos}`,
          role: userData.rol
        },
        error: null
      };

    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: 'Error de conexión' };
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async signUp(email: string, password: string, userData: {
    nombre: string;
    apellidos: string;
    telefono?: string;
  }): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: userData.nombre,
            apellidos: userData.apellidos,
            telefono: userData.telefono
          },
          emailRedirectTo: `http://localhost:3000/auth/confirm`
        }
      });

      if (authError) {
        // Manejar errores específicos de Supabase
        if (authError.message.includes('User already registered')) {
          return { user: null, error: 'Este email ya está registrado. Por favor, usa el formulario de login o prueba con un email diferente.' };
        }
        
        if (authError.message.includes('email rate limit exceeded')) {
          return { user: null, error: 'Se ha alcanzado el límite de emails por hora. Por favor, espera 60 minutos antes de intentar registrarte nuevamente, o intenta con un email diferente.' };
        }
        
        if (authError.message.includes('For security purposes, you can only request this after')) {
          const match = authError.message.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '60';
          return { user: null, error: `Por seguridad, debes esperar ${seconds} segundos antes de intentar registrarte nuevamente. Por favor, espera un momento.` };
        }
        
        if (authError.message.includes('Invalid email')) {
          return { user: null, error: 'El formato del email no es válido.' };
        }
        
        if (authError.message.includes('Password should be at least')) {
          return { user: null, error: 'La contraseña debe tener al menos 6 caracteres.' };
        }
        
        return { user: null, error: `Error de registro: ${authError.message}` };
      }

      if (!authData.user) {
        return { user: null, error: 'Error al crear la cuenta' };
      }

      // Si el usuario fue creado pero necesita confirmación por email
      if (authData.user && !authData.user.email_confirmed_at) {
        // Usuario creado exitosamente en Supabase Auth, pendiente de confirmación
        // No creamos el registro en nuestra tabla hasta que confirme el email
        return { 
          user: {
            id: authData.user.id,
            email: email,
            name: `${userData.nombre} ${userData.apellidos}`,
            role: 'despacho_admin'
          }, 
          error: null 
        };
      }

      // Crear registro en nuestra tabla users inmediatamente
      const newUser = await this.createUserRecord(
        authData.user.id, 
        email, 
        userData.nombre, 
        userData.apellidos,
        userData.telefono
      );

      if (!newUser) {
        return { user: null, error: 'Error al crear el perfil de usuario. El usuario fue creado en el sistema de autenticación pero no se pudo completar el perfil.' };
      }

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: `${newUser.nombre} ${newUser.apellidos}`,
          role: newUser.rol
        },
        error: null
      };

    } catch {
      return { user: null, error: 'Error de conexión' };
    }
  }

  /**
   * Cerrar sesión
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'Error al cerrar sesión' };
    }
  }

  /**
   * Obtener usuario actual
   */
  static async getCurrentUser(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        return { user: null, error: authError?.message || 'No hay usuario autenticado' };
      }

      // Obtener datos del usuario desde nuestra tabla
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        return { user: null, error: 'Error al obtener datos del usuario' };
      }

      return {
        user: {
          id: userData.id,
          email: userData.email,
          name: `${userData.nombre} ${userData.apellidos}`,
          role: userData.rol
        },
        error: null
      };

    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error: 'Error de conexión' };
    }
  }

  /**
   * Cambiar contraseña
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      return { error: error?.message || null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: 'Error al cambiar la contraseña' };
    }
  }

  /**
   * Resetear contraseña
   */
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      return { error: error?.message || null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'Error al enviar email de recuperación' };
    }
  }

  /**
   * Verificar si un email ya está registrado
   */
  static async emailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Crear registro de usuario en nuestra tabla
   */
  private static async createUserRecord(
    authId: string, 
    email: string, 
    nombre?: string, 
    apellidos?: string,
    telefono?: string
  ): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authId, // Usar el mismo ID de Supabase Auth
          email,
          nombre: nombre || email.split('@')[0],
          apellidos: apellidos || '',
          telefono: telefono || null,
          rol: 'despacho_admin', // Por defecto, los nuevos usuarios son despacho_admin
          estado: 'activo', // Cambiado de 'pendiente' a 'activo' 
          activo: true,
          email_verificado: true, // Cambiado a true ya que auto-confirm está habilitado
          fecha_registro: new Date().toISOString(),
          plan: 'basico'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating user:', error);
        
        // Verificar si es error de duplicado
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log('Usuario ya existe en la base de datos');
          return null;
        }
        
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create user record error:', error);
      return null;
    }
  }

  /**
   * Escuchar cambios en el estado de autenticación
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Usuario se ha logueado
        const { user } = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        // Usuario se ha deslogueado
        callback(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token se ha refrescado
        const { user } = await this.getCurrentUser();
        callback(user);
      }
    });
  }
}