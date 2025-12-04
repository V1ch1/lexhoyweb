"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { NotificationService, Notification } from "@/lib/notificationService";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function NotificacionesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const loadNotifications = async () => {
    console.log("🔍 [Notificaciones] Cargando notificaciones...", { user: user?.id, filter });
    if (!user) {
      console.warn("⚠️ [Notificaciones] No hay usuario autenticado");
      return;
    }
    
    try {
      setLoading(true);
      console.log("📡 [Notificaciones] Llamando a NotificationService.getUserNotifications");
      const data = await NotificationService.getUserNotifications(user.id, {
        limit: 50,
        onlyUnread: filter === "unread",
      });
      
      console.log("✅ [Notificaciones] Datos recibidos:", { count: data.length, data });
      
      let filtered = data;
      if (filter === "read") {
        filtered = data.filter((n) => n.leida);
      }
      
      console.log("📊 [Notificaciones] Notificaciones filtradas:", { count: filtered.length });
      setNotifications(filtered);
    } catch (error) {
      console.error("❌ [Notificaciones] Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const handleMarkAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await NotificationService.markAllAsRead(user.id);
    loadNotifications();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta notificación?")) return;
    await NotificationService.delete(id);
    loadNotifications();
  };

  const handleDeleteAllRead = async () => {
    if (!user) return;
    if (!confirm("¿Eliminar todas las notificaciones leídas?")) return;
    await NotificationService.deleteAllRead(user.id);
    loadNotifications();
  };

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

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  };

  const unreadCount = notifications.filter((n) => !n.leida).length;

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BellIcon className="h-8 w-8 text-blue-600" />
            Notificaciones
          </h1>
          <p className="text-gray-600 mt-2">
            Mantente al día con todas tus actualizaciones
          </p>
        </div>

        {/* Filtros y acciones */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todas ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                No leídas ({unreadCount})
              </button>
              <button
                onClick={() => setFilter("read")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === "read"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Leídas ({notifications.length - unreadCount})
              </button>
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  Marcar todas como leídas
                </button>
              )}
              {notifications.filter((n) => n.leida).length > 0 && (
                <button
                  onClick={handleDeleteAllRead}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Eliminar leídas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-500">
                {filter === "unread"
                  ? "No tienes notificaciones sin leer"
                  : filter === "read"
                  ? "No tienes notificaciones leídas"
                  : "Aún no tienes notificaciones"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notif) => {
                const handleNotificationClick = async () => {
                  console.log("🖱️ [Notificaciones] Click en notificación:", { 
                    id: notif.id, 
                    titulo: notif.titulo,
                    url: notif.url,
                    leida: notif.leida 
                  });
                  
                  // Marcar como leída si no lo está
                  if (!notif.leida) {
                    console.log("📝 [Notificaciones] Marcando como leída...");
                    await handleMarkAsRead(notif.id);
                  }
                  
                  // Navegar a la URL si existe
                  if (notif.url) {
                    console.log("🔗 [Notificaciones] Navegando a:", notif.url);
                    router.push(notif.url);
                  } else {
                    console.warn("⚠️ [Notificaciones] No hay URL para navegar");
                  }
                };

                return (
                  <div
                    key={notif.id}
                    className={`p-6 transition-colors ${
                      !notif.leida ? "bg-blue-50" : ""
                    } ${notif.url ? "hover:bg-gray-50 cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl flex-shrink-0">
                        {getIcon(notif.tipo)}
                      </span>
                      <div 
                        className="flex-1 min-w-0"
                        onClick={notif.url ? handleNotificationClick : undefined}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3
                              className={`text-base font-medium text-gray-900 ${
                                !notif.leida ? "font-semibold" : ""
                              }`}
                            >
                              {notif.titulo}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notif.mensaje}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-xs text-gray-400">
                                {getTimeAgo(notif.created_at)}
                              </p>
                              {notif.url && (
                                <span className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  Ver detalles →
                                </span>
                              )}
                            </div>
                          </div>
                          {!notif.leida && (
                            <span className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!notif.leida && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Marcar como leída"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
