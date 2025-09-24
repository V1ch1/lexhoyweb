import { supabase } from "./supabase";
import {
  User,
  UserDespacho,
  SyncLog,
  UserRole,
  UserStatus,
  PlanType,
} from "./types";

// Interfaz para los datos raw de la base de datos
interface UserRaw {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  fecha_registro: string;
  ultimo_acceso?: string;
  activo: boolean;
  email_verificado: boolean;
  plan: string;
  rol: UserRole;
  estado: UserStatus;
  fecha_aprobacion?: string;
  aprobado_por?: string;
  notas_admin?: string;
  despacho_id?: string;
}

export class UserService {
  /**
   * Cancelar solicitud de despacho: actualiza el estado a cancelada
   */
  async cancelarSolicitudDespacho(
    solicitudId: string,
    canceladoPor: string,
    notas?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("solicitudes_despacho")
      .update({
        estado: "cancelada",
        fecha_respuesta: new Date().toISOString(),
        respondido_por: canceladoPor,
        notas_respuesta: notas,
      })
      .eq("id", solicitudId);
    if (error) throw error;
  }

  // ======================== GESTIÓN DE USUARIOS ========================

  /**
   * Obtener todos los usuarios (solo super_admin)
   */
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Mapear nombres de columnas de DB a propiedades de TypeScript
    return (data || []).map((user: UserRaw) => ({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      telefono: user.telefono,
      fechaRegistro: new Date(user.fecha_registro),
      ultimoAcceso: user.ultimo_acceso
        ? new Date(user.ultimo_acceso)
        : undefined,
      activo: user.activo,
      emailVerificado: user.email_verificado,
      plan: user.plan as PlanType,
      rol: user.rol,
      estado: user.estado,
      fechaAprobacion: user.fecha_aprobacion
        ? new Date(user.fecha_aprobacion)
        : undefined,
      aprobadoPor: user.aprobado_por,
      notasAdmin: user.notas_admin,
      despachoId: user.despacho_id,
    }));
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") return null; // No encontrado
      throw error;
    }

    if (!data) return null;

    // Mapear nombres de columnas de DB a propiedades de TypeScript
    const user: UserRaw = data;
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      telefono: user.telefono,
      fechaRegistro: new Date(user.fecha_registro),
      ultimoAcceso: user.ultimo_acceso
        ? new Date(user.ultimo_acceso)
        : undefined,
      activo: user.activo,
      emailVerificado: user.email_verificado,
      plan: user.plan as PlanType,
      rol: user.rol,
      estado: user.estado,
      fechaAprobacion: user.fecha_aprobacion
        ? new Date(user.fecha_aprobacion)
        : undefined,
      aprobadoPor: user.aprobado_por,
      notasAdmin: user.notas_admin,
      despachoId: user.despacho_id,
    };
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") return null; // No encontrado
      throw error;
    }
    return data;
  }

  /**
   * Crear nuevo usuario (solo super_admin)
   */
  async createUser(userData: {
    email: string;
    nombre: string;
    apellidos: string;
    telefono?: string;
    rol: UserRole;
    estado?: UserStatus;
  }): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert({
        ...userData,
        fecha_registro: new Date().toISOString(),
        activo: true,
        email_verificado: false,
        plan: "basico",
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Crear usuario con cuenta de autenticación y contraseña temporal
   */
  async createUserWithAuth(userData: {
    email: string;
    nombre: string;
    apellidos: string;
    telefono?: string;
    rol: UserRole;
  }): Promise<{ user: User; temporaryPassword: string }> {
    try {
      // 1. Generar contraseña temporal
      const temporaryPassword = this.generateTemporaryPassword();

      // 2. Crear cuenta de autenticación en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: temporaryPassword,
        options: {
          data: {
            nombre: userData.nombre,
            apellidos: userData.apellidos,
            telefono: userData.telefono,
            created_by_admin: true,
          },
          emailRedirectTo: `${
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:3000"
          }/auth/confirm`,
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("No se pudo crear la cuenta de usuario");
      }

      // 3. Crear registro en nuestra tabla users con el ID de Supabase Auth
      const { data: localUser, error: localError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id, // Usar el ID de Supabase Auth
          email: userData.email,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          telefono: userData.telefono,
          rol: userData.rol,
          estado: "activo", // Activo porque fue creado por admin
          fecha_registro: new Date().toISOString(),
          activo: true,
          email_verificado: authData.user.email_confirmed_at ? true : false,
          plan: "basico",
        })
        .select()
        .maybeSingle();

      if (localError) {
        console.error("Error creating local user record:", localError);
        throw new Error(
          `Error creando perfil de usuario: ${localError.message}`
        );
      }

      return { user: localUser, temporaryPassword };
    } catch (error) {
      console.error("Error in createUserWithAuth:", error);
      throw error;
    }
  }

  /**
   * Generar contraseña temporal segura
   */
  private generateTemporaryPassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Mapear propiedades de TypeScript a nombres de columnas de DB
    const dbUpdates: Record<string, unknown> = {};

    if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre;
    if (updates.apellidos !== undefined)
      dbUpdates.apellidos = updates.apellidos;
    if (updates.telefono !== undefined) dbUpdates.telefono = updates.telefono;
    if (updates.rol !== undefined) dbUpdates.rol = updates.rol;
    if (updates.estado !== undefined) dbUpdates.estado = updates.estado;
    if (updates.activo !== undefined) dbUpdates.activo = updates.activo;
    if (updates.emailVerificado !== undefined)
      dbUpdates.email_verificado = updates.emailVerificado;
    if (updates.notasAdmin !== undefined)
      dbUpdates.notas_admin = updates.notasAdmin;
    if (updates.fechaAprobacion !== undefined)
      dbUpdates.fecha_aprobacion = updates.fechaAprobacion?.toISOString();
    if (updates.aprobadoPor !== undefined)
      dbUpdates.aprobado_por = updates.aprobadoPor;
    if (updates.ultimoAcceso !== undefined)
      dbUpdates.ultimo_acceso = updates.ultimoAcceso?.toISOString();

    const { data, error } = await supabase
      .from("users")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Mapear respuesta de DB a formato TypeScript
    const user: UserRaw = data;
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      telefono: user.telefono,
      fechaRegistro: new Date(user.fecha_registro),
      ultimoAcceso: user.ultimo_acceso
        ? new Date(user.ultimo_acceso)
        : undefined,
      activo: user.activo,
      emailVerificado: user.email_verificado,
      plan: user.plan as PlanType,
      rol: user.rol,
      estado: user.estado,
      fechaAprobacion: user.fecha_aprobacion
        ? new Date(user.fecha_aprobacion)
        : undefined,
      aprobadoPor: user.aprobado_por,
      notasAdmin: user.notas_admin,
      despachoId: user.despacho_id,
    };
  }

  /**
   * Aprobar usuario (cambiar estado a activo)
   */
  async approveUser(userId: string, approvedBy: string): Promise<User> {
    return this.updateUser(userId, {
      estado: "activo",
      fechaAprobacion: new Date(),
      aprobadoPor: approvedBy,
    });
  }

  /**
   * Asignar usuario a despacho y promocionar a despacho_admin
   */
  async assignUserToDespachoAndPromote(
    userId: string,
    despachoId: string,
    assignedBy: string
  ): Promise<{ user: User; assignment: UserDespacho }> {
    // 1. Asignar despacho
    const assignment = await this.assignDespachoToUser(
      userId,
      despachoId,
      assignedBy
    );

    // 2. Cambiar rol a despacho_admin
    const updatedUser = await this.updateUser(userId, {
      rol: "despacho_admin",
    });

    return { user: updatedUser, assignment };
  }

  /**
   * Remover usuario de despacho y regresar a rol usuario (si no tiene más despachos)
   */
  async removeUserFromDespachoAndDemote(
    userId: string,
    despachoId: string
  ): Promise<User> {
    // 1. Desactivar asignación de despacho
    await supabase
      .from("user_despachos")
      .update({ activo: false })
      .eq("user_id", userId)
      .eq("despacho_id", despachoId);

    // 2. Verificar si el usuario tiene otros despachos activos
    const { data: activeDespachos } = await supabase
      .from("user_despachos")
      .select("id")
      .eq("user_id", userId)
      .eq("activo", true);

    // 3. Si no tiene más despachos, cambiar rol a usuario
    if (!activeDespachos || activeDespachos.length === 0) {
      return this.updateUser(userId, {
        rol: "usuario",
      });
    }

    // Si aún tiene despachos, mantener rol despacho_admin
    const user = await this.getUserById(userId);
    if (!user) throw new Error("Usuario no encontrado");
    return user;
  }

  // ======================== ASIGNACIÓN DE DESPACHOS ========================

  /**
   * Obtener despachos asignados a un usuario
   */
  async getUserDespachos(userId: string): Promise<UserDespacho[]> {
    const { data, error } = await supabase
      .from("user_despachos")
      .select(
        `
        *,
        despachos:despacho_id (nombre, object_id, slug)
      `
      )
      .eq("user_id", userId)
      .eq("activo", true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Asignar despacho a usuario
   */
  async assignDespachoToUser(
    userId: string,
    despachoId: string,
    assignedBy: string,
    permisos?: { leer: boolean; escribir: boolean; eliminar: boolean }
  ): Promise<UserDespacho> {
    const { data, error } = await supabase
      .from("user_despachos")
      .insert({
        user_id: userId,
        despacho_id: despachoId,
        asignado_por: assignedBy,
        permisos: permisos || { leer: true, escribir: true, eliminar: false },
        activo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Quitar asignación de despacho
   */
  async unassignDespachoFromUser(
    userId: string,
    despachoId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("user_despachos")
      .update({ activo: false })
      .eq("user_id", userId)
      .eq("despacho_id", despachoId);

    if (error) throw error;
  }

  /**
   * Obtener usuarios asignados a un despacho
   */
  async getDespachoUsers(
    despachoId: string
  ): Promise<Array<UserDespacho & { user: User }>> {
    const { data, error } = await supabase
      .from("user_despachos")
      .select(
        `
        *,
        users:user_id (*)
      `
      )
      .eq("despacho_id", despachoId)
      .eq("activo", true);

    if (error) throw error;
    return data || [];
  }

  // ======================== SOLICITUDES DE REGISTRO ========================

  /**
   * Obtener todas las solicitudes (solo super_admin)
   */
  async getAllSolicitudes(): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .order("fecha_solicitud", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Crear solicitud de registro (público)
   */
  async createSolicitud(solicitudData: {
    user_id: string;
    user_email: string;
    user_name: string;
    despacho_id: string;
    despacho_nombre: string;
    despacho_localidad?: string;
    despacho_provincia?: string;
    estado?: string;
  }): Promise<Record<string, unknown>> {
    const { data, error } = await supabase
      .from("solicitudes_despacho")
      .insert({
        ...solicitudData,
        estado: solicitudData.estado || "pendiente",
        fecha_solicitud: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Aprobar solicitud (crear usuario y despacho)
   */
  async approveSolicitud(
    solicitudId: string,
    approvedBy: string,
    notas?: string
  ): Promise<{ user: User; despacho: Record<string, unknown> }> {
    // Obtener solicitud
    const { data: solicitud, error: solicitudError } = await supabase
      .from("solicitudes_registro")
      .select("*")
      .eq("id", solicitudId)
      .single();

    if (solicitudError) throw solicitudError;

    // Crear despacho
    const { data: despacho, error: despachoError } = await supabase
      .from("despachos")
      .insert({
        object_id: `lexhoy-${Date.now()}`,
        nombre: solicitud.datos_despacho.nombre,
        descripcion: solicitud.datos_despacho.descripcion,
        slug: solicitud.datos_despacho.nombre
          .toLowerCase()
          .replace(/\s+/g, "-"),
        areas_practica: solicitud.datos_despacho.especialidades || [],
        estado_registro: "aprobado",
        fecha_aprobacion: new Date().toISOString(),
        aprobado_por: approvedBy,
      })
      .select()
      .single();

    if (despachoError) throw despachoError;

    // Crear usuario
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: solicitud.email,
        nombre: solicitud.nombre,
        apellidos: solicitud.apellidos,
        telefono: solicitud.telefono,
        rol: "despacho_admin",
        estado: "activo",
        fecha_aprobacion: new Date().toISOString(),
        aprobado_por: approvedBy,
        plan: "basico",
      })
      .select()
      .single();

    if (userError) throw userError;

    // Asignar despacho al usuario
    await this.assignDespachoToUser(user.id, despacho.id, approvedBy);

    // Actualizar solicitud
    await supabase
      .from("solicitudes_registro")
      .update({
        estado: "aprobado",
        fecha_respuesta: new Date().toISOString(),
        respondido_por: approvedBy,
        notas_respuesta: notas,
        user_creado_id: user.id,
        despacho_creado_id: despacho.id,
      })
      .eq("id", solicitudId);

    return { user, despacho };
  }

  /**
   * Rechazar solicitud
   */
  async rejectSolicitud(
    solicitudId: string,
    rejectedBy: string,
    notas: string
  ): Promise<void> {
    const { error } = await supabase
      .from("solicitudes_registro")
      .update({
        estado: "rechazado",
        fecha_respuesta: new Date().toISOString(),
        respondido_por: rejectedBy,
        notas_respuesta: notas,
      })
      .eq("id", solicitudId);

    if (error) throw error;
  }

  // ======================== LOGS DE SINCRONIZACIÓN ========================

  /**
   * Registrar log de sincronización
   */
  async logSync(logData: {
    tipo: "algolia" | "wordpress";
    accion: "create" | "update" | "delete";
    entidad: "despacho" | "sede" | "user";
    entidadId: string;
    datosEnviados?: Record<string, unknown>;
    respuestaApi?: Record<string, unknown>;
    exitoso: boolean;
    errorMensaje?: string;
  }): Promise<SyncLog> {
    const { data, error } = await supabase
      .from("sync_logs")
      .insert({
        ...logData,
        fecha_sync: new Date().toISOString(),
        reintentos: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtener logs de sincronización
   */
  async getSyncLogs(limit = 100): Promise<SyncLog[]> {
    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .order("fecha_sync", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ======================== UTILIDADES ========================

  /**
   * Verificar si el usuario actual es super admin
   */
  async isCurrentUserSuperAdmin(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (error) return false;
    return data?.rol === "super_admin";
  }

  /**
   * Obtener usuario actual con sus despachos
   */
  async getCurrentUserWithDespachos(): Promise<{
    user: User;
    despachos: UserDespacho[];
  } | null> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    console.log(
      "[getCurrentUserWithDespachos] Resultado supabase.auth.getUser:",
      authUser
    );
    if (!authUser) return null;

    const user = await this.getUserById(authUser.id);
    console.log(
      "[getCurrentUserWithDespachos] Buscando en tabla users con id:",
      authUser.id,
      "Resultado:",
      user
    );
    if (!user) return null;

    const despachos = await this.getUserDespachos(user.id);
    console.log(
      "[getCurrentUserWithDespachos] Despachos encontrados:",
      despachos
    );

    return { user, despachos };
  }

  /**
   * Obtener estadísticas del sistema (solo para super_admin)
   */
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeDespachos: number;
    totalLeads: number;
    usersByRole: {
      super_admin: number;
      despacho_admin: number;
      usuario: number;
    };
  }> {
    try {
      // Total de usuarios
      const { count: totalUsers, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Despachos activos
      const { count: activeDespachos, error: despachosError } = await supabase
        .from("despachos")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      if (despachosError) {
        console.error("🔍 ERROR despachos:", despachosError);
        throw despachosError;
      }

      console.log("🔍 DEBUG despachos activos:", activeDespachos);

      // Total de leads
      const { count: totalLeads, error: leadsError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      if (leadsError) {
        console.error("🔍 ERROR leads:", leadsError);
        throw leadsError;
      }

      console.log("🔍 DEBUG total leads:", totalLeads);

      // Usuarios por rol
      const { data: roleData, error: roleError } = await supabase
        .from("users")
        .select("rol")
        .eq("activo", true);

      if (roleError) throw roleError;

      const usersByRole = {
        super_admin: 0,
        despacho_admin: 0,
        usuario: 0,
      };

      (roleData || []).forEach((user: { rol: string }) => {
        if (user.rol in usersByRole) {
          usersByRole[user.rol as keyof typeof usersByRole]++;
        }
      });

      return {
        totalUsers: totalUsers || 0,
        activeDespachos: activeDespachos || 0,
        totalLeads: totalLeads || 0,
        usersByRole,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      return {
        totalUsers: 0,
        activeDespachos: 0,
        totalLeads: 0,
        usersByRole: {
          super_admin: 0,
          despacho_admin: 0,
          usuario: 0,
        },
      };
    }
  }

  /**
   * Obtener estadísticas de despacho (para despacho_admin)
   */
  async getDespachoStats(userId: string): Promise<{
    leadsThisMonth: number;
    totalLeads: number;
    conversions: number;
  }> {
    try {
      // Obtener el despacho del usuario
      const { data: userDespacho, error: userError } = await supabase
        .from("user_despachos")
        .select("despacho_id")
        .eq("user_id", userId)
        .single();

      if (userError || !userDespacho) {
        return { leadsThisMonth: 0, totalLeads: 0, conversions: 0 };
      }

      // Total de leads del despacho
      const { count: totalLeads, error: totalError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("despacho_id", userDespacho.despacho_id);

      if (totalError) throw totalError;

      // Leads este mes
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );

      const { count: leadsThisMonth, error: monthError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("despacho_id", userDespacho.despacho_id)
        .gte("created_at", firstDayOfMonth.toISOString());

      if (monthError) throw monthError;

      // Conversiones (leads con estado 'convertido' o similar)
      const { count: conversions, error: convError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("despacho_id", userDespacho.despacho_id)
        .eq("estado", "convertido");

      if (convError) throw convError;

      return {
        leadsThisMonth: leadsThisMonth || 0,
        totalLeads: totalLeads || 0,
        conversions: conversions || 0,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas del despacho:", error);
      return { leadsThisMonth: 0, totalLeads: 0, conversions: 0 };
    }
  }

  /**
   * Actualizar el rol de un usuario
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      console.log(
        `🔄 Intentando actualizar usuario ${userId} a rol: ${newRole}`
      );

      // Primero verificar que el usuario existe
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, email, rol")
        .eq("id", userId)
        .single();

      if (checkError) {
        console.error("❌ Error verificando usuario:", checkError);
        throw new Error(`Error verificando usuario: ${checkError.message}`);
      }

      if (!existingUser) {
        throw new Error("Usuario no encontrado");
      }

      console.log(
        `👤 Usuario encontrado: ${existingUser.email}, rol actual: ${existingUser.rol}`
      );

      // Actualización simple - SOLO campos básicos que sabemos que existen
      const { data, error } = await supabase
        .from("users")
        .update({
          rol: newRole,
          estado: "activo",
          // Omitimos fecha_aprobacion completamente hasta resolver el esquema
        })
        .eq("id", userId)
        .select();

      if (error) {
        console.error("❌ Error de Supabase:", error);
        console.error(
          "❌ Detalles completos del error:",
          JSON.stringify(error, null, 2)
        );
        throw new Error(`Error de base de datos: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error("❌ No se actualizó ningún registro");
        throw new Error(
          "No se pudo actualizar el usuario. Verifica los permisos."
        );
      }

      console.log(
        `✅ Usuario ${userId} actualizado correctamente a rol: ${newRole}`
      );
      console.log(`✅ Datos actualizados:`, data[0]);
    } catch (error) {
      console.error("❌ Error en updateUserRole:", error);
      throw error;
    }
  }

  // ======================== GESTIÓN DE SOLICITUDES DE DESPACHOS ========================

  /**
   * Crear solicitud de asignación de despacho
   */
  async createSolicitudDespacho(solicitud: {
    userId: string;
    despachoId: string;
    justificacion: string;
    tipoSolicitud: "propiedad" | "colaboracion" | "otro";
    documentosAdjuntos?: string[];
  }) {
    const { data, error } = await supabase
      .from("solicitudes_despacho")
      .insert({
        user_id: solicitud.userId,
        despacho_id: solicitud.despachoId,
        fecha_solicitud: new Date().toISOString(),
        estado: "pendiente",
        justificacion: solicitud.justificacion,
        tipo_solicitud: solicitud.tipoSolicitud,
        documentos_adjuntos: solicitud.documentosAdjuntos,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtener solicitudes de despacho pendientes (solo super_admin)
   */
  async getSolicitudesDespachosPendientes() {
    const { data, error } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("estado", "pendiente")
      .order("fecha", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener solicitudes de un usuario específico
   */
  async getSolicitudesUsuario(userId: string) {
    const { data, error } = await supabase
      .from("solicitudes_despacho")
      .select(
        `
        *,
        despachos(nombre)
      `
      )
      .eq("user_id", userId)
      .order("fecha_solicitud", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Aprobar solicitud de despacho: asigna el despacho al usuario y actualiza la solicitud
   */
  async approveSolicitudDespacho(
    solicitudId: string,
    approvedBy: string,
    notas?: string
  ): Promise<void> {
    // Obtener la solicitud
    const { data: solicitud, error: solicitudError } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("id", solicitudId)
      .single();
    if (solicitudError) throw solicitudError;

    // Sincronizar despacho desde WordPress a Supabase antes de aprobar
    const objectId = solicitud.despacho_id;
    try {
      const syncRes = await fetch("/api/sync-despacho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectId }),
      });
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(
          syncData.error || "Error sincronizando despacho desde WordPress"
        );
      }
    } catch (err) {
      console.error("Error sincronizando despacho:", err);
      throw err;
    }

    // Asignar despacho al usuario
    await this.assignDespachoToUser(
      solicitud.user_id,
      solicitud.despacho_id,
      approvedBy
    );
    // Actualizar solicitud
    const { error: updateError } = await supabase
      .from("solicitudes_despacho")
      .update({
        estado: "aprobado",
        fecha_respuesta: new Date().toISOString(),
        respondido_por: approvedBy,
        notas_respuesta: notas,
      })
      .eq("id", solicitudId);
    if (updateError) throw updateError;
  }

  /**
   * Rechazar solicitud de despacho: actualiza el estado y guarda la nota
   */
  async rejectSolicitudDespacho(
    solicitudId: string,
    rejectedBy: string,
    notas: string
  ): Promise<void> {
    const { error } = await supabase
      .from("solicitudes_despacho")
      .update({
        estado: "rechazado",
        fecha_respuesta: new Date().toISOString(),
        respondido_por: rejectedBy,
        notas_respuesta: notas,
      })
      .eq("id", solicitudId);
    if (error) throw error;
  }
}
