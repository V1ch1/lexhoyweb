"use client";

import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { slugify } from "@/lib/slugify";
import { UserDespacho } from "@/lib/types";
import { StatCard, QuickActionCard } from "@/components/dashboard/shared";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  CogIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface DespachoStats {
  leadsToday: number;
  leadsThisMonth: number;
  totalLeads: number;
}

interface RecentLead {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  especialidad: string;
  fecha: Date;
  estado: "nuevo" | "contactado" | "cerrado";
}

// Usando la interfaz UserDespacho de los tipos globales

// Función para decodificar entidades HTML
function decodeHtmlEntities(text: string): string {
  if (typeof window === "undefined") return text;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [despachoStats, setDespachoStats] = useState<DespachoStats | null>(
    null
  );
  const [statsLoading, setStatsLoading] = useState(true);
  const [userDespachos, setUserDespachos] = useState<UserDespacho[]>([]);
  const [despachosLoading, setDespachosLoading] = useState(false);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);

  // Cargar despachos del usuario
  useEffect(() => {
    if (!user?.id) return;
    
    // Solo cargar despachos si el usuario NO es un usuario básico
    if (user.role === "usuario") {
      setUserDespachos([]);
      setDespachosLoading(false);
      return;
    }

    const loadDespachos = async () => {
      setDespachosLoading(true);
      try {
        const response = await fetch(`/api/users/${user.id}/despachos`);
        if (response.ok) {
          const data = await response.json();
          setUserDespachos(data.slice(0, 3)); // Solo los primeros 3
        }
      } catch (error) {
        console.error("Error al cargar despachos:", error);
      } finally {
        setDespachosLoading(false);
      }
    };

    loadDespachos();
  }, [user?.id]); // SOLO user.id como dependencia para evitar bucles

  // Cargar estadísticas según el rol del usuario
  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        if (user.role === "despacho_admin") {
          // 1. Obtener IDs de despachos del usuario
          const { data: userDespachosData } = await supabase
            .from('user_despachos')
            .select('despacho_id')
            .eq('user_id', user.id);
          
          const despachoIds = userDespachosData?.map(d => d.despacho_id) || [];

          if (despachoIds.length === 0) {
            setDespachoStats({ leadsToday: 0, leadsThisMonth: 0, totalLeads: 0 });
            setRecentLeads([]);
            setStatsLoading(false);
            return;
          }

          // 2. Consultar leads reales
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

          // Total Leads
          const { count: totalLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .in('despacho_id', despachoIds);

          // Leads Hoy
          const { count: leadsToday } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .in('despacho_id', despachoIds)
            .gte('created_at', startOfDay);

          // Leads Este Mes
          const { count: leadsThisMonth } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .in('despacho_id', despachoIds)
            .gte('created_at', startOfMonth);

          setDespachoStats({
            leadsToday: leadsToday || 0,
            leadsThisMonth: leadsThisMonth || 0,
            totalLeads: totalLeads || 0,
          });

          // 3. Cargar leads recientes
          const { data: leadsData } = await supabase
            .from('leads')
            .select('*')
            .in('despacho_id', despachoIds)
            .order('created_at', { ascending: false })
            .limit(5);

          if (leadsData) {
            const mappedLeads: RecentLead[] = leadsData.map(lead => ({
              id: lead.id,
              nombre: lead.cliente_nombre || 'Cliente Anónimo',
              email: lead.cliente_email || '',
              telefono: lead.cliente_telefono || '',
              especialidad: lead.especialidad || 'General',
              fecha: new Date(lead.created_at),
              estado: (lead.estado === 'nuevo' || lead.estado === 'contactado' || lead.estado === 'cerrado') 
                ? lead.estado 
                : 'nuevo', // Fallback status
            }));
            setRecentLeads(mappedLeads);
          }
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [user?.id, user?.role]); // Añadido user.role como dependencia

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirigir super_admin a su dashboard específico
  if (user.role === "super_admin") {
    router.push("/dashboard/admin");
    return null;
  }



  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ¡Bienvenido, {user?.name?.split(" ")[0] || user?.nombre || "Usuario"}!
          👋
        </h1>
        <p className="text-lg text-gray-600">
          {user?.role === "despacho_admin" &&
            "Gestiona tu despacho y leads desde aquí"}
          {user?.role === "usuario" &&
            "Tu cuenta está activa. Solicita un despacho para acceder a más funciones"}
        </p>
      </div>

      {/* Estadísticas principales - Solo para despacho_admin */}

      {user.role === "despacho_admin" && statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      )}

      {user.role === "despacho_admin" && !statsLoading && despachoStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Leads Hoy"
            value={despachoStats.leadsToday}
            icon={ClockIcon}
            color="blue"
            trend="Últimas 24h"
          />
          <StatCard
            title="Leads Este Mes"
            value={despachoStats.leadsThisMonth}
            icon={ChartBarIcon}
            color="green"
            trend="+12% vs mes anterior"
          />
          <StatCard
            title="Total Leads"
            value={despachoStats.totalLeads}
            icon={ClipboardDocumentListIcon}
            color="purple"
          />
          <StatCard
            title="Mis Despachos"
            value={despachosLoading ? "..." : userDespachos.length}
            icon={BuildingOfficeIcon}
            color="orange"
          />
        </div>
      )}

      {/* Acceso directo al despacho principal - Nuevo */}
      {user.role === "despacho_admin" &&
        userDespachos.length === 1 &&
        !despachosLoading && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border-2 border-green-200 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-10 w-10 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Acceso Rápido a tu Despacho
                </h3>
                <p className="text-gray-700 mb-4">
                  {decodeHtmlEntities(
                    userDespachos[0].nombre ||
                      userDespachos[0].despachos?.nombre ||
                      "Tu despacho"
                  )}
                </p>
                <button
                  onClick={() => {
                    const nombreDespacho = decodeHtmlEntities(
                      userDespachos[0].nombre ||
                        userDespachos[0].despachos?.nombre ||
                        "Sin nombre"
                    );
                    const despachoSlug = slugify(nombreDespacho);
                    router.push(`/dashboard/despachos/${despachoSlug}`);
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center"
                >
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  Ir a mi Despacho
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Call to action: Importar despacho */}
      {user.role === "despacho_admin" &&
        userDespachos.length === 0 &&
        !despachosLoading && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Gestiona tu despacho de Lexhoy.com!
                </h3>
                <p className="text-gray-700 mb-4">
                  Encuentra tu despacho en nuestro directorio de más de 12,000
                  despachos jurídicos y empieza a conseguir más clientes.
                </p>
                <button
                  onClick={() => router.push("/dashboard/despachos")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center"
                >
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  Buscar mi despacho
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Mostrar Mis Despachos para despacho_admin SOLO si tiene más de 1 despacho */}
      {user.role === "despacho_admin" && userDespachos.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Mis Despachos</h2>
            <button
              onClick={() => router.push("/dashboard/despachos/mis-despachos")}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Gestionar despachos
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {despachosLoading ? (
              // Loading skeleton - Muestra mientras carga
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-white rounded-lg shadow-sm p-5 border border-gray-100"
                >
                  <div className="animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-6 w-6 bg-gray-200 rounded"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : userDespachos.length > 0 &&
              userDespachos.some(
                (d) =>
                  d.nombre &&
                  d.nombre !== "Sin nombre" &&
                  d.nombre.trim() !== ""
              ) ? (
              userDespachos
                .filter((despacho) => {
                  const nombre =
                    despacho.nombre || despacho.despachos?.nombre || "";
                  return nombre && nombre !== "Sin nombre";
                })
                .slice(0, 3) // Solo mostrar los primeros 3
                .map((despacho) => {
                  // Obtener el nombre del despacho, probando ambas ubicaciones posibles
                  const nombreDespacho = decodeHtmlEntities(
                    despacho.nombre ||
                      despacho.despachos?.nombre ||
                      "Sin nombre"
                  );

                  // Generar el slug para la URL
                  const despachoSlug = slugify(nombreDespacho);

                  // Obtener localidad y provincia, probando ambas ubicaciones posibles
                  const localidad =
                    despacho.localidad || despacho.despachos?.localidad || "";
                  const provincia =
                    despacho.provincia || despacho.despachos?.provincia || "";

                  return (
                    <div
                      key={despacho.id}
                      className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/despachos/${despachoSlug}`)
                      }
                    >
                      <div className="flex items-start justify-between mb-2">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                          Activo
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {nombreDespacho}
                      </h3>
                      {(localidad || provincia) && (
                        <p className="text-sm text-gray-600">
                          {localidad}
                          {provincia ? `, ${provincia}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })
            ) : null}
          </div>
        </div>
      )}


      {/* Acciones rápidas */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.role === "despacho_admin" && (
            <>
              <QuickActionCard
                title="Ver Leads"
                description="Gestiona los leads de tu despacho"
                icon={ClipboardDocumentListIcon}
                href="/dashboard/leads"
                color="blue"
              />
              <QuickActionCard
                title="Mis Despachos"
                description="Importa o gestiona tus despachos de Lexhoy.com"
                icon={BuildingOfficeIcon}
                href="/dashboard/despachos/mis-despachos"
                color="green"
              />
              <QuickActionCard
                title="Notificaciones"
                description="Revisa tus notificaciones y alertas"
                icon={BellIcon}
                href="/dashboard/notificaciones"
                color="yellow"
              />
              <QuickActionCard
                title="Configuración"
                description="Ajusta tu perfil y preferencias"
                icon={CogIcon}
                href="/dashboard/settings"
                color="purple"
              />
            </>
          )}

          {user.role === "usuario" && (
            <>
              <QuickActionCard
                title="Buscar Despachos"
                description="Encuentra y solicita acceso a despachos"
                icon={BuildingOfficeIcon}
                href="/dashboard/despachos"
                color="orange"
              />
              <QuickActionCard
                title="Mis Solicitudes"
                description="Revisa el estado de tus solicitudes"
                icon={DocumentTextIcon}
                href="/dashboard/settings#solicitudes"
                color="blue"
              />
              <QuickActionCard
                title="Mi Perfil"
                description="Actualiza tu información personal"
                icon={CogIcon}
                href="/dashboard/settings"
                color="green"
              />
            </>
          )}
        </div>
      </div>

      {/* Actividad reciente / Leads recientes */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClockIcon className="h-6 w-6 mr-2 text-gray-600" />
            {user.role === "despacho_admin"
              ? "Leads Recientes"
              : "Actividad Reciente"}
          </h2>
          {user.role === "despacho_admin" && recentLeads.length > 0 && (
            <button
              onClick={() => router.push("/dashboard/leads")}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
            >
              Ver todos
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>

        {user.role === "despacho_admin" && recentLeads.length > 0 ? (
          <div className="space-y-4">
            {recentLeads.map((lead) => {
              const estadoConfig = {
                nuevo: {
                  bg: "bg-blue-100",
                  text: "text-blue-800",
                  label: "Nuevo",
                },
                contactado: {
                  bg: "bg-yellow-100",
                  text: "text-yellow-800",
                  label: "Contactado",
                },
                cerrado: {
                  bg: "bg-green-100",
                  text: "text-green-800",
                  label: "Cerrado",
                },
              };

              const config = estadoConfig[lead.estado];
              const horasAtras = Math.floor(
                (new Date().getTime() - lead.fecha.getTime()) / (1000 * 60 * 60)
              );
              const tiempoTexto =
                horasAtras < 1
                  ? "Hace menos de 1 hora"
                  : horasAtras === 1
                    ? "Hace 1 hora"
                    : horasAtras < 24
                      ? `Hace ${horasAtras} horas`
                      : `Hace ${Math.floor(horasAtras / 24)} días`;

              return (
                <div
                  key={lead.id}
                  className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                  onClick={() => router.push("/dashboard/leads")}
                >
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {lead.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {lead.nombre}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lead.especialidad}
                        </p>
                      </div>
                      <span
                        className={`${config.bg} ${config.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ml-2`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {lead.email}
                      </span>
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {lead.telefono}
                      </span>
                      <span className="flex items-center text-gray-400">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {tiempoTexto}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No hay actividad reciente</p>
            <p className="text-sm text-gray-400">
              {user.role === "despacho_admin" &&
                "Los nuevos leads aparecerán aquí"}
              {user.role === "usuario" && "Tus actividades aparecerán aquí"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
