import { supabase } from './supabase';

export class AuthService {
  static async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      return { data: null, error };
    }
  }

  static async signUpWithEmail(email: string, password: string, userData: any) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            email_verified: false,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      return { data: null, error };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      return { error };
    }
  }

  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error getting session:', error.message);
      return { data: null, error };
    }
  }

  static async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error resetting password:', error.message);
      return { data: null, error };
    }
  }

  static async updateUser(userData: any) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: userData,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      return { data: null, error };
    }
  }

  static onAuthStateChange(callback: any) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
