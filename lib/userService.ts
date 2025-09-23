import { supabase } from './supabase';
import { User, UserDespacho, SolicitudRegistro, SyncLog, UserRole, UserStatus, PlanType } from './types';

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
  
  // ======================== GESTIÓN DE USUARIOS ========================
  
  /**
   * Obtener todos los usuarios (solo super_admin)
   */
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Mapear nombres de columnas de DB a propiedades de TypeScript
    return (data || []).map((user: UserRaw) => ({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      telefono: user.telefono,
      fechaRegistro: new Date(user.fecha_registro),
      ultimoAcceso: user.ultimo_acceso ? new Date(user.ultimo_acceso) : undefined,
      activo: user.activo,
      emailVerificado: user.email_verificado,
      plan: user.plan as PlanType,
      rol: user.rol,
      estado: user.estado,
      fechaAprobacion: user.fecha_aprobacion ? new Date(user.fecha_aprobacion) : undefined,
      aprobadoPor: user.aprobado_por,
      notasAdmin: user.notas_admin,
      despachoId: user.despacho_id
    }));
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    return data;
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
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
      .from('users')
      .insert({
        ...userData,
        fecha_registro: new Date().toISOString(),
        activo: true,
        email_verificado: false,
        plan: 'basico'
      })
      .select()
      .single();

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
            created_by_admin: true
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/confirm`
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta de usuario');
      }

      // 3. Crear registro en nuestra tabla users con el ID de Supabase Auth
      const { data: localUser, error: localError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Usar el ID de Supabase Auth
          email: userData.email,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          telefono: userData.telefono,
          rol: userData.rol,
          estado: 'activo', // Activo porque fue creado por admin
          fecha_registro: new Date().toISOString(),
          activo: true,
          email_verificado: authData.user.email_confirmed_at ? true : false,
          plan: 'basico'
        })
        .select()
        .single();

      if (localError) {
        console.error('Error creating local user record:', localError);
        throw new Error(`Error creando perfil de usuario: ${localError.message}`);
      }

      return { user: localUser, temporaryPassword };

    } catch (error) {
      console.error('Error in createUserWithAuth:', error);
      throw error;
    }
  }

  /**
   * Generar contraseña temporal segura
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Aprobar usuario (cambiar estado a activo)
   */
  async approveUser(userId: string, approvedBy: string): Promise<User> {
    return this.updateUser(userId, {
      estado: 'activo',
      fechaAprobacion: new Date(),
      aprobadoPor: approvedBy
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
    const assignment = await this.assignDespachoToUser(userId, despachoId, assignedBy);
    
    // 2. Cambiar rol a despacho_admin
    const updatedUser = await this.updateUser(userId, {
      rol: 'despacho_admin'
    });

    return { user: updatedUser, assignment };
  }

  /**
   * Remover usuario de despacho y regresar a rol usuario (si no tiene más despachos)
   */
  async removeUserFromDespachoAndDemote(userId: string, despachoId: string): Promise<User> {
    // 1. Desactivar asignación de despacho
    await supabase
      .from('user_despachos')
      .update({ activo: false })
      .eq('user_id', userId)
      .eq('despacho_id', despachoId);

    // 2. Verificar si el usuario tiene otros despachos activos
    const { data: activeDespachos } = await supabase
      .from('user_despachos')
      .select('id')
      .eq('user_id', userId)
      .eq('activo', true);

    // 3. Si no tiene más despachos, cambiar rol a usuario
    if (!activeDespachos || activeDespachos.length === 0) {
      return this.updateUser(userId, {
        rol: 'usuario'
      });
    }

    // Si aún tiene despachos, mantener rol despacho_admin
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  }

  // ======================== ASIGNACIÓN DE DESPACHOS ========================

  /**
   * Obtener despachos asignados a un usuario
   */
  async getUserDespachos(userId: string): Promise<UserDespacho[]> {
    const { data, error } = await supabase
      .from('user_despachos')
      .select(`
        *,
        despachos:despacho_id (nombre, object_id, slug)
      `)
      .eq('user_id', userId)
      .eq('activo', true);

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
      .from('user_despachos')
      .insert({
        user_id: userId,
        despacho_id: despachoId,
        asignado_por: assignedBy,
        permisos: permisos || { leer: true, escribir: true, eliminar: false },
        activo: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Quitar asignación de despacho
   */
  async unassignDespachoFromUser(userId: string, despachoId: string): Promise<void> {
    const { error } = await supabase
      .from('user_despachos')
      .update({ activo: false })
      .eq('user_id', userId)
      .eq('despacho_id', despachoId);

    if (error) throw error;
  }

  /**
   * Obtener usuarios asignados a un despacho
   */
  async getDespachoUsers(despachoId: string): Promise<Array<UserDespacho & { user: User }>> {
    const { data, error } = await supabase
      .from('user_despachos')
      .select(`
        *,
        users:user_id (*)
      `)
      .eq('despacho_id', despachoId)
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  }

  // ======================== SOLICITUDES DE REGISTRO ========================

  /**
   * Obtener todas las solicitudes (solo super_admin)
   */
  async getAllSolicitudes(): Promise<SolicitudRegistro[]> {
    const { data, error } = await supabase
      .from('solicitudes_registro')
      .select('*')
      .order('fecha_solicitud', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Crear solicitud de registro (público)
   */
  async createSolicitud(solicitudData: {
    email: string;
    nombre: string;
    apellidos: string;
    telefono?: string;
    empresa?: string;
    mensaje?: string;
    datosDespacho: Record<string, unknown>;
  }): Promise<SolicitudRegistro> {
    const { data, error } = await supabase
      .from('solicitudes_registro')
      .insert({
        ...solicitudData,
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString()
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
      .from('solicitudes_registro')
      .select('*')
      .eq('id', solicitudId)
      .single();

    if (solicitudError) throw solicitudError;

    // Crear despacho
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .insert({
        object_id: `lexhoy-${Date.now()}`,
        nombre: solicitud.datos_despacho.nombre,
        descripcion: solicitud.datos_despacho.descripcion,
        slug: solicitud.datos_despacho.nombre.toLowerCase().replace(/\s+/g, '-'),
        areas_practica: solicitud.datos_despacho.especialidades || [],
        estado_registro: 'aprobado',
        fecha_aprobacion: new Date().toISOString(),
        aprobado_por: approvedBy
      })
      .select()
      .single();

    if (despachoError) throw despachoError;

    // Crear usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: solicitud.email,
        nombre: solicitud.nombre,
        apellidos: solicitud.apellidos,
        telefono: solicitud.telefono,
        rol: 'despacho_admin',
        estado: 'activo',
        fecha_aprobacion: new Date().toISOString(),
        aprobado_por: approvedBy,
        plan: 'basico'
      })
      .select()
      .single();

    if (userError) throw userError;

    // Asignar despacho al usuario
    await this.assignDespachoToUser(user.id, despacho.id, approvedBy);

    // Actualizar solicitud
    await supabase
      .from('solicitudes_registro')
      .update({
        estado: 'aprobado',
        fecha_respuesta: new Date().toISOString(),
        respondido_por: approvedBy,
        notas_respuesta: notas,
        user_creado_id: user.id,
        despacho_creado_id: despacho.id
      })
      .eq('id', solicitudId);

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
      .from('solicitudes_registro')
      .update({
        estado: 'rechazado',
        fecha_respuesta: new Date().toISOString(),
        respondido_por: rejectedBy,
        notas_respuesta: notas
      })
      .eq('id', solicitudId);

    if (error) throw error;
  }

  // ======================== LOGS DE SINCRONIZACIÓN ========================

  /**
   * Registrar log de sincronización
   */
  async logSync(logData: {
    tipo: 'algolia' | 'wordpress';
    accion: 'create' | 'update' | 'delete';
    entidad: 'despacho' | 'sede' | 'user';
    entidadId: string;
    datosEnviados?: Record<string, unknown>;
    respuestaApi?: Record<string, unknown>;
    exitoso: boolean;
    errorMensaje?: string;
  }): Promise<SyncLog> {
    const { data, error } = await supabase
      .from('sync_logs')
      .insert({
        ...logData,
        fecha_sync: new Date().toISOString(),
        reintentos: 0
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
      .from('sync_logs')
      .select('*')
      .order('fecha_sync', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ======================== UTILIDADES ========================

  /**
   * Verificar si el usuario actual es super admin
   */
  async isCurrentUserSuperAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (error) return false;
    return data?.rol === 'super_admin';
  }

  /**
   * Obtener usuario actual con sus despachos
   */
  async getCurrentUserWithDespachos(): Promise<{ user: User; despachos: UserDespacho[] } | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const user = await this.getUserById(authUser.id);
    if (!user) return null;

    const despachos = await this.getUserDespachos(user.id);

    return { user, despachos };
  }
}