"use client";

import { useState } from "react";
import { 
  CheckCircleIcon, 
  DocumentTextIcon, 
  TrashIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";

interface EstadoPublicacionProps {
  despachoId: string;
  estadoActual: string;
  onEstadoCambiado: () => void;
}

const ESTADOS = {
  publish: {
    label: "Publicado",
    color: "bg-green-100 text-green-800",
    icon: CheckCircleIcon,
  },
  draft: {
    label: "Borrador",
    color: "bg-yellow-100 text-yellow-800",
    icon: DocumentTextIcon,
  },
  trash: {
    label: "Papelera",
    color: "bg-red-100 text-red-800",
    icon: TrashIcon,
  },
};

export default function EstadoPublicacion({
  despachoId,
  estadoActual,
  onEstadoCambiado,
}: EstadoPublicacionProps) {
  const [nuevoEstado, setNuevoEstado] = useState(estadoActual);
  const [cargando, setCargando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estadoInfo = ESTADOS[estadoActual as keyof typeof ESTADOS] || ESTADOS.draft;
  const IconoEstado = estadoInfo.icon;

  const handleCambiarEstado = async () => {
    // Si va a papelera, pedir confirmación
    if (nuevoEstado === "trash" && !mostrarConfirmacion) {
      setMostrarConfirmacion(true);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const response = await fetch(`/api/despachos/${despachoId}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar el estado");
      }

      setMostrarConfirmacion(false);
      onEstadoCambiado();
    } catch (err) {
      console.error("❌ Error al cambiar estado:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  const cambiosPendientes = nuevoEstado !== estadoActual;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Estado de Publicación</h3>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
          <IconoEstado className="h-4 w-4" />
          {estadoInfo.label}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Cambiar estado
          </label>
          <select
            id="estado"
            value={nuevoEstado}
            onChange={(e) => {
              setNuevoEstado(e.target.value);
              setMostrarConfirmacion(false);
              setError(null);
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={cargando}
          >
            <option value="publish">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="trash">Mover a papelera</option>
          </select>
        </div>

        {mostrarConfirmacion && nuevoEstado === "trash" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  ¿Estás seguro?
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  El despacho se moverá a la papelera y no será visible públicamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {cambiosPendientes && (
          <button
            onClick={handleCambiarEstado}
            disabled={cargando}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              nuevoEstado === "trash"
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cargando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Aplicando cambios...
              </>
            ) : (
              <>
                {mostrarConfirmacion ? "Confirmar y mover a papelera" : "Aplicar cambio de estado"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
