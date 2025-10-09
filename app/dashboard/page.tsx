"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { slugify } from "@/lib/slugify";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  CogIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

// Interfaces
interface SystemStats {
  totalUsers: number;
  activeDespachos: number;
  totalLeads: number;
  usersByRole: {
    super_admin: number;
    despacho_admin: number;
    usuario: number;
  };
}

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
  estado: 'nuevo' | 'contactado' | 'cerrado';
}

interface UserDespacho {
  id: string;
  nombre: string;
  localidad?: string;
  provincia?: string;
}

// Función para decodificar entidades HTML
function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined') return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [despachoStats, setDespachoStats] = useState<DespachoStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [userDespachos, setUserDespachos] = useState<UserDespacho[]>([]);
  const [despachosLoading, setDespachosLoading] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);

  // Cargar despachos del usuario
  useEffect(() => {
    if (!user?.id || user.role === 'usuario') return;
    
    const loadDespachos = async () => {
      setDespachosLoading(true);
      try {
        const response = await fetch(`/api/users/${user.id}/despachos`);
        if (response.ok) {
          const data = await response.json();
          setUserDespachos(data.slice(0, 3)); // Solo los primeros 3
        }
      } catch (error) {
        console.error('Error al cargar despachos:', error);
      } finally {
        setDespachosLoading(false);
      }
    };

    loadDespachos();
  }, [user?.id, user?.role]);

  // Cargar solicitudes pendientes para super_admin
  useEffect(() => {
    if (user?.role !== "super_admin") return;
    
    fetch('/api/solicitudes-despacho-pendientes')
      .then(res => res.json())
      .then((response) => {
        const pendientes = response.solicitudes?.filter((s: { estado: string }) => s.estado === "pendiente").length || 0;
        setSolicitudesPendientes(pendientes);
      })
      .catch((err) => {
        console.error('Error cargando solicitudes:', err);
      });
  }, [user?.role]);

  // Cargar estadísticas según el rol del usuario
  useEffect(() => {
    if (!user?.id || !user?.role) return;
    
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        if (user.role === "super_admin") {
          const response = await fetch('/api/admin/stats');
          if (response.ok) {
            const stats = await response.json();
            setSystemStats(stats);
          }
        } else if (user.role === "despacho_admin") {
          // Generar estadísticas aleatorias para demo
          const totalLeads = Math.floor(Math.random() * 150) + 50; // 50-200
          const leadsThisMonth = Math.floor(Math.random() * 30) + 10; // 10-40
          const leadsToday = Math.floor(Math.random() * 5) + 1; // 1-6
          
          setDespachoStats({
            leadsToday,
            leadsThisMonth,
            totalLeads
          });
          
          // Generar leads recientes de ejemplo
          const especialidades = [
            'Derecho Civil',
            'Derecho Penal',
            'Derecho Laboral',
            'Derecho Mercantil',
            'Derecho Fiscal',
            'Derecho Familiar',
            'Derecho Administrativo'
          ];
          
          const nombres = [
            'María García López',
            'Juan Martínez Ruiz',
            'Carmen Rodríguez Sánchez',
            'Pedro Fernández Torres',
            'Ana López Martín',
            'Carlos Sánchez Pérez'
          ];
          
          const estados: Array<'nuevo' | 'contactado' | 'cerrado'> = ['nuevo', 'contactado', 'cerrado'];
          
          const mockLeads: RecentLead[] = Array.from({ length: 3 }, (_, i) => {
            const now = new Date();
            const horasAtras = Math.floor(Math.random() * 48) + 1;
            const fecha = new Date(now.getTime() - horasAtras * 60 * 60 * 1000);
            
            return {
              id: `lead-${i + 1}`,
              nombre: nombres[Math.floor(Math.random() * nombres.length)],
              email: `cliente${i + 1}@example.com`,
              telefono: `6${Math.floor(Math.random() * 100000000) + 10000000}`,
              especialidad: especialidades[Math.floor(Math.random() * especialidades.length)],
              fecha,
              estado: estados[Math.floor(Math.random() * estados.length)]
            };
          });
          
          setRecentLeads(mockLeads);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [user?.id, user?.role]);

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

  // Componente de tarjeta de acción rápida
  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onClick, 
    color = "blue",
    badge
  }: { 
    title: string; 
    description: string; 
    icon: React.ComponentType<{ className?: string }>; 
    onClick: () => void; 
    color?: string;
    badge?: number;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      green: "bg-green-50 text-green-600 hover:bg-green-100",
      purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
      yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
      red: "bg-red-50 text-red-600 hover:bg-red-100",
    };

    return (
      <button
        onClick={onClick}
        className={`${colorClasses[color as keyof typeof colorClasses]} relative w-full p-6 rounded-xl transition-all duration-200 hover:shadow-md text-left group`}
      >
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
        <Icon className="h-8 w-8 mb-3" />
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
        <ArrowRightIcon className="h-5 w-5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  // Componente de tarjeta de estadística
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "blue" 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      yellow: "bg-yellow-500",
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{statsLoading ? "..." : value}</p>
            {trend && (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className={`${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ¡Bienvenido, {user.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          {user.role === "super_admin" && "Panel de administración global de la plataforma"}
          {user.role === "despacho_admin" && "Gestiona tu despacho y leads desde aquí"}
          {user.role === "usuario" && "Tu cuenta está activa. Solicita un despacho para acceder a más funciones"}
        </p>
      </div>

      {/* Alerta de solicitudes pendientes para super_admin */}
      {user.role === "super_admin" && solicitudesPendientes > 0 && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">
                  {solicitudesPendientes} {solicitudesPendientes === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
                </h3>
                <p className="text-sm text-yellow-800">
                  Hay solicitudes de despacho esperando tu revisión
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/admin/users?tab=solicitudes")}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Revisar ahora
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      {user.role === "super_admin" && systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Usuarios"
            value={systemStats.totalUsers}
            icon={UserGroupIcon}
            color="blue"
          />
          <StatCard
            title="Despachos Activos"
            value={systemStats.activeDespachos}
            icon={BuildingOfficeIcon}
            color="green"
          />
          <StatCard
            title="Leads Totales"
            value={systemStats.totalLeads}
            icon={ClipboardDocumentListIcon}
            color="purple"
          />
          <StatCard
            title="Admins Despacho"
            value={systemStats.usersByRole.despacho_admin}
            icon={UserGroupIcon}
            color="orange"
          />
        </div>
      )}

      {user.role === "despacho_admin" && despachoStats && (
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
            icon={ArrowTrendingUpIcon}
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

      {/* Call to action: Importar despacho */}
      {user.role === "despacho_admin" && userDespachos.length === 0 && !despachosLoading && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-10 w-10 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Importa tu despacho desde Lexhoy.com!</h3>
              <p className="text-gray-700 mb-4">
                Encuentra tu despacho en nuestro directorio de más de 10,000 despachos jurídicos y empieza a gestionar tus leads.
              </p>
              <button
                onClick={() => router.push("/dashboard/despachos")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center"
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Buscar e importar mi despacho
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mis Despachos (para despacho_admin) */}
      {user.role === "despacho_admin" && userDespachos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Mis Despachos</h2>
            <button
              onClick={() => router.push("/dashboard/despachos")}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Gestionar despachos
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {despachosLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : userDespachos.length > 0 ? (
              userDespachos.map((despacho) => (
                <div
                  key={despacho.id}
                  className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/despachos/${slugify(despacho.nombre)}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      Activo
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {decodeHtmlEntities(despacho.nombre)}
                  </h3>
                  {(despacho.localidad || despacho.provincia) && (
                    <p className="text-sm text-gray-600">
                      {despacho.localidad}{despacho.provincia && `, ${despacho.provincia}`}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 bg-white rounded-lg border border-gray-100">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-1">No tienes despachos asignados</p>
                <p className="text-sm text-gray-400">Solicita un despacho para empezar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.role === "super_admin" && (
            <>
              <QuickActionCard
                title="Gestionar Usuarios"
                description="Administra usuarios, roles y permisos"
                icon={UserGroupIcon}
                onClick={() => router.push("/admin/users")}
                color="purple"
              />
              <QuickActionCard
                title="Ver Solicitudes"
                description="Revisa solicitudes de despachos pendientes"
                icon={DocumentTextIcon}
                onClick={() => router.push("/admin/users?tab=solicitudes")}
                color="yellow"
                badge={solicitudesPendientes}
              />
              <QuickActionCard
                title="Gestionar Despachos"
                description="Administra todos los despachos del sistema"
                icon={BuildingOfficeIcon}
                onClick={() => router.push("/dashboard/despachos")}
                color="green"
              />
              <QuickActionCard
                title="Ver Todos los Leads"
                description="Accede a todos los leads del sistema"
                icon={ClipboardDocumentListIcon}
                onClick={() => router.push("/dashboard/leads")}
                color="blue"
              />
              <QuickActionCard
                title="Estadísticas"
                description="Visualiza métricas y reportes del sistema"
                icon={ChartBarIcon}
                onClick={() => router.push("/admin/stats")}
                color="orange"
              />
              <QuickActionCard
                title="Configuración"
                description="Ajusta tu perfil y preferencias"
                icon={CogIcon}
                onClick={() => router.push("/dashboard/settings")}
                color="blue"
              />
            </>
          )}

          {user.role === "despacho_admin" && (
            <>
              <QuickActionCard
                title="Ver Leads"
                description="Gestiona los leads de tu despacho"
                icon={ClipboardDocumentListIcon}
                onClick={() => router.push("/dashboard/leads")}
                color="blue"
              />
              <QuickActionCard
                title="Mis Despachos"
                description="Importa o gestiona tus despachos de Lexhoy.com"
                icon={BuildingOfficeIcon}
                onClick={() => router.push("/dashboard/despachos")}
                color="green"
              />
              <QuickActionCard
                title="Notificaciones"
                description="Revisa tus notificaciones y alertas"
                icon={BellIcon}
                onClick={() => router.push("/dashboard/notificaciones")}
                color="yellow"
              />
              <QuickActionCard
                title="Configuración"
                description="Ajusta tu perfil y preferencias"
                icon={CogIcon}
                onClick={() => router.push("/dashboard/settings")}
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
                onClick={() => router.push("/dashboard/despachos")}
                color="orange"
              />
              <QuickActionCard
                title="Mis Solicitudes"
                description="Revisa el estado de tus solicitudes"
                icon={DocumentTextIcon}
                onClick={() => router.push("/dashboard/settings?tab=solicitudes")}
                color="blue"
              />
              <QuickActionCard
                title="Mi Perfil"
                description="Actualiza tu información personal"
                icon={CogIcon}
                onClick={() => router.push("/dashboard/settings")}
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
            {user.role === "despacho_admin" ? "Leads Recientes" : "Actividad Reciente"}
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
                nuevo: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Nuevo' },
                contactado: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Contactado' },
                cerrado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Cerrado' }
              };
              
              const config = estadoConfig[lead.estado];
              const horasAtras = Math.floor((new Date().getTime() - lead.fecha.getTime()) / (1000 * 60 * 60));
              const tiempoTexto = horasAtras < 1 
                ? 'Hace menos de 1 hora' 
                : horasAtras === 1 
                  ? 'Hace 1 hora' 
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
                      {lead.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{lead.nombre}</h3>
                        <p className="text-sm text-gray-600">{lead.especialidad}</p>
                      </div>
                      <span className={`${config.bg} ${config.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ml-2`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {lead.email}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
              {user.role === "super_admin" && "Las actividades del sistema aparecerán aquí"}
              {user.role === "despacho_admin" && "Los nuevos leads aparecerán aquí"}
              {user.role === "usuario" && "Tus actividades aparecerán aquí"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
