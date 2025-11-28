import { useEffect, useState } from "react";
import { ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface Solicitud {
  id: string;
  despacho_nombre: string;
  despacho_localidad: string | null;
  despacho_provincia: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha_solicitud: string;
  fecha_respuesta?: string;
  notas_respuesta?: string;
}

export default function SolicitudesTab() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch("/api/user/solicitudes");
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.solicitudes || []);
      }
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium mb-2">
          No tienes solicitudes
        </p>
        <p className="text-gray-500 text-sm">
          Cuando solicites la propiedad de un despacho, aparecerá aquí
        </p>
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4 mr-1" />
            Pendiente
          </span>
        );
      case "aprobado":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Aprobado
          </span>
        );
      case "rechazado":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Mis Solicitudes de Despacho</h3>
      
      {solicitudes.map((solicitud) => (
        <div
          key={solicitud.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">
                {solicitud.despacho_nombre}
              </h4>
              {(solicitud.despacho_localidad || solicitud.despacho_provincia) && (
                <p className="text-sm text-gray-600 mt-1">
                  {[solicitud.despacho_localidad, solicitud.despacho_provincia]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
            {getEstadoBadge(solicitud.estado)}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <span className="font-medium mr-2">Solicitado:</span>
              {new Date(solicitud.fecha_solicitud).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            {solicitud.fecha_respuesta && (
              <div className="flex items-center text-gray-600">
                <span className="font-medium mr-2">Respondido:</span>
                {new Date(solicitud.fecha_respuesta).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}

            {solicitud.notas_respuesta && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-1">Notas:</p>
                <p className="text-sm text-gray-600">{solicitud.notas_respuesta}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
