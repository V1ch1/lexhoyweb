"use client";
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
import React, { useState } from "react";
import { useAuth } from "@/lib/authContext";

interface Despacho {
  id: number;
  title: { rendered: string };
  meta?: {
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email_contacto?: string;
    object_id?: string;
    _despacho_sedes?: Array<{
      localidad?: string;
      provincia?: string;
    }>;
  };
}

export default function SolicitarDespacho() {
  // ...declaraciones únicas y handlers ya presentes arriba...
  const { user } = useAuth();
  // Handler para solicitar despacho
  const handleSolicitar = async (despachoId: number) => {
    setError(null);
    setSuccess(null);
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
      // Usar el object_id de WordPress como despachoId
      const objectId = despacho.meta?.object_id || `lexhoy-${despacho.id}`;

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
        }),
      });
      if (!res.ok) throw new Error("Error al solicitar vinculación");
      setSolicitados((prev) => [...prev, despachoId]);
      setSuccess("Solicitud enviada correctamente");
      await cargarSolicitudesPendientes();
    } catch {
      setError("Error al solicitar vinculación");
    }
  };

  // Estado para solicitudes pendientes del usuario
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<
    Array<{
      id: string;
      estado: string;
      despacho_nombre?: string;
      despacho_localidad?: string;
      despacho_provincia?: string;
      fecha_solicitud?: string;
      despachos?: { nombre?: string };
    }>
  >([]);

  // Handler para cancelar solicitud usando el mismo endpoint que settings
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
    } catch {
      setError("Error al cancelar la solicitud");
    }
  };

  // Función bloqueada: No cargar solicitudes pendientes automáticamente
  // const cargarSolicitudesPendientes = React.useCallback(async () => {
  //   if (!user?.id) return;
  //   try {
  //     // Obtener el JWT de forma segura
  //     const token = getJWT();
  //     if (!token) throw new Error("No se pudo obtener el token de sesión");
  //     const res = await fetch(`/api/solicitudes-despacho?userId=${user.id}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     if (!res.ok) throw new Error("Error al cargar solicitudes");
  //     const solicitudes = await res.json();
  //     setSolicitudesPendientes(solicitudes);
  //   } catch {
  //     setError("Error al cargar solicitudes");
  //   }
  // }, [user]);
  // React.useEffect(() => {
  //   cargarSolicitudesPendientes();
  //   // DEBUG: mostrar solicitudes recibidas en consola
  //   setTimeout(() => {
  //     console.log("Solicitudes recibidas:", solicitudesPendientes);
  //   }, 1000);
  // }, [user, cargarSolicitudesPendientes, solicitudesPendientes]);
  const [nombre, setNombre] = useState("");
  const [results, setResults] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitados, setSolicitados] = useState<number[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/search-despachos?query=${encodeURIComponent(nombre)}`
      );
      if (!res.ok) throw new Error("Error al buscar despachos");
      const data = await res.json();
      setResults(data);
    } catch {
      setError("Error al buscar despachos");
    } finally {
      setLoading(false);
    }
  };
  // ...existing code...

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">
        Buscar y solicitar vinculación de despacho
      </h2>
      <form onSubmit={handleSearch} className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del despacho
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: MB Advocats"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-primary text-white px-6 py-2 rounded shadow hover:bg-primary-dark transition self-end"
        >
          Buscar
        </button>
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
          Mis solicitudes de despacho
        </h3>
        {solicitudesPendientes.length === 0 ? (
          <p className="text-gray-500">No tienes solicitudes registradas.</p>
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
              {solicitudesPendientes.map((solicitud) => (
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
                        className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark transition"
                        onClick={() => handleSolicitar(despacho.id)}
                      >
                        Solicitar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {!loading && results.length === 0 && nombre && (
        <p className="text-gray-500 mt-4">
          No se encontraron despachos con ese nombre.
        </p>
      )}
    </div>
  );
}
