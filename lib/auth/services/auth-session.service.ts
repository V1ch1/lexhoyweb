import { supabase } from '@/lib/supabase';
import { AuthUser } from '../types/auth.types';

export class AuthSessionService {
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Obtener datos adicionales del usuario
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !userData) {
        console.error('Error al obtener datos del usuario:', error);
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        name: `${userData.nombre} ${userData.apellidos}`.trim(),
        role: userData.rol,
      };
    } catch (error) {
      console.error('Error en AuthSessionService.getCurrentUser:', error);
      return null;
    }
  }

  static async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      return { session: data.session, user: data.user, error: null };
    } catch (error) {
      console.error('Error al refrescar la sesión:', error);
      return { session: null, user: null, error };
    }
  }

  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Error al obtener la sesión:', error);
      return { session: null, error };
    }
  }

  static async onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        callback(event, session);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }
}
