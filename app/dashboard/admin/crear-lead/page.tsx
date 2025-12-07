"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  SparklesIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

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

const NIVELES_DETALLE = [
  { value: "bajo", label: "Bajo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
];

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [procesarConIA, setProcesarConIA] = useState(true);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    cuerpo_mensaje: "",
    url_pagina: "",
    titulo_post: "",
    fuente: "manual",
    especialidad: "",
    provincia: "",
    ciudad: "",
    urgencia: "media" as "baja" | "media" | "alta" | "urgente",
    precio_base: "",
    resumen_ia: "",
    palabras_clave: "",
    puntuacion_calidad: 50,
    nivel_detalle: "medio" as "bajo" | "medio" | "alto",
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
      // Procesar palabras clave
      const palabras_clave = formData.palabras_clave
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          correo: formData.correo,
          telefono: formData.telefono,
          cuerpo_mensaje: formData.cuerpo_mensaje,
          url_pagina: formData.url_pagina || "https://lexhoy.com/manual",
          titulo_post: formData.titulo_post || "Lead creado manualmente",
          fuente: "manual",
          especialidad: procesarConIA ? null : formData.especialidad || null,
          provincia: procesarConIA ? null : formData.provincia || null,
          ciudad: procesarConIA ? null : formData.ciudad || null,
          urgencia: procesarConIA ? null : formData.urgencia,
          precio_base: procesarConIA
            ? null
            : formData.precio_base
              ? parseFloat(formData.precio_base)
              : null,
          resumen_ia: procesarConIA ? null : formData.resumen_ia || null,
          palabras_clave: procesarConIA ? null : palabras_clave,
          puntuacion_calidad: procesarConIA ? null : formData.puntuacion_calidad,
          nivel_detalle: procesarConIA ? null : formData.nivel_detalle,
          procesar_con_ia: procesarConIA,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear lead");
      }

      toast.success("Lead creado exitosamente");
      router.push("/dashboard/admin/listado-leads");
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Error al crear el lead. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6">
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
                detectará la especialidad, provincia, palabras clave y calculará
                el precio base automáticamente.
              </p>
            </label>
          </div>
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            {/* Datos básicos */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Datos del Cliente
              </h2>
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje / Consulta <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="cuerpo_mensaje"
                    value={formData.cuerpo_mensaje}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe la consulta legal del cliente..."
                  />
                </div>
              </div>
            </div>

            {/* Metadatos */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Metadatos
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Página
                  </label>
                  <input
                    type="url"
                    name="url_pagina"
                    value={formData.url_pagina}
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
                    name="titulo_post"
                    value={formData.titulo_post}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Abogado de familia en Madrid"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Clasificación manual */}
          {!procesarConIA && (
            <div className="space-y-6">
              {/* Resumen y Análisis */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Resumen y Análisis
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resumen del Caso <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="resumen_ia"
                      value={formData.resumen_ia}
                      onChange={handleChange}
                      required={!procesarConIA}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Resumen breve y anónimo del caso legal..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Palabras Clave
                    </label>
                    <input
                      type="text"
                      name="palabras_clave"
                      value={formData.palabras_clave}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="divorcio, custodia, pensión (separadas por comas)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntuación de Calidad: {formData.puntuacion_calidad}/100
                    </label>
                    <input
                      type="range"
                      name="puntuacion_calidad"
                      min="0"
                      max="100"
                      value={formData.puntuacion_calidad}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Baja</span>
                      <span>Media</span>
                      <span>Alta</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nivel de Detalle
                    </label>
                    <select
                      name="nivel_detalle"
                      value={formData.nivel_detalle}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {NIVELES_DETALLE.map((nivel) => (
                        <option key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Ubicación
                </h2>
                <div className="space-y-4">
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
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Clasificación
                </h2>
                <div className="space-y-4">
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

              {/* Precio */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Precio</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio del Lead (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="precio_base"
                    value={formData.precio_base}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 150.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio que pagarán los despachos por este lead
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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
