import { supabase } from "./supabase";
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
          const newUser = await this.createUserRecord(authData.user.id, email);
          if (newUser) {
            return {
              user: {
                id: newUser.id,
                email: newUser.email,
                name: `${newUser.nombre} ${newUser.apellidos}`,
                role: newUser.rol,
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
          role: userData.rol,
        },
        error: null,
      };
    } catch {
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

        if (signUpError?.message?.includes("Invalid email")) {
          return { user: null, error: "El formato del email no es válido." };
        }

        if (signUpError?.message?.includes("Password should be at least")) {
          return {
            user: null,
            error: "La contraseña debe tener al menos 6 caracteres.",
          };
        }

        return { 
          user: null, 
          error: `Error al registrar el usuario: ${signUpError?.message || 'Error desconocido'}` 
        };
      }

      if (!authData.user) {
        return { 
          user: null,
          error: "No se pudo crear el usuario. Por favor, inténtalo de nuevo más tarde.",
          exists: false
        };
      }

      // Crear registro en la base de datos
      const { user: newUser, error: createUserError } = await this.createUserRecord(
        authData.user.id,
        email,
        userData.nombre,
        userData.apellidos,
        userData.telefono
      );

      if (createUserError || !newUser) {
        return {
          user: null,
          error: createUserError || "Se creó la cuenta pero hubo un error al guardar la información adicional. Por favor, contacta con soporte.",
          exists: createUserError?.includes('ya existe') ? true : false
        };
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
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #4f46e5;">
                <h3 style="margin-top: 0; color: #1f2937;">📋 Información del usuario</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Nombre completo:</strong></td>
                    <td style="padding: 8px 0;">${newUser.nombre} ${newUser.apellidos}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Correo electrónico:</strong></td>
                    <td style="padding: 8px 0;">${newUser.email}</td>
                  </tr>
                  ${newUser.telefono ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Teléfono:</strong></td>
                    <td style="padding: 8px 0;">${newUser.telefono}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;"><strong>Rol asignado:</strong></td>
                    <td style="padding: 8px 0;">
                      <span style="background-color: #e0e7ff; color: #4f46e5; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                        ${newUser.rol}
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
      } catch (error) {
        console.error('Error al enviar notificación de nuevo usuario:', error);
        // No fallar el registro si hay un error en la notificación
      }

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: `${newUser.nombre} ${newUser.apellidos}`,
          role: newUser.rol as AuthUser['role'],
        },
        error: null,
      };
    } catch (error) {
      console.error("Error en AuthService.signUp:", error);
      return { 
        user: null, 
        error: "Ocurrió un error inesperado al registrar el usuario. Por favor, inténtalo de nuevo más tarde." 
      };
    }
  }

  /**
   * Cerrar sesión
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error);
        return { error: error.message };
      }
      
      // Limpiar JWT al cerrar sesión
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase_jwt');
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { error: 'Error al cerrar sesión' };
    }
  }

  /**
   * Obtener usuario actual
{{ ... }}
   */
  static async getCurrentUser(): Promise<{
    user: AuthUser | null;
    error: string | null;
  }> {
    try {
      // Agregar timeout para evitar cuelgue infinito
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error("Timeout: supabase.auth.getUser() took too long")),
          5000
        );
      });

      const authPromise = supabase.auth.getUser();

      const { data: authData, error: authError } = (await Promise.race([
        authPromise,
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof supabase.auth.getUser>>;

      if (authError || !authData.user) {
        return {
          user: null,
          error: authError?.message || "No hay usuario autenticado",
        };
      }

      // Obtener datos del usuario desde nuestra tabla
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      // Si no se encuentra por ID, buscar por email como fallback
      if (userError && userError.code === "PGRST116") {
        const result = await supabase
          .from("users")
          .select("*")
          .eq("email", authData.user.email)
          .maybeSingle();
        userData = result.data;
        userError = result.error;
      }

      // Si sigue sin encontrarse, crear el usuario en la tabla 'users' solo si no existe
      if (userError || !userData) {
        if (authData.user) {
          // Comprobar si ya existe por id o email
          const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .or(`id.eq.${authData.user.id},email.eq.${authData.user.email}`)
            .maybeSingle();
          if (existingUser) {
            return {
              user: {
                id: existingUser.id,
                email: existingUser.email,
                name: `${existingUser.nombre} ${existingUser.apellidos}`,
                role: existingUser.rol,
              },
              error: null,
            };
          }
          // Si no existe, crearlo
          const nombre = authData.user.user_metadata?.nombre || "";
          const apellidos = authData.user.user_metadata?.apellidos || "";
          const telefono = authData.user.user_metadata?.telefono || "";
          const rol =
            (authData.user.user_metadata?.rol as
              | "super_admin"
              | "despacho_admin"
              | "usuario") || "usuario";
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              nombre,
              apellidos,
              telefono,
              rol,
              estado: "activo",
              fecha_registro: new Date().toISOString(),
              activo: true,
              email_verificado: !!authData.user.email_confirmed_at,
              plan: "basico",
            })
            .select()
            .maybeSingle();
          if (createError || !newUser) {
            // Si falla la creación, devolver datos mínimos
            return {
              user: {
                id: authData.user.id,
                email: authData.user.email ?? "",
                name: nombre ? nombre : authData.user.email ?? "",
                role: rol,
              },
              error: null,
            };
          }
          return {
            user: {
              id: newUser.id,
              email: newUser.email,
              name: `${newUser.nombre} ${newUser.apellidos}`,
              role: newUser.rol,
            },
            error: null,
          };
        }
        // Si no existe en Auth, devolver null
        return { user: null, error: "No hay usuario autenticado" };
      }

      const result = {
        user: {
          id: userData.id,
          email: userData.email,
          name: `${userData.nombre} ${userData.apellidos}`,
          role: userData.rol,
        },
        error: null,
      };

      return result;
    } catch {
      return { user: null, error: "Error de conexión" };
    }
  }

  /**
   * Cambiar contraseña
   */
  static async updatePassword(
    newPassword: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error: error?.message || null };
    } catch (error) {
      console.error("Update password error:", error);
      return { error: "Error al cambiar la contraseña" };
    }
  }

  /**
   * Resetear contraseña
   */
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error: error?.message || null };
    } catch (error) {
      console.error("Reset password error:", error);
      return { error: "Error al enviar email de recuperación" };
    }
  }

  /**
   * Verificar si un email ya está registrado
   */
  static async emailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Crear registro de usuario en nuestra tabla
   */
  static async createUserRecord(
    userId: string,
    email: string,
    nombre: string,
    apellidos: string,
    telefono?: string
  ): Promise<{ user: User | null; error: string | null }> {
    console.log('Creando registro de usuario:', { userId, email });
    try {
      // Primero verificamos si el usuario ya existe
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (existingUserError) {
        console.error("Error al verificar si el usuario ya existe:", existingUserError);
        return { 
          user: null, 
          error: 'Ocurrió un error al verificar si el usuario ya existe. Por favor, inténtalo de nuevo.' 
        };
      }

      if (existingUser) {
        console.log("Usuario ya existe en la base de datos");
        return { 
          user: null, 
          error: 'Ya existe una cuenta con este correo electrónico. Por favor, inicia sesión o usa la opción de recuperación de contraseña.' 
        };
      }

      // Si no existe, lo creamos
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email,
          nombre,
          apellidos,
          telefono,
          rol: "usuario",
          estado: "pendiente",
          fecha_registro: new Date().toISOString(),
          activo: true,
          email_verificado: false,
        })
        .select()
        .single();

      if (userError) {
        console.error("Error al crear el usuario en la base de datos:", userError);
        return { 
          user: null, 
          error: 'Error al crear el usuario. Por favor, inténtalo de nuevo.' 
        };
      }

      return { user, error: null };
    } catch (error) {
      console.error("Create user record error:", error);
      return { 
        user: null, 
        error: 'Ocurrió un error inesperado al crear el usuario.' 
      };
    }
  }

  /**
   * Escuchar cambios en el estado de autenticación
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, hasSession: !!session });
      
      if (event === 'SIGNED_OUT' || !session) {
        // Limpiar el JWT al cerrar sesión
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('supabase_jwt');
        }
        callback(null);
        return;
      }

      // Para los demás eventos, verificar la sesión
      if (session?.user) {
        try {
          const { user, error } = await this.getCurrentUser();
          if (error) {
            console.error('Error getting current user:', error);
            // Si hay un error pero tenemos sesión, intentar forzar un refresh
            if (session.user) {
              const { data: { user: refreshedUser } } = await supabase.auth.refreshSession();
              if (refreshedUser) {
                const { user: currentUser } = await this.getCurrentUser();
                callback(currentUser);
                return;
              }
            }
            callback(null);
            return;
          }
          callback(user);
        } catch (error) {
          console.error('Error in auth state change:', error);
          callback(null);
        }
      }
    });
  }
}
