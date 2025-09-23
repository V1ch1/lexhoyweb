import { supabase } from './supabase';
import { User } from './types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'despacho_admin' | 'usuario';
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
          emailRedirectTo: `${window.location.origin}/auth/confirm`
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
            role: 'usuario'
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
      console.log('🔍 AuthService: Getting current user...');
      
      // Debug de configuración
      console.log('� AuthService: Supabase config check:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
        keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
      });
      
      console.log('�🔍 AuthService: Step 1 - Calling supabase.auth.getUser()...');
      
      // Agregar timeout para evitar cuelgue infinito
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: supabase.auth.getUser() took too long')), 5000);
      });
      
      const authPromise = supabase.auth.getUser();
      
      const { data: authData, error: authError } = await Promise.race([
        authPromise, 
        timeoutPromise
      ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;
      
      console.log('🔍 AuthService: Step 1 result:', { authData: !!authData, authError: authError?.message });

      if (authError || !authData.user) {
        console.log('❌ AuthService: No auth user or error:', authError?.message);
        return { user: null, error: authError?.message || 'No hay usuario autenticado' };
      }

      console.log('✅ AuthService: Auth user found:', authData.user.id, authData.user.email);

      // Obtener datos del usuario desde nuestra tabla
      console.log('🔍 AuthService: Step 2 - Fetching user data from users table...');
      console.log('🔍 AuthService: Looking for user ID:', authData.user.id);
      
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      // Si no se encuentra por ID, buscar por email como fallback
      if (userError && userError.code === 'PGRST116') {
        console.log('🔄 AuthService: User not found by ID, trying by email...');
        const result = await supabase
          .from('users')
          .select('*')
          .eq('email', authData.user.email)
          .single();
        
        userData = result.data;
        userError = result.error;
      }
      
      console.log('🔍 AuthService: Step 2 result:', { userData: !!userData, userError: userError?.message });

      if (userError || !userData) {
        console.error('❌ AuthService: Error fetching user data:', userError);
        // Si existe authData.user, devolver al menos los datos básicos
        return {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.nombre || authData.user.email,
            role: (authData.user.user_metadata?.rol as 'super_admin' | 'despacho_admin' | 'usuario') || 'usuario'
          },
          error: null
        };
      }

      console.log('✅ AuthService: User data found:', userData);

      const result = {
        user: {
          id: userData.id,
          email: userData.email,
          name: `${userData.nombre} ${userData.apellidos}`,
          role: userData.rol
        },
        error: null
      };
      
      console.log('🎯 AuthService: Final result:', result);
      return result;

    } catch (error) {
      console.error('💥 AuthService: Get current user error:', error);
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
          rol: 'usuario', // Por defecto, los nuevos usuarios son usuarios básicos
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
      console.log('🔔 AuthService: Auth state change event:', event, !!session);
      
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        // Usuario se ha logueado, token refrescado, o sesión inicial
        console.log('🔄 AuthService: Getting user data for auth change...');
        const { user } = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT' || !session) {
        // Usuario se ha deslogueado o no hay sesión
        console.log('🚪 AuthService: User signed out or no session');
        callback(null);
      }
    });
  }
}