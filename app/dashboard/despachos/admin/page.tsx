"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { SyncService } from "@/lib/syncService";
import { useRouter } from "next/navigation";
import ModalAsignarPropietario from "@/components/ModalAsignarPropietario";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuickActionCard } from "@/components/dashboard/shared";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface WordPressDespacho {
  id?: number;
  title?: { rendered: string };
  name?: string;
  slug: string;
  status?: string;
  date?: string;
  modified?: string;
}

interface Despacho {
  id: string;
  nombre: string;
  slug: string;
  object_id?: string;
  activo: boolean;
  verificado: boolean;
  num_sedes: number;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  sincronizado_wp: boolean;
  last_sync_at?: string;
  wp_sync_status?: "synced" | "pending" | "error" | null;
  supabase_sync_status?: "synced" | "pending" | "error" | null;
  algolia_indexed?: boolean;
  last_activity_at?: string;
  owner_info?: {
    nombre?: string;
    apellidos?: string;
    email: string;
  };
  // Nuevos campos para multifuente
  exists_in_wp?: boolean;
  exists_in_supabase?: boolean;
  wp_data?: WordPressDespacho | null;
}

export default function AdminDespachosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showRemoveOwnerConfirm, setShowRemoveOwnerConfirm] = useState(false);
  const [despachoToRemoveOwner, setDespachoToRemoveOwner] =
    useState<Despacho | null>(null);
  const [isRemovingOwner, setIsRemovingOwner] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    | "all"
    | "active"
    | "inactive"
    | "verified"
    | "unverified"
    | "with-owner"
    | "no-owner"
    | "synced"
    | "wp-only"
    | "supabase-only"
  >("all");
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(
    null
  );
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  // Verificar permisos de super admin
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        router.push("/dashboard");
        return;
      }

      try {
        // Primero intentar obtener el rol de los metadatos del usuario (desde authContext)
        let role = user.role;

        // Si no está en el contexto, buscar en la tabla users
        if (!role) {
          const { data: userData } = await supabase
            .from("users")
            .select("rol") // La columna se llama 'rol' (sin 'e')
            .eq("id", user.id)
            .single();

          role = userData?.rol;
        }

        if (!role || role !== "super_admin") {
          setUserRole("not_admin");
          return;
        }

        setUserRole(role);
      } catch (error) {
        console.error("Error verificando permisos:", error);
        setUserRole("not_admin");
      }
    };

    checkPermissions();
  }, [user, router]);

  // Cargar solicitudes pendientes
  useEffect(() => {
    const loadSolicitudes = async () => {
      if (userRole !== "super_admin") return;

      try {
        const response = await fetch("/api/admin/solicitudes?estado=pendiente");
        if (response.ok) {
          const data = await response.json();
          setSolicitudesPendientes(data.total || 0);
        }
      } catch (error) {
        console.error("Error cargando solicitudes:", error);
      }
    };

    loadSolicitudes();
  }, [userRole]);

  // Función para obtener despachos de WordPress
  const fetchWordPressDespachos = async () => {
    try {
      console.log("🔍 Buscando despachos en WordPress...");
      const response = await fetch(
        "/api/despachos/wordpress/buscar?query=*&page=1&perPage=1000"
      );
      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        console.log("❌ Response no OK, devolviendo array vacío");
        return [];
      }

      const data = await response.json();
      console.log("📊 Datos recibidos de WordPress:", data);
      console.log(
        "🏢 Cantidad de despachos de WordPress:",
        data.data?.length || 0
      );

      return data.data || [];
    } catch (error) {
      console.error("❌ Error obteniendo despachos de WordPress:", error);
      return [];
    }
  };

  // Cargar despachos desde todas las fuentes
  useEffect(() => {
    const loadDespachos = async () => {
      if (userRole !== "super_admin") return;

      try {
        setLoading(true);

        // Obtener despachos de Supabase y WordPress en paralelo
        console.log("🚀 Iniciando carga de despachos desde ambas fuentes...");

        const [
          { data: despachosSupabase, error: despachosError },
          despachosWordPress,
        ] = await Promise.all([
          supabase
            .from("despachos")
            .select("*")
            .order("created_at", { ascending: false }),
          fetchWordPressDespachos(),
        ]);

        if (despachosError) throw despachosError;

        console.log("📊 Despachos Supabase:", despachosSupabase?.length || 0);
        console.log("📝 Despachos WordPress:", despachosWordPress?.length || 0);

        // Crear mapa de despachos de WordPress por slug/object_id
        const wpMap = new Map();
        (despachosWordPress || []).forEach((wp: WordPressDespacho) => {
          wpMap.set(wp.slug, wp);
          if (wp.id) wpMap.set(wp.id.toString(), wp);
        });

        // Obtener conteo de sedes para despachos de Supabase
        const { data: sedesData } = await supabase
          .from("sedes")
          .select("despacho_id")
          .in(
            "despacho_id",
            (despachosSupabase || []).map((d) => d.id)
          );

        const sedesCounts = (sedesData || []).reduce(
          (acc, sede) => {
            acc[sede.despacho_id] = (acc[sede.despacho_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Obtener propietarios para despachos de Supabase (query simple)
        const { data: userDespachosData, error: userError } = await supabase
          .from("user_despachos")
          .select("despacho_id, user_id")
          .in(
            "despacho_id",
            (despachosSupabase || []).map((d) => d.id)
          )
          .eq("activo", true);

        if (userError) {
          console.warn("⚠️ Error obteniendo propietarios:", userError);
        }

        // Obtener información de usuarios por separado
        const userIds = (userDespachosData || [])
          .map((ud) => ud.user_id)
          .filter(Boolean);
        const { data: usersData } =
          userIds.length > 0
            ? await supabase
                .from("users")
                .select("id, nombre, apellidos, email")
                .in("id", userIds)
            : { data: [] };

        // Crear mapa de usuarios
        const usersMap = (usersData || []).reduce(
          (acc, user) => {
            acc[user.id] = user;
            return acc;
          },
          {} as Record<
            string,
            { id: string; nombre?: string; apellidos?: string; email: string }
          >
        );

        // Crear mapa de propietarios por despacho
        const ownersMap = (userDespachosData || []).reduce(
          (acc, ud) => {
            const user = usersMap[ud.user_id];
            if (user) {
              acc[ud.despacho_id] = user;
            }
            return acc;
          },
          {} as Record<
            string,
            { id: string; nombre?: string; apellidos?: string; email: string }
          >
        );

        // Combinar despachos de Supabase con información de WordPress
        const supabaseProcessed = (despachosSupabase || []).map((despacho) => {
          const wpData =
            wpMap.get(despacho.slug) ||
            wpMap.get(despacho.object_id?.toString());

          return {
            ...despacho,
            num_sedes: sedesCounts[despacho.id] || 0,
            owner_info: ownersMap[despacho.id] || null,
            // Estados de sincronización mejorados
            wp_sync_status: wpData ? "synced" : ("error" as const),
            supabase_sync_status: "synced" as const,
            algolia_indexed: despacho.verificado,
            last_activity_at: despacho.updated_at,
            last_sync_at: wpData?.modified || despacho.updated_at,
            // Información adicional de fuentes
            exists_in_wp: !!wpData,
            exists_in_supabase: true,
            wp_data: wpData || null,
          };
        });

        // Agregar despachos que solo están en WordPress
        const wpOnlyDespachos = (despachosWordPress || [])
          .filter(
            (wp: WordPressDespacho) =>
              !supabaseProcessed.find(
                (s) =>
                  s.slug === wp.slug ||
                  s.object_id?.toString() === wp.id?.toString()
              )
          )
          .map((wp: WordPressDespacho) => ({
            id: `wp-${wp.id}`,
            nombre: wp.title?.rendered || wp.name || "Sin título",
            slug: wp.slug,
            object_id: wp.id?.toString(),
            activo: wp.status === "publish",
            verificado: false,
            num_sedes: 0,
            created_at: wp.date || new Date().toISOString(),
            updated_at: wp.modified || wp.date || new Date().toISOString(),
            owner_email: null,
            sincronizado_wp: true,
            // Estados específicos para WordPress-only
            wp_sync_status: "synced" as const,
            supabase_sync_status: "pending" as const,
            algolia_indexed: false,
            last_activity_at: wp.modified || wp.date,
            last_sync_at: wp.modified || wp.date,
            owner_info: null,
            // Marcadores de fuente
            exists_in_wp: true,
            exists_in_supabase: false,
            wp_data: wp,
          }));

        // Combinar todos los despachos
        const allDespachos = [...supabaseProcessed, ...wpOnlyDespachos];

        console.log("✅ Procesamiento completado:");
        console.log("  - Supabase procesados:", supabaseProcessed.length);
        console.log("  - WordPress únicos:", wpOnlyDespachos.length);
        console.log("  - Total combinado:", allDespachos.length);
        console.log("🎯 Despachos finales:", allDespachos);

        setDespachos(allDespachos);
      } catch (error) {
        console.error("Error cargando despachos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDespachos();
  }, [userRole]);

  // Funciones para el modal de asignación
  const handleAsignarPropietario = (despacho: Despacho) => {
    setSelectedDespacho(despacho);
    setShowModalAsignar(true);
  };

  const handleAsignarSuccess = () => {
    setShowModalAsignar(false);
    setSelectedDespacho(null);
    // Recargar despachos para mostrar el nuevo propietario
    const loadDespachos = async () => {
      if (userRole !== "super_admin") return;
      try {
        setLoading(true);
        const { data: despachosData, error: despachosError } = await supabase
          .from("despachos")
          .select("*")
          .order("created_at", { ascending: false });

        if (despachosError) throw despachosError;

        // Obtener conteo de sedes
        const { data: sedesData } = await supabase
          .from("sedes")
          .select("despacho_id")
          .in(
            "despacho_id",
            (despachosData || []).map((d) => d.id)
          );

        const sedesCounts = (sedesData || []).reduce(
          (acc, sede) => {
            acc[sede.despacho_id] = (acc[sede.despacho_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Obtener propietarios (query simple)
        const { data: userDespachosData } = await supabase
          .from("user_despachos")
          .select("despacho_id, user_id")
          .in(
            "despacho_id",
            (despachosData || []).map((d) => d.id)
          )
          .eq("activo", true);

        // Obtener información de usuarios
        const userIds = (userDespachosData || [])
          .map((ud) => ud.user_id)
          .filter(Boolean);
        const { data: usersData } =
          userIds.length > 0
            ? await supabase
                .from("users")
                .select("id, nombre, apellidos, email")
                .in("id", userIds)
            : { data: [] };

        const usersMap = (usersData || []).reduce(
          (acc, user) => {
            acc[user.id] = user;
            return acc;
          },
          {} as Record<
            string,
            { id: string; nombre?: string; apellidos?: string; email: string }
          >
        );

        const ownersMap = (userDespachosData || []).reduce(
          (acc, ud) => {
            const user = usersMap[ud.user_id];
            if (user) {
              acc[ud.despacho_id] = user;
            }
            return acc;
          },
          {} as Record<
            string,
            { id: string; nombre?: string; apellidos?: string; email: string }
          >
        );

        const processedDespachos = (despachosData || []).map((despacho) => ({
          ...despacho,
          num_sedes: sedesCounts[despacho.id] || 0,
          owner_info: ownersMap[despacho.id] || null,
          wp_sync_status: despacho.sincronizado_wp
            ? "synced"
            : ("pending" as const),
          supabase_sync_status: "synced" as const,
          algolia_indexed: despacho.verificado,
          last_activity_at: despacho.updated_at,
          last_sync_at: despacho.updated_at,
        }));

        setDespachos(processedDespachos);
      } catch (error) {
        console.error("Error recargando despachos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDespachos();
  };

  // Quitar propietario
  const handleRemoveOwnerClick = (despacho: Despacho) => {
    setDespachoToRemoveOwner(despacho);
    setShowRemoveOwnerConfirm(true);
  };

  const confirmRemoveOwner = async () => {
    if (!despachoToRemoveOwner) return;

    setIsRemovingOwner(true);

    try {
      const res = await fetch(`/api/despachos/${despachoToRemoveOwner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_email: null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Error al quitar propietario");
      }

      // Actualizar UI localmente
      setDespachos((prev) =>
        prev.map((d) =>
          d.id === despachoToRemoveOwner.id
            ? { ...d, owner_info: null, owner_email: null }
            : d
        )
      );

      toast.success("Propietario eliminado correctamente");
    } catch (error) {
      console.error("Error quitando propietario:", error);
      toast.error(
        `Error quitando propietario: ${error instanceof Error ? error.message : "Error"}`
      );
    } finally {
      setIsRemovingOwner(false);
      setShowRemoveOwnerConfirm(false);
      setDespachoToRemoveOwner(null);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hace 1 día";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.ceil(diffDays / 30)} meses`;

    return date.toLocaleDateString("es-ES");
  };

  // Filtrar despachos
  const filteredDespachos = despachos.filter((despacho) => {
    const matchesSearch =
      despacho.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despacho.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despacho.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = (() => {
      switch (filter) {
        case "active":
          return despacho.activo;
        case "inactive":
          return !despacho.activo;
        case "verified":
          return despacho.verificado;
        case "unverified":
          return !despacho.verificado;
        case "with-owner":
          return !!(despacho.owner_info || despacho.owner_email);
        case "no-owner":
          return !(despacho.owner_info || despacho.owner_email);
        case "synced":
          return despacho.exists_in_supabase && despacho.exists_in_wp;
        case "wp-only":
          return despacho.exists_in_wp && !despacho.exists_in_supabase;
        case "supabase-only":
          return despacho.exists_in_supabase && !despacho.exists_in_wp;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // Eliminar despacho
  const handleDelete = async (despacho: Despacho) => {
    const confirmMessage = `⚠️ ATENCIÓN: Esta acción es IRREVERSIBLE

¿Estás seguro de que quieres eliminar el despacho "${despacho.nombre}"?

Esto eliminará:
✗ El despacho de NextJS
✗ El despacho de WordPress (si existe)
✗ El despacho de Algolia (si existe)
✗ Todas las sedes asociadas
✗ Todas las relaciones de usuario
✗ Todas las notificaciones relacionadas

Escribe "ELIMINAR" para confirmar:`;

    const confirmation = prompt(confirmMessage);

    if (confirmation !== "ELIMINAR") {
      toast.error("Eliminación cancelada");
      return;
    }

    try {
      setDeleting(despacho.id);

      const result = await SyncService.eliminarDespachoCompleto(despacho.id);

      if (result.success) {
        toast.success(`Despacho "${despacho.nombre}" eliminado correctamente`);

        // Actualizar lista
        setDespachos((prev) => prev.filter((d) => d.id !== despacho.id));
      } else {
        toast.error(`Error al eliminar despacho: ${result.error}`);
      }
    } catch (error) {
      console.error("Error eliminando despacho:", error);
      toast.error(
        `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setDeleting(null);
    }
  };

  if (userRole === "not_admin") {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg
              className="h-8 w-8 text-red-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-red-800">
              🛡️ Acceso Denegado
            </h2>
          </div>
          <p className="text-red-700 mb-4">
            Solo los super administradores pueden acceder a esta página de
            administración.
          </p>
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Tu rol actual:</strong> {user?.role || "No definido"}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Rol requerido:</strong> super_admin
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push("/dashboard/despachos")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Volver a Despachos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole !== "super_admin") {
    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-2 text-gray-600">
            Verificando permisos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🛡️ Administración de Despachos
        </h1>
        <p className="text-gray-600">
          Panel de administración para super admins - Gestión completa de
          despachos
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Solicitudes de Despacho"
            description="Revisar y gestionar solicitudes de propiedad"
            icon={DocumentTextIcon}
            href="/dashboard/admin/solicitudes"
            color="purple"
            badge={solicitudesPendientes}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Buscar despachos
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, slug o email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtros */}
          <div>
            <label
              htmlFor="filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filtrar por estado
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los despachos</option>
              <option value="active">🟢 Solo activos</option>
              <option value="inactive">🔴 Solo inactivos</option>
              <option value="verified">✅ Solo verificados</option>
              <option value="unverified">⏳ Solo pendientes</option>
              <option value="with-owner">👤 Con propietario</option>
              <option value="no-owner">🚫 Sin propietario</option>
              <option value="synced">🔄 Sincronizados (ambas fuentes)</option>
              <option value="wp-only">📝 Solo en WordPress</option>
              <option value="supabase-only">📊 Solo en Supabase</option>
            </select>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {despachos.length}
            </div>
            <div className="text-sm text-blue-800">Total</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {despachos.filter((d) => d.activo).length}
            </div>
            <div className="text-sm text-green-800">Activos</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {despachos.filter((d) => d.verificado).length}
            </div>
            <div className="text-sm text-yellow-800">Verificados</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {despachos.filter((d) => d.sincronizado_wp).length}
            </div>
            <div className="text-sm text-purple-800">Sync WP</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {despachos.filter((d) => d.owner_info || d.owner_email).length}
            </div>
            <div className="text-sm text-indigo-800">Con Propietario</div>
          </div>
          <div className="bg-teal-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-teal-600">
              {
                despachos.filter((d) => d.exists_in_supabase && d.exists_in_wp)
                  .length
              }
            </div>
            <div className="text-sm text-teal-800">Sincronizados</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {
                despachos.filter((d) => !d.exists_in_supabase && d.exists_in_wp)
                  .length
              }
            </div>
            <div className="text-sm text-orange-800">Solo WordPress</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {filteredDespachos.length}
            </div>
            <div className="text-sm text-gray-800">Filtrados</div>
          </div>
        </div>
      </div>

      {/* Lista de despachos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Despachos ({filteredDespachos.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando despachos...</p>
          </div>
        ) : filteredDespachos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron despachos con los filtros aplicados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre del Despacho
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propietario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sistema
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Búsqueda
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDespachos.map((despacho) => (
                    <tr key={despacho.id} className="hover:bg-gray-50">
                      {/* Columna Nombre del Despacho */}
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {despacho.nombre}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ID:{" "}
                            {despacho.id.startsWith("wp-")
                              ? `WP-${despacho.id.replace("wp-", "")}`
                              : `${despacho.id.substring(0, 8)}...`}
                          </div>
                        </div>
                      </td>

                      {/* Columna Ubicación */}
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">
                          <div className="text-xs text-gray-400">
                            {despacho.num_sedes
                              ? `${despacho.num_sedes} ${despacho.num_sedes === 1 ? "sede" : "sedes"}`
                              : "Sin sedes registradas"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Creado:{" "}
                            {new Date(despacho.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* Columna Propietario */}
                      <td className="px-4 py-4">
                        {despacho.owner_info ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {despacho.owner_info.nombre}{" "}
                              {despacho.owner_info.apellidos}
                            </div>
                            <div className="text-gray-700 text-xs">
                              {despacho.owner_info.email}
                            </div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                              👤 Asignado
                            </span>
                          </div>
                        ) : despacho.owner_email ? (
                          <div className="text-sm">
                            <div className="text-gray-700 text-xs">
                              {despacho.owner_email}
                            </div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mt-1">
                              📧 Email solo
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              🚫 Sin propietario
                            </span>
                            <button
                              onClick={() => handleAsignarPropietario(despacho)}
                              className="block mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Asignar →
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Columna Sistema */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {/* Estado de sincronización */}
                          <div className="text-sm">
                            {despacho.exists_in_supabase &&
                            despacho.exists_in_wp ? (
                              <span className="text-green-700 font-medium">
                                ✅ Sincronizado
                              </span>
                            ) : despacho.exists_in_supabase &&
                              !despacho.exists_in_wp ? (
                              <span className="text-orange-700 font-medium">
                                ⚠️ Solo en Supabase
                              </span>
                            ) : (
                              <span className="text-purple-700 font-medium">
                                � Solo en WordPress
                              </span>
                            )}
                          </div>

                          {/* Última actualización */}
                          {despacho.last_sync_at && (
                            <div className="text-xs text-gray-700">
                              Actualizado:{" "}
                              {new Date(
                                despacho.last_sync_at
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Columna Búsqueda */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            despacho.algolia_indexed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {despacho.algolia_indexed ? "✓ Visible" : "✗ Oculto"}
                        </span>
                      </td>

                      {/* Columna Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {despacho.exists_in_supabase ? (
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/despachos/${despacho.slug}`
                                )
                              }
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              📋 Ver detalles
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/despachos/importar-lexhoy?slug=${despacho.slug}`
                                )
                              }
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              📥 Importar a Supabase
                            </button>
                          )}

                          {/* Botón asignar propietario - solo para despachos en Supabase */}
                          {despacho.exists_in_supabase && (
                            <>
                              {!despacho.owner_info && !despacho.owner_email ? (
                                <button
                                  onClick={() =>
                                    handleAsignarPropietario(despacho)
                                  }
                                  className="text-green-600 hover:text-green-900 text-sm font-medium"
                                >
                                  👤 Asignar propietario
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleAsignarPropietario(despacho)
                                  }
                                  className="text-orange-600 hover:text-orange-900 text-sm font-medium"
                                >
                                  🔄 Cambiar propietario
                                </button>
                              )}
                            </>
                          )}

                          {despacho.exists_in_supabase &&
                            (despacho.owner_info || despacho.owner_email) && (
                              <button
                                onClick={() => handleRemoveOwnerClick(despacho)}
                                className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                              >
                                🚫 Quitar propietario
                              </button>
                            )}

                          {despacho.exists_in_supabase && (
                            <button
                              onClick={() => handleDelete(despacho)}
                              disabled={deleting === despacho.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {deleting === despacho.id ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin -ml-1 mr-1 h-3 w-3 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Eliminando...
                                </span>
                              ) : (
                                "🗑️ Eliminar"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal para asignar propietario */}
      {showModalAsignar && selectedDespacho && (
        <ModalAsignarPropietario
          despachoId={selectedDespacho.id}
          show={showModalAsignar}
          onClose={() => {
            setShowModalAsignar(false);
            setSelectedDespacho(null);
          }}
          onAsignar={handleAsignarSuccess}
        />
      )}

      {/* Confirm dialog para quitar propietario */}
      <ConfirmDialog
        isOpen={showRemoveOwnerConfirm}
        onClose={() => setShowRemoveOwnerConfirm(false)}
        onConfirm={confirmRemoveOwner}
        title="Quitar propietario"
        message={`¿Estás seguro de que quieres quitar el propietario de "${despachoToRemoveOwner?.nombre}"? Esta acción eliminará la relación y dejará el despacho sin propietario.`}
        confirmText={isRemovingOwner ? "Eliminando" : "Quitar propietario"}
        cancelText="Cancelar"
        isProcessing={isRemovingOwner}
      />
    </div>
  );
}
