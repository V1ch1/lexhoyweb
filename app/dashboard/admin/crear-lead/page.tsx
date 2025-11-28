"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  SparklesIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { LeadService } from "@/lib/services/leadService";

const ESPECIALIDADES = [
  "Civil",
  "Penal",
  "Laboral",
  "Mercantil",
  "Familia",
  "Administrativo",
  "Fiscal",
  "Inmobiliario",
  "Herencias",
  "Extranjería",
];

const URGENCIAS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [procesarConIA, setProcesarConIA] = useState(true);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    cuerpoMensaje: "",
    urlPagina: "",
    tituloPost: "",
    fuente: "manual",
    especialidad: "",
    provincia: "",
    ciudad: "",
    urgencia: "media" as "baja" | "media" | "alta" | "urgente",
    precioBase: "",
    precioVentaDirecta: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Siempre usar la API, nunca llamar a LeadService desde el cliente
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          correo: formData.correo,
          telefono: formData.telefono,
          cuerpo_mensaje: formData.cuerpoMensaje,
          url_pagina: formData.urlPagina || "https://lexhoy.com/manual",
          titulo_post: formData.tituloPost || "Lead creado manualmente",
          fuente: "manual",
          especialidad: procesarConIA ? null : formData.especialidad || null,
          provincia: procesarConIA ? null : formData.provincia || null,
          ciudad: procesarConIA ? null : formData.ciudad || null,
          urgencia: procesarConIA ? null : formData.urgencia,
          precio_base: procesarConIA
            ? null
            : formData.precioBase
            ? parseFloat(formData.precioBase)
            : null,
          precio_venta_directa: procesarConIA
            ? null
            : formData.precioVentaDirecta
            ? parseFloat(formData.precioVentaDirecta)
            : null,
          procesar_con_ia: procesarConIA,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear lead");
      }

      router.push("/dashboard/admin/listado-leads");
    } catch (error) {
      console.error("Error creating lead:", error);
      alert("Error al crear el lead. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-900 font-playfair">
          Crear Lead Manual
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Crea un nuevo lead manualmente con o sin procesamiento de IA
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Opción de procesamiento IA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="procesarConIA"
              checked={procesarConIA}
              onChange={(e) => setProcesarConIA(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="procesarConIA" className="ml-3 flex-1">
              <div className="flex items-center">
                <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">
                  Procesar con IA
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                La IA analizará el mensaje, generará un resumen anónimo,
                detectará la especialidad, provincia y calculará el precio base
                automáticamente.
              </p>
            </label>
          </div>
        </div>

        {/* Datos básicos */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Datos del Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: juan@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: +34 600 000 000"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje / Consulta <span className="text-red-500">*</span>
            </label>
            <textarea
              name="cuerpoMensaje"
              value={formData.cuerpoMensaje}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe la consulta legal del cliente..."
            />
          </div>
        </div>

        {/* Metadatos */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Metadatos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Página
              </label>
              <input
                type="url"
                name="urlPagina"
                value={formData.urlPagina}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://lexhoy.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Post
              </label>
              <input
                type="text"
                name="tituloPost"
                value={formData.tituloPost}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: Abogado de familia en Madrid"
              />
            </div>
          </div>
        </div>

        {/* Clasificación manual (solo si no se procesa con IA) */}
        {!procesarConIA && (
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Clasificación Manual
            </h2>
            
            {/* Ubicación */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Ubicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    required={!procesarConIA}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Madrid"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Madrid"
                  />
                </div>
              </div>
            </div>

            {/* Clasificación */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Clasificación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleChange}
                    required={!procesarConIA}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar...</option>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgencia
                  </label>
                  <select
                    name="urgencia"
                    value={formData.urgencia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {URGENCIAS.map((urg) => (
                      <option key={urg.value} value={urg.value}>
                        {urg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Precios */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Configuración de Precios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Base / Subasta (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="precioBase"
                    value={formData.precioBase}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Precio inicial de subasta"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio mínimo para subastas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Venta Directa (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="precioVentaDirecta"
                    value={formData.precioVentaDirecta}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Precio de compra directa"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio fijo para compra inmediata
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium shadow-sm"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            {loading ? "Creando..." : "Crear Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
