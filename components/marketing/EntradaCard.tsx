"use client";

import Image from "next/image";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface EntradaCardProps {
  id: string | number;
  titulo: string;
  extracto: string;
  imagenUrl: string;
  fecha: string;
  onParticipar: (id: string | number, titulo: string) => void;
}

export function EntradaCard({
  id,
  titulo,
  extracto,
  imagenUrl,
  fecha,
  onParticipar,
}: EntradaCardProps) {
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Imagen */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <Image
          src={imagenUrl}
          alt={titulo}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://via.placeholder.com/600x400?text=Sin+Imagen";
          }}
        />
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Fecha */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <CalendarIcon className="h-4 w-4 mr-1.5" />
          <span>{formatearFecha(fecha)}</span>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {titulo}
        </h3>

        {/* Extracto */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {extracto}...
        </p>

        {/* Botón Participa */}
        <button
          onClick={() => onParticipar(id, titulo)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          ¿Estás interesad@?
        </button>
      </div>
    </div>
  );
}
