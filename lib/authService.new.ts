import { supabase } from "./supabase";
import { User } from "./types";
import { EmailService } from "./emailService";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "despacho_admin" | "usuario";
}

export class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  static async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Limpiar JWT previo antes de login
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("supabase_jwt");
      }
      
      // Intentar autenticación con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Obtener el JWT después de login
      const jwt = authData.session?.access_token;
      if (jwt && typeof window !== "undefined") {
        window.localStorage.setItem("supabase_jwt", jwt);
      }

      if (authError) {
        console.error("Auth error:", authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return {
          user: null,
          error: "No se pudo obtener información del usuario",
        };
      }

      // Obtener datos adicionales del usuario desde nuestra tabla users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (userError) {
        console.error("User data error:", userError);
        // Si el usuario no existe en nuestra tabla, crearlo
        if (userError.code === "PGRST116") {
          const newUser = await this.createUserRecord(authData.user.id, email, "", "");
          if (newUser.user) {
            return {
              user: {
                id: newUser.user.id,
                email: newUser.user.email,
                name: `${newUser.user.nombre} ${newUser.user.apellidos}`,
                role: newUser.user.rol as "usuario",
              },
              error: null,
            };
          }
        }
        return { user: null, error: "Error al obtener datos del usuario" };
      }

      // Actualizar último acceso
      await supabase
        .from("users")
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq("id", userData.id);

      return {
        user: {
          id: userData.id,
          email: userData.email,
          name: `${userData.nombre} ${userData.apellidos}`,
          role: userData.rol as "super_admin" | "despacho_admin" | "usuario",
        },
        error: null,
      };
    } catch (error) {
      console.error("Error en AuthService.signIn:", error);
      return { user: null, error: "Error de conexión" };
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async signUp(
    email: string,
    password: string,
    userData: {
      nombre: string;
      apellidos: string;
      telefono?: string;
    }
  ): Promise<{ user: AuthUser | null; error: string | null; exists?: boolean }> {
    console.log('Iniciando registro para:', email);
    try {
      // Primero, intentar registrar al usuario directamente
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: userData.nombre,
            apellidos: userData.apellidos,
            telefono: userData.telefono,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
        },
      });

      // Si hay un error en el registro
      if (signUpError) {
        // Si el usuario ya existe
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          // Verificar el estado del usuario
          const { data: { user }, error: userError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
            },
          });

          if (userError) {
            console.error('Error al verificar estado del usuario:', userError);
            return {
              user: null,
              error: 'Este correo ya está registrado. Por favor, inicia sesión o usa la opción de recuperación de contraseña si no la recuerdas.',
              exists: true
            };
          }

          // Si llegamos aquí, el usuario existe pero no está verificado
          return {
            user: null,
            error: 'Ya existe una cuenta con este correo pero no está verificada. Te hemos enviado un nuevo correo de verificación.',
            exists: true
          };
        }

        // Manejar otros errores
        if (signUpError.message.includes('email rate limit exceeded')) {
          return {
            user: null,
            error: 'Se ha alcanzado el límite de emails por hora. Por favor, espera 60 minutos antes de intentar registrarte nuevamente.'
          };
        }

        // Error genérico
        console.error('Error en el registro:', signUpError);
        return {
          user: null,
          error: `Error al registrar el usuario: ${signUpError.message}`
        };
      }

      // Si el registro fue exitoso pero no hay usuario (no debería pasar)
      if (!authData.user) {
        console.error('No se pudo obtener el usuario después del registro');
        return {
          user: null,
          error: 'Error al completar el registro. Por favor, inténtalo de nuevo.'
        };
      }

      // Crear el registro en la tabla users
      const { user: dbUser, error: createUserError } = await this.createUserRecord(
        authData.user.id,
        email,
        userData.nombre,
        userData.apellidos,
        userData.telefono
      );

      if (createUserError) {
        console.error('Error al crear registro de usuario:', createUserError);
        // No fallar el registro si hay un error al crear el registro en la tabla users
        // ya que el usuario ya está registrado en auth.users
      }

      // Enviar notificación de nuevo usuario a los administradores
      try {
        const subject = '👤 ¡Nuevo usuario registrado en LexHoy!';
        const fechaRegistro = new Date().toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
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
              
              <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">📋 Información del usuario</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Nombre completo:</strong></td>
                    <td style="padding: 8px 0;">${userData.nombre} ${userData.apellidos}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Correo electrónico:</strong></td>
                    <td style="padding: 8px 0;">${email}</td>
                  </tr>
                  ${userData.telefono ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Teléfono:</strong></td>
                    <td style="padding: 8px 0;">${userData.telefono}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Rol asignado:</strong></td>
                    <td style="padding: 8px 0;">
                      <span style="background-color: #e0e7ff; color: #4f46e5; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                        Usuario
                      </span>
                    </td>
                  </tr>
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

        // Enviar notificación a los super administradores
        await EmailService.sendToSuperAdmins({
          subject,
          html
        });

        console.log('Notificación de nuevo usuario enviada a los administradores');
      } catch (emailError) {
        console.error('Error al enviar notificación de nuevo usuario:', emailError);
        // No fallar el registro si hay un error en la notificación
      }

      // Si todo salió bien, retornar el usuario
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name: `${userData.nombre} ${userData.apellidos}`,
          role: 'usuario' as const,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error en AuthService.signUp:', error);
      return {
        user: null,
        error: 'Ocurrió un error inesperado al registrar el usuario. Por favor, inténtalo de nuevo más tarde.'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar JWT del localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase_jwt');
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { error: 'Error al cerrar sesión. Por favor, inténtalo de nuevo.' };
    }
  }

  /**
   * Obtener usuario actual
   */
  static async getCurrentUser(): Promise<{
    user: AuthUser | null;
    error: string | null;
  }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return { user: null, error: error?.message || 'No hay usuario autenticado' };
      }

      // Obtener datos adicionales del usuario desde nuestra tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error al obtener datos del usuario:', userError);
        return { user: null, error: 'Error al obtener datos del usuario' };
      }

      return {
        user: {
          id: user.id,
          email: user.email!,
          name: `${userData.nombre} ${userData.apellidos}`,
          role: userData.rol as "super_admin" | "despacho_admin" | "usuario",
        },
        error: null,
      };
    } catch (error) {
      console.error('Error en AuthService.getCurrentUser:', error);
      return { user: null, error: 'Error al obtener el usuario actual' };
    }
  }

  /**
   * Crear registro de usuario en la tabla users
   */
  private static async createUserRecord(
    userId: string,
    email: string,
    nombre: string,
    apellidos: string,
    telefono?: string
  ): Promise<{ user: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email,
            nombre,
            apellidos,
            telefono,
            rol: 'usuario',
            activo: true,
            fecha_registro: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { user: data, error: null };
    } catch (error) {
      console.error('Error al crear registro de usuario:', error);
      return { user: null, error };
    }
  }

  /**
   * Escuchar cambios en el estado de autenticación
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Guardar el JWT en localStorage cuando el usuario inicia sesión
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('supabase_jwt', session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        // Eliminar el JWT del localStorage cuando el usuario cierra sesión
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('supabase_jwt');
        }
      }
      callback(event, session);
    });
  }

  /**
   * Restablecer contraseña
   */
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento:', error);
      return { 
        error: 'Error al enviar el correo de restablecimiento. Por favor, verifica el correo electrónico e inténtalo de nuevo.' 
      };
    }
  }

  /**
   * Actualizar contraseña
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      return { 
        error: 'Error al actualizar la contraseña. Por favor, inténtalo de nuevo.' 
      };
    }
  }
}
