"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { MagnifyingGlassIcon, BuildingOfficeIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MapPinIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

// Función segura para obtener el JWT
function getJWT() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("supabase_jwt") || "";
  }
  return "";
}

// Utilidad para decodificar entidades HTML
function decodeHtml(html: string) {
  if (!html) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

interface Despacho {
  id: number;
  title: { rendered: string };
  meta?: {
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email_contacto?: string;
    object_id?: string;
    slug?: string;
    _despacho_sedes?: Array<{
      localidad?: string;
      provincia?: string;
    }>;
  };
}

interface Solicitud {
  id: string;
  estado: string;
  despacho_nombre?: string;
  despacho_localidad?: string;
  despacho_provincia?: string;
  fecha_solicitud?: string;
  despachos?: { nombre?: string };
}

type TabType = 'buscar' | 'enviadas' | 'aceptadas' | 'rechazadas';

export default function SolicitarDespacho() {
  // Estados del componente
  const [activeTab, setActiveTab] = useState<TabType>('buscar');
  const [nombre, setNombre] = useState("");
  const [filtroLocalidad, setFiltroLocalidad] = useState("");
  const [filtroProvincia, setFiltroProvincia] = useState("");
  const [results, setResults] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitados, setSolicitados] = useState<number[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingSolicitud, setLoadingSolicitud] = useState<number | null>(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Solicitud[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  
  // Cargar solicitudes pendientes al cargar el componente
  useEffect(() => {
    cargarSolicitudesPendientes();
  }, [user]);

  // Cargar solicitudes pendientes
  const cargarSolicitudesPendientes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log("La funcionalidad de carga de solicitudes está temporalmente deshabilitada");
      setSolicitudesPendientes([]);
    } catch (err) {
      console.error("Error en cargarSolicitudesPendientes:", err);
      setError("Error al cargar solicitudes");
    }
  }, [user]);

  // Handler para buscar despachos
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setSuccess(null);
    setCurrentPage(1);
    setFiltroLocalidad("");
    setFiltroProvincia("");
    
    try {
      const res = await fetch(
        `/api/search-despachos?query=${encodeURIComponent(nombre)}`
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al buscar despachos");
      }
      
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Error en búsqueda de despachos:", err);
      setError(err instanceof Error ? err.message : "Error al buscar despachos");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener localidad y provincia de un despacho
  const getDespachoLocation = (despacho: Despacho) => {
    let localidad = decodeHtml(despacho.meta?.localidad || "");
    let provincia = decodeHtml(despacho.meta?.provincia || "");
    
    // Si no hay localidad/provincia, buscar en sedes
    if ((!localidad || !provincia) && Array.isArray(despacho.meta?._despacho_sedes) && despacho.meta._despacho_sedes.length > 0) {
      const sede = despacho.meta._despacho_sedes[0];
      localidad = localidad || decodeHtml(sede.localidad || "");
      provincia = provincia || decodeHtml(sede.provincia || "");
    }
    
    return { localidad, provincia };
  };

  // Filtrar resultados
  const filteredResults = results.filter(despacho => {
    const { localidad, provincia } = getDespachoLocation(despacho);
    
    const matchLocalidad = !filtroLocalidad || localidad.toLowerCase().includes(filtroLocalidad.toLowerCase());
    const matchProvincia = !filtroProvincia || provincia.toLowerCase().includes(filtroProvincia.toLowerCase());
    
    return matchLocalidad && matchProvincia;
  });

  // Paginación
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Obtener localidades y provincias únicas para los filtros
  const uniqueLocalidades = Array.from(new Set(results.map(d => getDespachoLocation(d).localidad).filter(Boolean)));
  const uniqueProvincias = Array.from(new Set(results.map(d => getDespachoLocation(d).provincia).filter(Boolean)));

  // Handler para solicitar despacho
  const handleSolicitar = async (despachoId: number) => {
    setError(null);
    setSuccess(null);
    setLoadingSolicitud(despachoId);
    try {
      if (!user?.id) throw new Error("Usuario no autenticado");
      const userId = user.id;
      const userEmail = user.email || "";
      const userName = user.name || "";
      
      const despacho = results.find((d) => d.id === despachoId);
      if (!despacho) throw new Error("Despacho no encontrado");
      
      const despachoNombre = decodeHtml(despacho?.title?.rendered || "");
      let despachoLocalidad = "";
      let despachoProvincia = "";
      
      if (despacho?.meta) {
        despachoLocalidad = decodeHtml(despacho.meta.localidad || "");
        despachoProvincia = decodeHtml(despacho.meta.provincia || "");
        if (
          (!despachoLocalidad || !despachoProvincia) &&
          Array.isArray(despacho.meta._despacho_sedes) &&
          despacho.meta._despacho_sedes.length > 0
        ) {
          const sede = despacho.meta._despacho_sedes[0];
          despachoLocalidad = decodeHtml(sede.localidad || despachoLocalidad);
          despachoProvincia = decodeHtml(sede.provincia || despachoProvincia);
        }
      }

      const objectId =
        despacho.meta?.object_id && despacho.meta.object_id !== ""
          ? despacho.meta.object_id
          : `lexhoy-${despacho.id}`;
      const slug =
        despacho.meta?.slug || despachoNombre.toLowerCase().replace(/ /g, "-");

      const token = getJWT();
      if (!token) throw new Error("No se pudo obtener el token de sesión");

      const res = await fetch("/api/solicitar-despacho", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          despachoId: objectId,
          userEmail,
          userName,
          despachoNombre,
          despachoLocalidad,
          despachoProvincia,
          slug,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al solicitar vinculación");
      }
      
      setSolicitados((prev) => [...prev, despachoId]);
      setSuccess("Solicitud enviada correctamente");
      await cargarSolicitudesPendientes();
      
      setTimeout(() => {
        setSuccess(null);
        setResults([]);
        setNombre("");
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al solicitar vinculación";
      setError(errorMessage);
      console.error("Error al solicitar despacho:", err);
    } finally {
      setLoadingSolicitud(null);
    }
  };

  // Handler para cancelar solicitud
  const handleCancelarSolicitud = async (solicitudId: string) => {
    setError(null);
    setSuccess(null);
    try {
      if (!user?.id) throw new Error("Usuario no autenticado");
      
      const token = getJWT();
      if (!token) throw new Error("No se pudo obtener el token de sesión");

      const res = await fetch(`/api/cancelar-solicitud-despacho`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ solicitudId, userId: user.id }),
      });
      
      if (!res.ok) throw new Error("Error al cancelar la solicitud");
      
      setSuccess("Solicitud cancelada correctamente");
      await cargarSolicitudesPendientes();
      
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error("Error al cancelar solicitud:", err);
      setError("Error al cancelar la solicitud");
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'buscar' as TabType, label: 'Buscador', icon: MagnifyingGlassIcon },
    { id: 'enviadas' as TabType, label: 'Enviadas', icon: ClockIcon },
    { id: 'aceptadas' as TabType, label: 'Aceptadas', icon: CheckCircleIcon },
    { id: 'rechazadas' as TabType, label: 'Rechazadas', icon: XCircleIcon },
  ];

  // Filtrar solicitudes por estado
  const solicitudesEnviadas = solicitudesPendientes.filter(s => s.estado === 'pendiente');
  const solicitudesAceptadas = solicitudesPendientes.filter(s => s.estado === 'aceptada');
  const solicitudesRechazadas = solicitudesPendientes.filter(s => s.estado === 'rechazada' || s.estado === 'cancelada');

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
          Gestión de Despachos
        </h1>
        <p className="text-gray-600">Busca y solicita vinculación con despachos de abogados</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-all whitespace-nowrap
                    ${isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* BUSCADOR TAB */}
          {activeTab === 'buscar' && (
            <div className="space-y-6">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del despacho
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Buscar por nombre del despacho..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Buscando...
                        </>
                      ) : (
                        <>
                          <MagnifyingGlassIcon className="h-5 w-5" />
                          Buscar
                        </>
                      )}
                    </button>
                    {nombre && (
                      <button
                        type="button"
                        onClick={() => {
                          setNombre('');
                          setResults([]);
                          setFiltroLocalidad('');
                          setFiltroProvincia('');
                        }}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Filtros de resultados */}
              {results.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Filtrar resultados:</span>
                    <select
                      value={filtroLocalidad}
                      onChange={(e) => {
                        setFiltroLocalidad(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas las localidades</option>
                      {uniqueLocalidades.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <select
                      value={filtroProvincia}
                      onChange={(e) => {
                        setFiltroProvincia(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas las provincias</option>
                      {uniqueProvincias.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-600 ml-auto">
                      {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Results Table */}
              {results.length > 0 && (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Despacho
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedResults.map((despacho) => {
                        const solicitado = solicitados.includes(despacho.id);
                        const { localidad: localidadDesp, provincia: provinciaDesp } = getDespachoLocation(despacho);
                        const telefono = decodeHtml(despacho.meta?.telefono || "");
                        const email = decodeHtml(despacho.meta?.email_contacto || "");
                        
                        return (
                          <tr key={despacho.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {decodeHtml(despacho.title.rendered)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-gray-900">
                                <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                                {localidadDesp && provinciaDesp ? `${localidadDesp}, ${provinciaDesp}` : localidadDesp || provinciaDesp || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {telefono && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                                    {telefono}
                                  </div>
                                )}
                                {email && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                                    {email}
                                  </div>
                                )}
                                {!telefono && !email && <span className="text-sm text-gray-400">-</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              {solicitado ? (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Solicitado
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSolicitar(despacho.id)}
                                  disabled={loadingSolicitud === despacho.id}
                                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    loadingSolicitud === despacho.id
                                      ? 'bg-gray-400 cursor-not-allowed text-white'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {loadingSolicitud === despacho.id ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Solicitando...
                                    </>
                                  ) : (
                                    'Solicitar'
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Siguiente
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(endIndex, filteredResults.length)}</span> de{' '}
                            <span className="font-medium">{filteredResults.length}</span> resultados
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Anterior</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Siguiente</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loading && results.length === 0 && nombre && (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron despachos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Intenta con otros términos de búsqueda
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ENVIADAS TAB */}
          {activeTab === 'enviadas' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
                Solicitudes Enviadas
              </h3>
              {solicitudesEnviadas.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes solicitudes enviadas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Las solicitudes que envíes aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despacho</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {solicitudesEnviadas.map((solicitud) => (
                        <tr key={solicitud.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {decodeHtml(solicitud.despacho_nombre || solicitud.id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {decodeHtml(solicitud.despacho_localidad || "-")}, {decodeHtml(solicitud.despacho_provincia || "-")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Pendiente
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            <button
                              onClick={() => handleCancelarSolicitud(solicitud.id)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Cancelar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ACEPTADAS TAB */}
          {activeTab === 'aceptadas' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                Solicitudes Aceptadas
              </h3>
              {solicitudesAceptadas.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes solicitudes aceptadas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Las solicitudes aceptadas aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despacho</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {solicitudesAceptadas.map((solicitud) => (
                        <tr key={solicitud.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {decodeHtml(solicitud.despacho_nombre || solicitud.id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {decodeHtml(solicitud.despacho_localidad || "-")}, {decodeHtml(solicitud.despacho_provincia || "-")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Aceptada
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RECHAZADAS TAB */}
          {activeTab === 'rechazadas' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircleIcon className="h-5 w-5 text-red-600" />
                Solicitudes Rechazadas
              </h3>
              {solicitudesRechazadas.length === 0 ? (
                <div className="text-center py-12">
                  <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes solicitudes rechazadas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Las solicitudes rechazadas o canceladas aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despacho</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {solicitudesRechazadas.map((solicitud) => (
                        <tr key={solicitud.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {decodeHtml(solicitud.despacho_nombre || solicitud.id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {decodeHtml(solicitud.despacho_localidad || "-")}, {decodeHtml(solicitud.despacho_provincia || "-")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              {solicitud.estado === 'cancelada' ? 'Cancelada' : 'Rechazada'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
