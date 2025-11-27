"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ImageUploader } from "@/components/ImageUploader";

export default function CrearEntradaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    imagen_url: "",
    estado: "borrador" as "borrador" | "publicada",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/marketing/entradas-proyecto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la entrada");
      }

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard/marketing/entradas-proyecto");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/marketing/entradas-proyecto")}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver a Entradas en Proyecto
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Crear Nueva Entrada
        </h1>
        <p className="text-gray-600">
          Crea una nueva entrada de marketing para que los despachos puedan participar
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 font-medium">
            ✓ Entrada creada exitosamente. Redirigiendo...
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              minLength={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Colabora en nuestro artículo sobre derecho laboral"
            />
            <p className="mt-1 text-sm text-gray-500">
              Mínimo 3 caracteres
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              required
              minLength={10}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe la entrada y qué tipo de participación necesitas de los despachos..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Mínimo 10 caracteres. Explica claramente qué necesitas de los despachos.
            </p>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de la Entrada
            </label>
            <ImageUploader
              onImageUploaded={(url) =>
                setFormData((prev) => ({ ...prev, imagen_url: url }))
              }
              currentImageUrl={formData.imagen_url}
            />
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="borrador">Borrador (no visible para usuarios)</option>
              <option value="publicada">Publicada (visible para todos)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Los borradores solo son visibles para super admins
            </p>
          </div>

          {/* Preview Card */}
          {formData.titulo && formData.descripcion && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Vista Previa:</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-sm">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {formData.imagen_url ? (
                    <img
                      src={formData.imagen_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {formData.titulo}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {formData.descripcion}
                  </p>
                  <button
                    type="button"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm"
                    disabled
                  >
                    Participa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="mt-8 flex gap-4 justify-end border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard/marketing/entradas-proyecto")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !formData.titulo || !formData.descripcion}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando..." : "Crear Entrada"}
          </button>
        </div>
      </form>
    </div>
  );
}
