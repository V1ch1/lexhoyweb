import { supabase } from "./supabase";
import {
  User,
  UserDespacho,
  SyncLog,
  UserRole,
  UserStatus,
  PlanType,
  UserProfile,
  UpdateUserProfileData
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
   * Obtiene el perfil de un usuario por su ID
   */
  /**
   * Actualiza el perfil de un usuario
   */
  async updateUserProfile(userId: string, profileData: UpdateUserProfileData): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update({
        nombre: profileData.nombre,
        apellidos: profileData.apellidos,
        telefono: profileData.telefono,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Error al actualizar el perfil del usuario:', error);
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name || `${data.nombre} ${data.apellidos}`.trim(),
      role: data.rol,
      nombre: data.nombre,
      apellidos: data.apellidos,
      telefono: data.telefono || '',
      fecha_registro: data.fecha_registro || new Date().toISOString(),
      ultimo_acceso: data.ultimo_acceso || new Date().toISOString(),
      despacho_nombre: data.despacho_nombre
    };
  }

  /**
   * Obtiene el perfil de un usuario por su ID
   */
  async getUserProfile(userId: string): Promise<Record<string, unknown>> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener el perfil del usuario:', error);
      throw error;
    }

    // Si el usuario tiene un despacho, obtener la información del mismo
    if (data.despacho_id) {
      const { data: despachoData } = await supabase
        .from('despachos')
        .select('nombre')
        .eq('id', data.despacho_id)
        .single();

      if (despachoData) {
        return {
          ...data,
          despacho_nombre: despachoData.nombre
        };
      }
    }

    return data;
  }

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
   * Incluye: despachos en user_despachos Y despachos donde es owner_email
   */
  async getUserDespachos(userId: string): Promise<UserDespacho[]> {
    try {
      // 1. Obtener usuario para conseguir su email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // 2. Obtener despachos de user_despachos (asignaciones manuales)
      console.log("🔍 Buscando asignaciones para user_id:", userId);
      const { data: assignedDespachos, error: assignedError } = await supabase
        .from("user_despachos")
        .select("*")
        .eq("user_id", userId)
        .eq("activo", true);

      if (assignedError) {
        console.error("❌ Error obteniendo asignaciones:", assignedError);
        throw assignedError;
      }

      console.log("📋 Asignaciones encontradas:", assignedDespachos);
      console.log("📊 Total asignaciones:", assignedDespachos?.length || 0);

      // 2b. Para cada asignación, obtener los datos del despacho
      const assignedDespachosWithData = await Promise.all(
        (assignedDespachos || []).map(async (ud) => {
          const { data: despacho } = await supabase
            .from("despachos")
            .select("*")
            .eq("id", ud.despacho_id)
            .single();
          
          return {
            ...ud,
            despachos: despacho || { nombre: "Despacho no encontrado", object_id: "", slug: "" }
          };
        })
      );

      console.log("📋 Asignaciones con datos:", assignedDespachosWithData);

      // 3. Obtener despachos donde el usuario es propietario (owner_email)
      const { data: ownedDespachos, error: ownedError } = await supabase
        .from("despachos")
        .select("*")
        .eq("owner_email", userData.email);

      if (ownedError) throw ownedError;

      // 4. Convertir despachos propios al formato UserDespacho
      const ownedDespachosFormatted: UserDespacho[] = (ownedDespachos || []).map((d) => ({
        id: `owned-${d.id}`, // ID único para evitar conflictos
        userId,
        despachoId: d.id.toString(),
        fechaAsignacion: new Date(),
        activo: true,
        permisos: { leer: true, escribir: true, eliminar: true }, // Propietario tiene todos los permisos
        asignadoPor: "owner", // Indicador de que es propietario
        despachos: d, // Todos los datos del despacho
      }));

      // 5. Combinar ambas listas (evitando duplicados)
      const allDespachos = [...(assignedDespachosWithData || []), ...ownedDespachosFormatted];
      
      // Eliminar duplicados basados en despachoId
      const uniqueDespachos = allDespachos.filter(
        (despacho, index, self) =>
          index === self.findIndex((d) => d.despachoId === despacho.despachoId)
      );

      return uniqueDespachos;
    } catch (error) {
      console.error("Error en getUserDespachos:", error);
      return [];
    }
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
    // Verificar si ya existe una asignación
    const { data: existing, error: checkError } = await supabase
      .from("user_despachos")
      .select("id, activo")
      .eq("user_id", userId)
      .eq("despacho_id", despachoId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned (está bien)
      throw checkError;
    }

    // Si ya existe, actualizar en lugar de insertar
    if (existing) {
      console.log("⚠️ Asignación ya existe, actualizando...");
      const { data, error } = await supabase
        .from("user_despachos")
        .update({
          activo: true,
          permisos: permisos || { leer: true, escribir: true, eliminar: false },
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Si no existe, insertar nuevo
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
   * Maneja AMBOS casos: asignación manual (user_despachos) Y propiedad (owner_email)
   */
  async unassignDespachoFromUser(
    userId: string,
    despachoId: string
  ): Promise<void> {
    try {
      console.log("🗑️ Eliminando propiedad/asignación:", { userId, despachoId });

      // 1. Obtener email del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // 2. Desactivar asignación manual en user_despachos (si existe)
      const { error: unassignError } = await supabase
        .from("user_despachos")
        .update({ activo: false })
        .eq("user_id", userId)
        .eq("despacho_id", despachoId);

      if (unassignError) {
        console.warn("⚠️ No se encontró asignación manual:", unassignError);
      } else {
        console.log("✅ Asignación manual desactivada");
      }

      // 3. Eliminar owner_email del despacho (si el usuario es propietario)
      const { error: ownerError } = await supabase
        .from("despachos")
        .update({ owner_email: null })
        .eq("id", despachoId)
        .eq("owner_email", userData.email);

      if (ownerError) {
        console.warn("⚠️ No se pudo eliminar owner_email:", ownerError);
      } else {
        console.log("✅ Propiedad (owner_email) eliminada");
      }

      console.log("✅ Propiedad/asignación eliminada correctamente");
    } catch (error) {
      console.error("❌ Error en unassignDespachoFromUser:", error);
      throw error;
    }
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
    console.log("🔄 Aprobando solicitud:", solicitudId);
    
    // Obtener la solicitud
    const { data: solicitud, error: solicitudError } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("id", solicitudId)
      .single();
    
    if (solicitudError) {
      console.error("❌ Error obteniendo solicitud:", solicitudError);
      throw solicitudError;
    }
    
    console.log("📋 Solicitud obtenida:", solicitud);

    // NOTA: El despacho ya debería estar importado cuando se solicita la propiedad
    // Por lo tanto, no necesitamos sincronizar de nuevo desde WordPress
    const objectId = solicitud.despacho_id;
    console.log("📋 Despacho solicitado - object_id:", objectId);

    // Obtener el ID numérico del despacho en Supabase usando el object_id
    console.log("🔍 Buscando despacho en Supabase con object_id:", objectId);
    const { data: despacho, error: despachoError } = await supabase
      .from("despachos")
      .select("id")
      .eq("object_id", objectId)
      .single();

    if (despachoError || !despacho) {
      console.error("❌ Error: Despacho no encontrado en Supabase:", despachoError);
      throw new Error(
        `Despacho con object_id ${objectId} no encontrado en Supabase. Detalles: ${despachoError?.message || "No data"}`
      );
    }

    console.log("✅ Despacho encontrado en Supabase, ID:", despacho.id);

    // Cambiar rol del usuario a despacho_admin
    console.log("👤 Cambiando rol del usuario a despacho_admin");
    const { error: roleError } = await supabase
      .from("users")
      .update({ rol: "despacho_admin" })
      .eq("id", solicitud.user_id);
    
    if (roleError) {
      console.error("⚠️ Error cambiando rol:", roleError);
    } else {
      console.log("✅ Rol actualizado a despacho_admin");
    }

    // Asignar despacho al usuario usando el ID numérico de Supabase
    console.log("🔗 Asignando despacho al usuario:", solicitud.user_id);
    await this.assignDespachoToUser(
      solicitud.user_id,
      despacho.id.toString(), // Convertir a string para consistencia
      approvedBy
    );
    
    console.log("✅ Despacho asignado correctamente");

    // Actualizar owner_email en la tabla despachos
    console.log("📧 Actualizando owner_email del despacho");
    const { error: ownerError } = await supabase
      .from("despachos")
      .update({ owner_email: solicitud.user_email })
      .eq("id", despacho.id);
    
    if (ownerError) {
      console.error("⚠️ Error actualizando owner_email:", ownerError);
    } else {
      console.log("✅ owner_email actualizado correctamente");
    }

    // Actualizar solicitud
    console.log("📝 Actualizando estado de solicitud a 'aprobado'");
    const { error: updateError } = await supabase
      .from("solicitudes_despacho")
      .update({
        estado: "aprobado",
        fecha_respuesta: new Date().toISOString(),
        respondido_por: approvedBy,
        notas_respuesta: notas,
      })
      .eq("id", solicitudId);
      
    if (updateError) {
      console.error("❌ Error actualizando solicitud:", updateError);
      throw updateError;
    }
    
    console.log("✅ Solicitud aprobada exitosamente");

    // Crear notificación para el usuario
    try {
      const { NotificationService } = await import("./notificationService");
      await NotificationService.create({
        userId: solicitud.user_id,
        tipo: "solicitud_aprobada",
        titulo: "✅ Solicitud aprobada",
        mensaje: `Tu solicitud para el despacho "${solicitud.despacho_nombre}" ha sido aprobada`,
        url: "/dashboard/settings?tab=mis-despachos",
        metadata: {
          solicitudId,
          despachoId: despacho.id,
          despachoNombre: solicitud.despacho_nombre,
        },
      });
      console.log("✅ Notificación creada para el usuario");
    } catch (error) {
      console.error("⚠️ Error creando notificación:", error);
    }

    // Enviar email al usuario
    try {
      const { EmailService } = await import("./emailService");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      
      await EmailService.send({
        to: solicitud.user_email,
        subject: "🎉 ¡Tu solicitud de despacho ha sido aprobada! - LexHoy",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">¡Felicitaciones! 🎉</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333;">Hola <strong>${solicitud.user_name}</strong>,</p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Tu solicitud para gestionar el despacho <strong style="color: #667eea;">${solicitud.despacho_nombre}</strong> ha sido <strong style="color: #10b981;">aprobada</strong>.
              </p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-weight: 600;">✅ Tu rol ha sido actualizado a Administrador de Despacho</p>
              </div>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Ahora puedes:
              </p>
              
              <ul style="color: #555; line-height: 1.8;">
                <li>✏️ Modificar la información del despacho</li>
                <li>📊 Gestionar leads y clientes</li>
                <li>👥 Administrar usuarios del despacho</li>
                <li>⚙️ Configurar preferencias y ajustes</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard/settings?tab=mis-despachos" 
                   style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Ir a Mi Despacho
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} LexHoy. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });
      console.log("✅ Email de aprobación enviado al usuario");
    } catch (error) {
      console.error("⚠️ Error enviando email:", error);
    }
  }

  /**
   * Rechazar solicitud de despacho: actualiza el estado y guarda la nota
   */
  async rejectSolicitudDespacho(
    solicitudId: string,
    rejectedBy: string,
    notas: string
  ): Promise<void> {
    console.log("❌ Rechazando solicitud:", solicitudId);

    // Obtener la solicitud primero
    const { data: solicitud, error: solicitudError } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("id", solicitudId)
      .single();

    if (solicitudError) {
      console.error("❌ Error obteniendo solicitud:", solicitudError);
      throw solicitudError;
    }

    // Actualizar solicitud
    const { error } = await supabase
      .from("solicitudes_despacho")
      .update({
        estado: "rechazado",
        fecha_respuesta: new Date().toISOString(),
        respondido_por: rejectedBy,
        notas_respuesta: notas,
      })
      .eq("id", solicitudId);

    if (error) {
      console.error("❌ Error actualizando solicitud:", error);
      throw error;
    }

    console.log("✅ Solicitud rechazada");

    // Crear notificación para el usuario
    try {
      const { NotificationService } = await import("./notificationService");
      await NotificationService.create({
        userId: solicitud.user_id,
        tipo: "solicitud_rechazada",
        titulo: "Solicitud no aprobada",
        mensaje: `Tu solicitud para el despacho "${solicitud.despacho_nombre}" no ha sido aprobada`,
        url: "/dashboard/settings?tab=mis-despachos",
        metadata: {
          solicitudId,
          despachoNombre: solicitud.despacho_nombre,
          motivoRechazo: notas,
        },
      });
      console.log("✅ Notificación creada para el usuario");
    } catch (error) {
      console.error("⚠️ Error creando notificación:", error);
    }

    // Enviar email al usuario
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: solicitud.user_email,
          subject: "Actualización sobre tu solicitud - LexHoy",
          template: "solicitud-rechazada",
          data: {
            userName: solicitud.user_name,
            despachoName: solicitud.despacho_nombre,
            motivoRechazo: notas,
          },
        }),
      });
      console.log("✅ Email enviado al usuario");
    } catch (error) {
      console.error("⚠️ Error enviando email:", error);
    }
  }
}
