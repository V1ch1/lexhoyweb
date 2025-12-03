import { supabase } from "./supabase";
import { createClient } from "@supabase/supabase-js";

// Cliente con service_role para bypass RLS
const getServiceRoleClient = () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SERVICE_ROLE_KEY) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY no configurada, usando cliente normal");
    return supabase;
  }
  
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export type NotificationType =
  | "solicitud_recibida"
  | "solicitud_aprobada"
  | "solicitud_rechazada"
  | "solicitud_despacho"
  | "despacho_asignado"
  | "despacho_desasignado"
  | "usuario_nuevo"
  | "mensaje_sistema"
  | "nuevo_lead"
  | "nuevo_lead_admin"
  | "lead_comprado"
  | "lead_vendido";

export interface Notification {
  id: string;
  user_id: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  userId: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Crear una notificación para un usuario
   */
  static async create(data: CreateNotificationData): Promise<{ notification: Notification | null; error: Error | null }> {
    try {
      // Usar service_role client para bypass RLS
      const client = getServiceRoleClient();
      
      const { data: notification, error } = await client
        .from("notificaciones")
        .insert({
          user_id: data.userId,
          tipo: data.tipo,
          titulo: data.titulo,
          mensaje: data.mensaje,
          url: data.url,
          metadata: data.metadata || {},
          leida: false,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Error creando notificación:", error);
        throw error;
      }

      return { notification, error: null };
    } catch (error) {
      console.error("💥 Error en NotificationService.create:", error);
      return { 
        notification: null, 
        error: error instanceof Error ? error : new Error('Error desconocido al crear notificación') 
      };
    }
  }

  /**
   * Crear notificaciones para múltiples usuarios
   */
  static async createMany(
    userIds: string[],
    data: Omit<CreateNotificationData, "userId">
  ): Promise<void> {
    try {
      // Usar service_role client para bypass RLS
      const client = getServiceRoleClient();

      const notifications = userIds.map((userId) => ({
        user_id: userId,
        tipo: data.tipo,
        titulo: data.titulo,
        mensaje: data.mensaje,
        url: data.url,
        metadata: data.metadata || {},
        leida: false,
      }));

      const { error } = await client
        .from("notificaciones")
        .insert(notifications);

      if (error) {
        console.error("❌ Error creando notificaciones:", error);
        throw error;
      }

      } catch (error) {
      console.error("💥 Error en NotificationService.createMany:", error);
    }
  }

  /**
   * Notificar a todos los super admins
   */
  static async notifyAllSuperAdmins(
    data: Omit<CreateNotificationData, "userId">
  ): Promise<void> {
    try {
      // Obtener todos los super admins
      const { data: superAdmins, error } = await supabase
        .from("users")
        .select("id")
        .eq("rol", "super_admin");

      if (error) {
        console.error("❌ Error obteniendo super admins:", error);
        throw error;
      }

      if (!superAdmins || superAdmins.length === 0) {
        console.warn("⚠️ No hay super admins para notificar");
        return;
      }

      const userIds = superAdmins.map((admin) => admin.id);
      await this.createMany(userIds, data);
    } catch (error) {
      console.error("💥 Error en NotificationService.notifyAllSuperAdmins:", error);
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      onlyUnread?: boolean;
    }
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from("notificaciones")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (options?.onlyUnread) {
        query = query.eq("leida", false);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error obteniendo notificaciones:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("💥 Error en NotificationService.getUserNotifications:", error);
      return [];
    }
  }

  /**
   * Contar notificaciones no leídas
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notificaciones")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("leida", false);

      if (error) {
        console.error("❌ Error contando notificaciones:", error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error("💥 Error en NotificationService.getUnreadCount:", error);
      return 0;
    }
  }

  /**
   * Marcar notificación como leída
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notificationId);

      if (error) {
        console.error("❌ Error marcando como leída:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("💥 Error en NotificationService.markAsRead:", error);
      return false;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("user_id", userId)
        .eq("leida", false);

      if (error) {
        console.error("❌ Error marcando todas como leídas:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("💥 Error en NotificationService.markAllAsRead:", error);
      return false;
    }
  }

  /**
   * Eliminar notificación
   */
  static async delete(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notificaciones")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("❌ Error eliminando notificación:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("💥 Error en NotificationService.delete:", error);
      return false;
    }
  }

  /**
   * Eliminar todas las notificaciones leídas
   */
  static async deleteAllRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notificaciones")
        .delete()
        .eq("user_id", userId)
        .eq("leida", true);

      if (error) {
        console.error("❌ Error eliminando notificaciones leídas:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("💥 Error en NotificationService.deleteAllRead:", error);
      return false;
    }
  }
}
