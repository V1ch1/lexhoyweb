"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface DespachoForm {
  nombre: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  web: string;
  descripcion: string;
  num_sedes: number;
}

// Función para decodificar entidades HTML
function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined') return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function EditDespachoPage() {
  const params = useParams();
  const router = useRouter();
  const despachoId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<DespachoForm>({
    nombre: '',
    localidad: '',
    provincia: '',
    telefono: '',
    email: '',
    web: '',
    descripcion: '',
    num_sedes: 1,
  });

  useEffect(() => {
    const fetchDespacho = async () => {
      if (!despachoId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("despachos")
          .select("*")
          .eq("id", despachoId)
          .single();

        if (error) {
          console.error("Error fetching despacho:", error);
          setError("No se pudo cargar la información del despacho");
          return;
        }

        setFormData({
          nombre: decodeHtmlEntities(data.nombre || ''),
          localidad: data.localidad || '',
          provincia: data.provincia || '',
          telefono: data.telefono || '',
          email: data.email || '',
          web: data.web || '',
          descripcion: decodeHtmlEntities(data.descripcion || ''),
          num_sedes: data.num_sedes || 1,
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Ocurrió un error al cargar el despacho");
      } finally {
        setLoading(false);
      }
    };

    fetchDespacho();
  }, [despachoId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'num_sedes' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despachoId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('despachos')
        .update({
          nombre: formData.nombre,
          localidad: formData.localidad,
          provincia: formData.provincia,
          telefono: formData.telefono,
          email: formData.email,
          web: formData.web,
          descripcion: formData.descripcion,
          num_sedes: formData.num_sedes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', despachoId);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/despachos/${despachoId}`);
      }, 1500);
    } catch (err) {
      console.error('Error al actualizar:', err);
      setError('No se pudo actualizar el despacho. Por favor, inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del despacho...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.nombre) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/despachos/${despachoId}`)}
          className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver al despacho
        </button>
        
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Despacho</h1>
            <p className="text-gray-600 mt-1">Actualiza la información de tu despacho</p>
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">¡Despacho actualizado correctamente!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Despacho <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Bufete García & Asociados"
                />
              </div>

              <div>
                <label htmlFor="localidad" className="block text-sm font-medium text-gray-700 mb-2">
                  Localidad
                </label>
                <input
                  type="text"
                  id="localidad"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Madrid"
                />
              </div>

              <div>
                <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <input
                  type="text"
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Madrid"
                />
              </div>

              <div>
                <label htmlFor="num_sedes" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Sedes
                </label>
                <input
                  type="number"
                  id="num_sedes"
                  name="num_sedes"
                  value={formData.num_sedes}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: +34 912 345 678"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: contacto@despacho.com"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="web" className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio Web
                </label>
                <input
                  type="url"
                  id="web"
                  name="web"
                  value={formData.web}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: https://www.despacho.com"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Despacho
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe tu despacho, especialidades, experiencia, etc."
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/despachos/${despachoId}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
