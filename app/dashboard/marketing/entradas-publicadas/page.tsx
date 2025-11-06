"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntradaCard } from "@/components/marketing/EntradaCard";
import { PopupContacto } from "@/components/marketing/PopupContacto";
import { ArrowLeftIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface Entrada {
  id: number;
  titulo: string;
  extracto: string;
  imagenUrl: string;
  link: string;
  fecha: string;
  estado: string;
  categorias?: number[];
  categoriaSlugs?: string[];
}

// Categorías de LexHoy con sus IDs de WordPress
// Necesitarás obtener los IDs reales de WordPress
const AREAS_PRACTICA = [
  { id: "all", nombre: "Todas las áreas", slug: "all", wpId: null },
  { id: "actualidad", nombre: "Actualidad", slug: "actualidad", wpId: null },
  { id: "administrativo", nombre: "Administrativo", slug: "administrativo", wpId: null },
  { id: "bancario", nombre: "Bancario y recuperaciones", slug: "bancario-y-recuperaciones", wpId: null },
  { id: "concursal", nombre: "Concursal y Mercantil", slug: "concursal", wpId: null },
  { id: "consumo", nombre: "Consumo", slug: "consumo", wpId: null },
  { id: "civil", nombre: "Derecho civil", slug: "derecho-civil", wpId: null },
  { id: "laboral", nombre: "Laboral y seguridad social", slug: "laboral-y-seguridad-social", wpId: null },
  { id: "lexseries", nombre: "LexSeries", slug: "lexseries", wpId: null },
  { id: "penal", nombre: "Penal", slug: "penal", wpId: null },
  { id: "tecnologia", nombre: "Tecnología", slug: "tecnologia", wpId: null },
  { id: "tributario", nombre: "Tributario y contabilidad", slug: "tributario-y-contabilidad", wpId: null },
];

export default function EntradasPublicadasPage() {
  const router = useRouter();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedEntrada, setSelectedEntrada] = useState<{
    id: string | number;
    titulo: string;
  } | null>(null);
  const [areaSeleccionada, setAreaSeleccionada] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEntradas, setTotalEntradas] = useState(0);

  useEffect(() => {
    fetchEntradas(1, true);
  }, []);

  // Reset y recargar cuando cambia el área seleccionada
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchEntradas(1, true);
  }, [areaSeleccionada]);

  const fetchEntradas = async (pageNum: number, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Obtener el slug de la categoría seleccionada
      const area = AREAS_PRACTICA.find(a => a.id === areaSeleccionada);
      const categoriaParam = area?.slug || "all";

      // Obtener entradas con paginación y filtro de categoría
      const response = await fetch(
        `/api/marketing/entradas?categoria=${categoriaParam}&estado=publish&page=${pageNum}&per_page=9`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar las entradas");
      }

      if (reset) {
        setEntradas(data.entradas);
      } else {
        setEntradas(prev => [...prev, ...data.entradas]);
      }
      
      setHasMore(data.pagination?.hasMore || false);
      setPage(pageNum);
      setTotalEntradas(data.pagination?.total || data.entradas.length);
      
      // Debug
      if (reset) {
        console.log(`📊 Categoría: ${categoriaParam}, Entradas: ${data.entradas.length}, Total: ${data.pagination?.total}`);
        console.log("📄 Paginación:", data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEntradas(page + 1, false);
    }
  };

  const handleParticipar = (id: string | number, titulo: string) => {
    setSelectedEntrada({ id, titulo });
    setPopupOpen(true);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Entradas LexHoy Publicadas
        </h1>
        <p className="text-gray-600">
          Revisa las entradas de LexHoy publicadas y participa en las que te interesen
        </p>
      </div>

      {/* Filtro por áreas - Solo mostrar cuando hay entradas */}
      {!loading && entradas.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <FunnelIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Filtrar por categoría</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {AREAS_PRACTICA.map((area) => (
              <button
                key={area.id}
                onClick={() => setAreaSeleccionada(area.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-center ${
                  areaSeleccionada === area.id
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {area.nombre}
              </button>
            ))}
          </div>
          {areaSeleccionada !== "all" && totalEntradas > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{totalEntradas}</span> entrada{totalEntradas !== 1 ? "s" : ""} disponible{totalEntradas !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setAreaSeleccionada("all")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpiar filtro
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entradas grid */}
      {!loading && entradas.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entradas.map((entrada) => (
              <EntradaCard
                key={entrada.id}
                id={entrada.id}
                titulo={entrada.titulo}
                extracto={entrada.extracto}
                imagenUrl={entrada.imagenUrl}
                fecha={entrada.fecha}
                onParticipar={handleParticipar}
              />
            ))}
          </div>

          {/* Botón Cargar más */}
          {hasMore && !loadingMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Cargar más entradas
              </button>
            </div>
          )}

          {/* Loading más entradas */}
          {loadingMore && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Cargando más entradas...</span>
              </div>
            </div>
          )}

          {/* Mensaje de fin */}
          {!hasMore && !loadingMore && entradas.length > 9 && (
            <div className="mt-8 text-center text-gray-600">
              <p>✨ Has visto todas las entradas {areaSeleccionada !== "all" ? `de ${AREAS_PRACTICA.find(a => a.id === areaSeleccionada)?.nombre}` : "disponibles"}</p>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && entradas.length === 0 && (
        <div className="text-center py-12">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron entradas
          </h3>
          <p className="text-gray-600">
            {areaSeleccionada === "all" 
              ? "Por el momento no hay entradas de LexHoy publicadas"
              : "No hay entradas para esta categoría. Prueba con otra."}
          </p>
        </div>
      )}

      {/* Popup de participación */}
      {selectedEntrada && (
        <PopupContacto
          isOpen={popupOpen}
          onClose={() => {
            setPopupOpen(false);
            setSelectedEntrada(null);
          }}
          entradaId={selectedEntrada.id}
          entradaTitulo={selectedEntrada.titulo}
        />
      )}
    </div>
  );
}
