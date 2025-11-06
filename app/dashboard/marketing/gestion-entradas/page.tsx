"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/lib/supabase";

interface Entrada {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string | null;
  estado: "borrador" | "publicada" | "despublicada";
  created_at: string;
  updated_at: string;
  published_at: string | null;
  user_name: string;
  user_email: string;
}

export default function GestionEntradasPage() {
  const router = useRouter();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [busqueda, setBusqueda] = useState("");
  const [procesando, setProcesando] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning",
  });

  useEffect(() => {
    fetchEntradas();
  }, [filtroEstado]);

  const fetchEntradas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado !== "all") {
        params.append("estado", filtroEstado);
      }
      params.append("per_page", "100"); // Cargar todas para gestión

      const response = await fetch(`/api/marketing/entradas-proyecto?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar las entradas");
      }

      setEntradas(data.entradas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = (id: string, nuevoEstado: "publicada" | "despublicada", titulo: string) => {
    setConfirmDialog({
      isOpen: true,
      title: nuevoEstado === "publicada" ? "Publicar Entrada" : "Despublicar Entrada",
      message: `¿Estás seguro de ${nuevoEstado === "publicada" ? "publicar" : "despublicar"} la entrada "${titulo}"?`,
      type: nuevoEstado === "publicada" ? "info" : "warning",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        
        try {
          setProcesando(id);
          
          const updateData: {
            estado: string;
            published_at?: string;
          } = {
            estado: nuevoEstado,
          };

          // Si se está publicando, actualizar published_at
          if (nuevoEstado === "publicada") {
            updateData.published_at = new Date().toISOString();
          }

          const { error: updateError } = await supabase
            .from("entradas_proyecto")
            .update(updateData)
            .eq("id", id);

          if (updateError) {
            throw updateError;
          }

          // Actualizar la lista
          fetchEntradas();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al actualizar");
        } finally {
          setProcesando(null);
        }
      },
    });
  };

  const handleEliminar = (id: string, titulo: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Entrada",
      message: `¿Estás seguro de eliminar la entrada "${titulo}"? Esta acción no se puede deshacer.`,
      type: "danger",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        
        try {
          setProcesando(id);
          
          const { error: deleteError } = await supabase
            .from("entradas_proyecto")
            .delete()
            .eq("id", id);

          if (deleteError) {
            throw deleteError;
          }

          // Actualizar la lista
          fetchEntradas();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al eliminar");
        } finally {
          setProcesando(null);
        }
      },
    });
  };

  const entradasFiltradas = entradas.filter((entrada) =>
    entrada.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    entrada.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const badges = {
      borrador: "bg-gray-100 text-gray-800 border-gray-300",
      publicada: "bg-green-100 text-green-800 border-green-300",
      despublicada: "bg-red-100 text-red-800 border-red-300",
    };
    return badges[estado as keyof typeof badges] || badges.borrador;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/marketing")}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver a Marketing
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Entradas
            </h1>
            <p className="text-gray-600">
              Panel de administración para crear, editar y gestionar entradas en proyecto
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/marketing/gestion-entradas/crear")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Crear Nueva Entrada
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título o descripción..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="borrador">Borradores</option>
              <option value="publicada">Publicadas</option>
              <option value="despublicada">Despublicadas</option>
            </select>
          </div>
        </div>

        {/* Contador */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold text-gray-900">{entradasFiltradas.length}</span> de{" "}
            <span className="font-semibold text-gray-900">{entradas.length}</span> entradas
          </p>
        </div>
      </div>

      {/* Tabla de entradas */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : entradasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay entradas
          </h3>
          <p className="text-gray-600 mb-6">
            {busqueda || filtroEstado !== "all"
              ? "No se encontraron entradas con los filtros aplicados"
              : "Aún no has creado ninguna entrada. Crea tu primera entrada para empezar."}
          </p>
          {!busqueda && filtroEstado === "all" && (
            <button
              onClick={() => router.push("/dashboard/marketing/entradas-proyecto/crear")}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Crear Primera Entrada
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entradasFiltradas.map((entrada) => (
                  <tr key={entrada.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {entrada.imagen_url && (
                          <img
                            src={entrada.imagen_url}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {entrada.titulo}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                            {entrada.descripcion}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoBadge(
                          entrada.estado
                        )}`}
                      >
                        {entrada.estado.charAt(0).toUpperCase() + entrada.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entrada.user_name}</div>
                      <div className="text-sm text-gray-500">{entrada.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entrada.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botón Publicar/Despublicar */}
                        {entrada.estado === "publicada" ? (
                          <button
                            onClick={() => handleCambiarEstado(entrada.id, "despublicada", entrada.titulo)}
                            disabled={procesando === entrada.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Despublicar"
                          >
                            <EyeSlashIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCambiarEstado(entrada.id, "publicada", entrada.titulo)}
                            disabled={procesando === entrada.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Publicar"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        )}

                        {/* Botón Editar */}
                        <button
                          onClick={() => router.push(`/dashboard/marketing/gestion-entradas/${entrada.id}/editar`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleEliminar(entrada.id, entrada.titulo)}
                          disabled={procesando === entrada.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
