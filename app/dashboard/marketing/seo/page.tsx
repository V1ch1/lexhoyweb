"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntradaCard } from "@/components/marketing/EntradaCard";
import { PopupContacto } from "@/components/marketing/PopupContacto";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Entrada {
  id: number;
  titulo: string;
  extracto: string;
  imagenUrl: string;
  link: string;
  fecha: string;
  estado: string;
}

export default function SEOPage() {
  const router = useRouter();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedEntrada, setSelectedEntrada] = useState<{
    id: number;
    titulo: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEntradas, setTotalEntradas] = useState(0);

  useEffect(() => {
    fetchEntradas(1, true);
  }, []);

  const fetchEntradas = async (pageNum: number, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Categoría despachosSeo (ID 898)
      const response = await fetch(
        `/api/marketing/entradas?categoria=898&estado=publish&page=${pageNum}&per_page=9`
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
    setSelectedEntrada({ id: typeof id === 'string' ? parseInt(id) : id, titulo });
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
          Entradas SEO
        </h1>
        <p className="text-gray-600">
          Contenido optimizado para motores de búsqueda
          {!loading && totalEntradas > 0 && (
            <span className="ml-2 text-sm font-semibold text-blue-600">
              · {totalEntradas} entrada{totalEntradas !== 1 ? "s" : ""} disponible{totalEntradas !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

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
              <p>✨ Has visto todas las entradas de SEO</p>
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
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay entradas disponibles
          </h3>
          <p className="text-gray-600">
            Por el momento no hay entradas de SEO publicadas
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
