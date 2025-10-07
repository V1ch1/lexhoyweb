"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { MagnifyingGlassIcon, BuildingOfficeIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

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

type TabType = 'buscar' | 'enviadas' | 'aceptadas' | 'rechazadas';

export default function SolicitarDespacho() {
  // Estados del componente
  const [activeTab, setActiveTab] = useState<TabType>('buscar');
  const [nombre, setNombre] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [results, setResults] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitados, setSolicitados] = useState<number[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingSolicitud, setLoadingSolicitud] = useState<number | null>(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Array<{
    id: string;
    estado: string;
    despacho_nombre?: string;
    despacho_localidad?: string;
    despacho_provincia?: string;
    fecha_solicitud?: string;
    despachos?: { nombre?: string };
  }>>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDespacho, setNewDespacho] = useState({
    nombre: '',
    descripcion: '',
    areas_practica: [] as string[],
    localidad: '',
    provincia: '',
    direccion: '',
    telefono: '',
    email: '',
    web: '',
  });
  const [creatingDespacho, setCreatingDespacho] = useState(false);

  const { user } = useAuth();
  
  // Cargar solicitudes pendientes al cargar el componente
  useEffect(() => {
    cargarSolicitudesPendientes();
  }, [user]);
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
      // Buscar el despacho en results
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

      // Usa el object_id real de WordPress si existe, si no, genera uno local
      const objectId =
        despacho.meta?.object_id && despacho.meta.object_id !== ""
          ? despacho.meta.object_id
          : `lexhoy-${despacho.id}`;
      const slug =
        despacho.meta?.slug || despachoNombre.toLowerCase().replace(/ /g, "-");

      // Obtener el JWT de forma segura
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
      if (!res.ok) throw new Error("Error al solicitar vinculación");
      setSolicitados((prev) => [...prev, despachoId]);
      setSuccess("Solicitud enviada correctamente");
      await cargarSolicitudesPendientes();
      // Ocultar el mensaje de éxito y limpiar resultados después de un breve tiempo
      setTimeout(() => {
        setSuccess(null);
        setResults([]);
        setNombre("");
      }, 2000);
    } catch {
      setError("Error al solicitar vinculación");
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
      
      // Obtener el JWT de forma segura
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

  // Cargar solicitudes pendientes
  const cargarSolicitudesPendientes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Endpoint de solicitudes-despacho deshabilitado
      console.log("La funcionalidad de carga de solicitudes está temporalmente deshabilitada");
      setSolicitudesPendientes([]);
    } catch (err) {
      console.error("Error en cargarSolicitudesPendientes:", err);
      setError("Error al cargar solicitudes");
    }
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setSuccess(null);
    setShowCreateForm(false);
    
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
      
      // Si no hay resultados, mostrar opción de crear
      if (data.length === 0) {
        setShowCreateForm(true);
      }
    } catch (err) {
      console.error("Error en búsqueda de despachos:", err);
      setError(err instanceof Error ? err.message : "Error al buscar despachos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDespacho(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const token = getJWT();
      if (!token) throw new Error("No se pudo obtener el token de sesión");

      const res = await fetch("/api/crear-despacho", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newDespacho),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear despacho");
      }

      const data = await res.json();
      setSuccess(`Despacho creado correctamente. ${data.sincronizadoWP ? 'Sincronizado con WordPress.' : 'Se sincronizará con WordPress más tarde.'}`);
      
      // Limpiar formulario
      setNewDespacho({
        nombre: '',
        descripcion: '',
        areas_practica: [],
        localidad: '',
        provincia: '',
        direccion: '',
        telefono: '',
        email: '',
        web: '',
      });
      setShowCreateForm(false);
      setNombre('');

      // Esperar un momento y recargar
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error("Error al crear despacho:", err);
      setError(err instanceof Error ? err.message : "Error al crear despacho");
    } finally {
      setCreatingDespacho(false);
    }
  };
  // ...existing code...

  // Tabs configuration
  const tabs = [
    { id: 'buscar' as TabType, label: 'Buscador', icon: MagnifyingGlassIcon },
    { id: 'enviadas' as TabType, label: 'Enviadas', icon: ClockIcon },
    { id: 'aceptadas' as TabType, label: 'Aceptadas', icon: CheckCircleIcon },
    { id: 'rechazadas' as TabType, label: 'Rechazadas', icon: XCircleIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Despachos</h1>
        <p className="text-gray-600">Busca y solicita vinculación con despachos de abogados</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-all
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del despacho
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: MB Advocats"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localidad
                    </label>
                    <input
                      type="text"
                      value={localidad}
                      onChange={(e) => setLocalidad(e.target.value)}
                      placeholder="Ej: Barcelona"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      placeholder="Ej: Barcelona"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        Buscar Despachos
                      </>
                    )}
                  </button>
                  {(nombre || localidad || provincia) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNombre('');
                        setLocalidad('');
                        setProvincia('');
                        setResults([]);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </form>
      {loading && (
        <div className="flex items-center gap-2 text-blue-600">
          <span className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full"></span>{" "}
          Buscando...
        </div>
      )}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      {/* Renderizado de solicitudes del usuario */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">
          Mis solicitudes de despacho (pendientes)
        </h3>
        {solicitudesPendientes.filter((s) => s.estado === "pendiente")
          .length === 0 ? (
          <p className="text-gray-500">No tienes solicitudes pendientes.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Localidad</th>
                <th className="px-4 py-2">Provincia</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesPendientes
                .filter((s) => s.estado === "pendiente")
                .map((solicitud) => (
                  <tr key={solicitud.id} className="border-b">
                    <td className="px-4 py-2">
                      {decodeHtml(solicitud.despacho_nombre || solicitud.id)}
                    </td>
                    <td className="px-4 py-2">
                      {decodeHtml(solicitud.despacho_localidad || "-")}
                    </td>
                    <td className="px-4 py-2">
                      {decodeHtml(solicitud.despacho_provincia || "-")}
                    </td>
                    <td className="px-4 py-2">
                      {solicitud.fecha_solicitud
                        ? (() => {
                            const fechaLocal = new Date(
                              solicitud.fecha_solicitud!
                            );
                            if (isNaN(fechaLocal.getTime())) return "-";
                            fechaLocal.setHours(fechaLocal.getHours() + 2);
                            return fechaLocal.toLocaleString("es-ES");
                          })()
                        : "-"}
                    </td>
                    <td className="px-4 py-2 flex gap-2 items-center">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {solicitud.estado || "Sin estado"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {(!solicitud.estado ||
                        solicitud.estado === "pendiente") && (
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 transition ml-2"
                          onClick={() => handleCancelarSolicitud(solicitud.id)}
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Renderizado de solicitudes canceladas */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Solicitudes canceladas</h3>
        {solicitudesPendientes.filter((s) => s.estado === "cancelada")
          .length === 0 ? (
          <p className="text-gray-500">No tienes solicitudes canceladas.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Localidad</th>
                <th className="px-4 py-2">Provincia</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesPendientes
                .filter((s) => s.estado === "cancelada")
                .map((solicitud) => (
                  <tr key={solicitud.id} className="border-b bg-red-50">
                    <td className="px-4 py-2">
                      {decodeHtml(solicitud.despacho_nombre || solicitud.id)}
                    </td>
                    <td className="px-4 py-2">
                      {decodeHtml(solicitud.despacho_localidad || "-")}
                    </td>
                    <td className="px-4 py-2">
                      {decodeHtml(solicitud.despacho_provincia || "-")}
                    </td>
                    <td className="px-4 py-2">
                      {solicitud.fecha_solicitud
                        ? (() => {
                            const fechaLocal = new Date(
                              solicitud.fecha_solicitud!
                            );
                            if (isNaN(fechaLocal.getTime())) return "-";
                            fechaLocal.setHours(fechaLocal.getHours() + 2);
                            return fechaLocal.toLocaleString("es-ES");
                          })()
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                        Cancelada
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Renderizado de resultados de búsqueda y botón para solicitar */}
      {results.length > 0 && (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Localidad</th>
              <th className="px-4 py-2">Provincia</th>
              <th className="px-4 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {results.map((despacho) => {
              const solicitado = solicitados.includes(despacho.id);
              const localidad = decodeHtml(despacho.meta?.localidad || "");
              const provincia = decodeHtml(despacho.meta?.provincia || "");
              return (
                <tr key={despacho.id} className="border-b">
                  <td className="px-4 py-2 font-semibold text-gray-900 w-1/3">
                    {decodeHtml(despacho.title.rendered)}
                  </td>
                  <td className="px-4 py-2 w-1/4">{localidad}</td>
                  <td className="px-4 py-2 w-1/4">{provincia}</td>
                  <td className="px-4 py-2 w-1/6">
                    {solicitado ? (
                      <button
                        className="bg-gray-400 text-white px-4 py-2 rounded shadow cursor-not-allowed"
                        disabled
                      >
                        Solicitado
                      </button>
                    ) : (
                      <button
                        className={`px-4 py-2 rounded shadow transition flex items-center gap-2 ${
                          loadingSolicitud === despacho.id
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary-dark"
                        }`}
                        onClick={() => handleSolicitar(despacho.id)}
                        disabled={loadingSolicitud === despacho.id}
                      >
                        {loadingSolicitud === despacho.id ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
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
                            Solicitando...
                          </>
                        ) : (
                          "Solicitar"
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {!loading && results.length === 0 && nombre && !showCreateForm && (
        <p className="text-gray-500 mt-4">
          No se encontraron despachos con ese nombre.
        </p>
      )}

      {/* Botón para mostrar formulario de creación de despacho */}
      {!showCreateForm && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
          >
            Crear despacho
          </button>
        </div>
      )}

      {/* Formulario de creación de despacho */}
      {showCreateForm && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            No encontramos tu despacho - Créalo aquí
          </h3>
          <form onSubmit={handleCreateDespacho} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del despacho *
                </label>
                <input
                  type="text"
                  value={newDespacho.nombre}
                  onChange={(e) => setNewDespacho({ ...newDespacho, nombre: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localidad *
                </label>
                <input
                  type="text"
                  value={newDespacho.localidad}
                  onChange={(e) => setNewDespacho({ ...newDespacho, localidad: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia *
                </label>
                <input
                  type="text"
                  value={newDespacho.provincia}
                  onChange={(e) => setNewDespacho({ ...newDespacho, provincia: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={newDespacho.direccion}
                  onChange={(e) => setNewDespacho({ ...newDespacho, direccion: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                value={newDespacho.descripcion}
                onChange={(e) => setNewDespacho({ ...newDespacho, descripcion: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={newDespacho.telefono}
                  onChange={(e) => setNewDespacho({ ...newDespacho, telefono: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newDespacho.email}
                  onChange={(e) => setNewDespacho({ ...newDespacho, email: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio web
                </label>
                <input
                  type="url"
                  value={newDespacho.web}
                  onChange={(e) => setNewDespacho({ ...newDespacho, web: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={creatingDespacho}
                className={`flex-1 px-6 py-2 rounded shadow transition ${
                  creatingDespacho
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {creatingDespacho ? 'Creando...' : 'Crear Despacho'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded shadow hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
