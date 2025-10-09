"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { NotificationService, Notification } from "@/lib/notificationService";

interface NotificationBellProps {
  userId: string;
  userRole: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getUserNotifications(userId, {
        limit: 5,
        onlyUnread: false,
      });
      setNotifications(data);

      const count = await NotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cada 30 segundos
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30 segundos
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Marcar como leída
  const handleMarkAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
    loadNotifications();
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead(userId);
    loadNotifications();
  };

  // Obtener icono según tipo
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "solicitud_recibida":
        return "📨";
      case "solicitud_aprobada":
        return "✅";
      case "solicitud_rechazada":
        return "❌";
      case "despacho_asignado":
        return "🏢";
      case "despacho_desasignado":
        return "🔓";
      case "usuario_nuevo":
        return "👤";
      case "mensaje_sistema":
        return "ℹ️";
      default:
        return "🔔";
    }
  };

  // Formatear tiempo relativo
  const getTimeAgo = (dateString: string) => {
    // Asegurarse de que la fecha del servidor se interprete correctamente
    // Añadimos 'Z' para indicar que está en UTC
    const date = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    
    // Crear fechas en la zona horaria local
    const now = new Date();
    const notifDate = new Date(date);
    
    // Calcular diferencia en milisegundos
    const diffMs = now.getTime() - notifDate.getTime();
    
    // Calcular diferencias
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Determinar el formato más adecuado
    if (diffSecs < 5) return 'Ahora mismo';
    if (diffSecs < 60) return `Hace ${diffSecs} segundos`;
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    // Para fechas más antiguas, mostrar la fecha completa
    return notifDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative focus:outline-none"
        onClick={() => setOpen(!open)}
        aria-label="Notificaciones"
      >
        <BellIcon className="h-7 w-7 text-gray-300 hover:text-white transition" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold min-w-[20px] text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg z-50 border border-gray-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.url || "#"}
                    onClick={() => {
                      if (!notif.leida) {
                        handleMarkAsRead(notif.id);
                      }
                      setOpen(false);
                    }}
                    className={`block p-4 hover:bg-gray-50 transition-colors ${
                      !notif.leida ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getIcon(notif.tipo)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium text-gray-900 ${
                            !notif.leida ? "font-semibold" : ""
                          }`}
                        >
                          {notif.titulo}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notif.mensaje}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(notif.created_at)}
                        </p>
                      </div>
                      {!notif.leida && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <Link
                href="/dashboard/notificaciones"
                onClick={() => setOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las notificaciones →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
