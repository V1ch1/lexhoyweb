"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ImageUploader } from "@/components/ImageUploader";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";

export default function CrearEntradaPage() {
  const router = useRouter();
  const { user } = useAuth();
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
    
    if (!user) {
      setError("No estás autenticado");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Insertar directamente en Supabase
      const { error: insertError } = await supabase
        .from("entradas_proyecto")
        .insert({
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion.trim(),
          imagen_url: formData.imagen_url || null,
          estado: formData.estado,
          published_at: formData.estado === "publicada" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard/marketing/gestion-entradas");
      }, 2000);
    } catch (err) {
      console.error("Error al crear entrada:", err);
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
          onClick={() => router.push("/dashboard/marketing/gestion-entradas")}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver a Gestión de Entradas
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
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-sm mx-auto">
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
                    ¿Estás interesad@?
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard/marketing/gestion-entradas")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.titulo || !formData.descripcion}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? "Creando..." : "Crear Entrada"}
            </button>
          </div>

          {/* Success message debajo de los botones */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 font-medium">
                ✓ Entrada creada exitosamente. Redirigiendo...
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
