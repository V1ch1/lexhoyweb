"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeftIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ImageUploader } from "@/components/ImageUploader";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";

export default function EditarEntradaPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    imagen_url: "",
    estado: "borrador" as "borrador" | "publicada" | "despublicada",
  });

  useEffect(() => {
    fetchEntrada();
  }, [id]);

  const fetchEntrada = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketing/entradas-proyecto?per_page=100`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar la entrada");
      }

      const entrada = data.entradas.find((e: { id: string }) => e.id === id);
      
      if (!entrada) {
        throw new Error("Entrada no encontrada");
      }

      setFormData({
        titulo: entrada.titulo,
        descripcion: entrada.descripcion,
        imagen_url: entrada.imagen_url || "",
        estado: entrada.estado,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("No estás autenticado");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Actualizar directamente en Supabase
      const updateData: {
        titulo: string;
        descripcion: string;
        imagen_url: string | null;
        estado: string;
        published_at?: string;
      } = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        imagen_url: formData.imagen_url || null,
        estado: formData.estado,
      };

      // Si se está publicando, actualizar published_at
      if (formData.estado === "publicada") {
        updateData.published_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("entradas_proyecto")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard/marketing/gestion-entradas");
      }, 2000);
    } catch (err) {
      console.error("Error al actualizar entrada:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
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
          Editar Entrada
        </h1>
        <p className="text-gray-600">
          Modifica los detalles de la entrada de marketing
        </p>
      </div>

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
                rows={10}
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
                onImageUploaded={async (url) => {
                  // Si había una imagen anterior, eliminarla de Storage
                  if (formData.imagen_url && formData.imagen_url.includes('supabase')) {
                    const oldPath = formData.imagen_url.split('/').pop();
                    if (oldPath) {
                      await supabase.storage
                        .from('entradas-proyecto')
                        .remove([oldPath]);
                    }
                  }
                  setFormData((prev) => ({ ...prev, imagen_url: url }));
                }}
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
                <option value="despublicada">Despublicada (oculta pero guardada)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Los borradores y despublicadas solo son visibles para super admins
              </p>
            </div>

            {/* Preview Card */}
            {formData.titulo && formData.descripcion && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Vista Previa:</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          formData.estado === "publicada"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : formData.estado === "despublicada"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formData.estado.charAt(0).toUpperCase() + formData.estado.slice(1)}
                      </span>
                    </div>
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
          <div className="flex items-center gap-4 justify-between">
            {/* Error message inline */}
            {error && (
              <div className="flex-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/marketing/gestion-entradas")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !formData.titulo || !formData.descripcion}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          {/* Success message debajo de los botones */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 font-medium">
                ✓ Entrada actualizada exitosamente. Redirigiendo...
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
