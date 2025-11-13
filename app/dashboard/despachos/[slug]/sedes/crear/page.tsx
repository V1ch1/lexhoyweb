"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CrearSedePage() {
  const router = useRouter();
  const params = useParams();
  const despachoSlug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [despachoId, setDespachoId] = useState<string | null>(null);

  // Obtener ID del despacho desde el slug
  useState(() => {
    const fetchDespachoId = async () => {
      const { data } = await supabase
        .from('despachos')
        .select('id')
        .eq('slug', despachoSlug)
        .single();
      
      if (data) {
        setDespachoId(data.id);
      }
    };
    fetchDespachoId();
  });

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    // Ubicación
    calle: '',
    numero: '',
    piso: '',
    localidad: '',
    provincia: '',
    codigo_postal: '',
    pais: 'España',
    // Contacto
    telefono: '',
    email_contacto: '',
    persona_contacto: '',
    web: '',
    // Adicional
    ano_fundacion: '',
    tamano_despacho: '',
    // Estado
    es_principal: false,
  });

  const [fotoPreview, setFotoPreview] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no puede superar los 2MB');
        return;
      }
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!despachoId) {
        setError('No se pudo obtener el ID del despacho');
        setLoading(false);
        return;
      }

      // Validar campos requeridos
      if (!formData.nombre.trim()) {
        setError('El nombre de la sede es requerido');
        setLoading(false);
        return;
      }
      if (!formData.localidad.trim()) {
        setError('La localidad es requerida');
        setLoading(false);
        return;
      }
      if (!formData.provincia.trim()) {
        setError('La provincia es requerida');
        setLoading(false);
        return;
      }
      if (!formData.email_contacto.trim()) {
        setError('El email de contacto es requerido');
        setLoading(false);
        return;
      }
      if (!formData.telefono.trim()) {
        setError('El teléfono es requerido');
        setLoading(false);
        return;
      }

      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No estás autenticado');
        setLoading(false);
        return;
      }

      // Enviar datos al endpoint
      const response = await fetch(`/api/despachos/${despachoId}/sedes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.error || 'Error al crear la sede');
      }

      setSuccess(true);

      // Redirigir al despacho después de 2 segundos
      setTimeout(() => {
        router.push(`/dashboard/despachos/${despachoSlug}`);
      }, 2000);

    } catch (err) {
      console.error('❌ Error al crear sede:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Crear Nueva Sede
          </h1>
          <p className="mt-2 text-gray-600">
            Agrega una nueva sede a tu despacho
          </p>
        </div>

        {/* Mensajes de error/éxito */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              ✅ Sede creada correctamente. Redirigiendo...
            </p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Indicador de campos obligatorios */}
          <p className="text-sm text-gray-600 mb-4">
            <span className="text-red-500">*</span> Campos obligatorios
          </p>

          {/* Botones superiores */}
          <div className="flex justify-end space-x-4 pb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : (
                'Guardar Nueva Sede'
              )}
            </button>
          </div>

          {/* Información Básica */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información Básica
            </h2>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Sede <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Ej: Sede Central, Oficina Barcelona, etc."
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Descripción de la sede..."
                />
              </div>

              {/* Checkbox Sede Principal */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="es_principal"
                  name="es_principal"
                  checked={formData.es_principal}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="es_principal" className="ml-2 text-sm text-gray-700">
                  Marcar como sede principal
                </label>
                <span className="ml-2 text-xs text-gray-500">
                  (Solo puede haber una sede principal por despacho)
                </span>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ubicación
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Calle */}
              <div>
                <label htmlFor="calle" className="block text-sm font-medium text-gray-700 mb-1">
                  Calle
                </label>
                <input
                  type="text"
                  id="calle"
                  name="calle"
                  value={formData.calle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="C/ Ejemplo"
                />
              </div>

              {/* Número */}
              <div>
                <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="123"
                />
              </div>

              {/* Piso */}
              <div>
                <label htmlFor="piso" className="block text-sm font-medium text-gray-700 mb-1">
                  Piso
                </label>
                <input
                  type="text"
                  id="piso"
                  name="piso"
                  value={formData.piso}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="4º"
                />
              </div>

              {/* Código Postal */}
              <div>
                <label htmlFor="codigo_postal" className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  id="codigo_postal"
                  name="codigo_postal"
                  value={formData.codigo_postal}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="28001"
                  maxLength={5}
                />
              </div>

              {/* Localidad */}
              <div>
                <label htmlFor="localidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Localidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="localidad"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Madrid"
                />
              </div>

              {/* Provincia */}
              <div>
                <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Madrid"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="981 25 22 58"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email_contacto" className="block text-sm font-medium text-gray-700 mb-1">
                  Email de Contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email_contacto"
                  name="email_contacto"
                  value={formData.email_contacto}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="contacto@ejemplo.com"
                />
              </div>

              {/* Persona de Contacto */}
              <div>
                <label htmlFor="persona_contacto" className="block text-sm font-medium text-gray-700 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  id="persona_contacto"
                  name="persona_contacto"
                  value={formData.persona_contacto}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Nombre completo"
                />
              </div>

              {/* Web */}
              <div>
                <label htmlFor="web" className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <input
                  type="url"
                  id="web"
                  name="web"
                  value={formData.web}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="https://www.ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Foto de Perfil */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Foto de Perfil
            </h2>
            
            <div className="flex items-center space-x-6">
              {/* Preview de la foto */}
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {fotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Input de archivo */}
              <div>
                <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-block">
                  <span className="text-sm text-gray-700">Subir foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG o GIF. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información Adicional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Año de Fundación */}
              <div>
                <label htmlFor="ano_fundacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Año de Fundación
                </label>
                <input
                  type="text"
                  id="ano_fundacion"
                  name="ano_fundacion"
                  value={formData.ano_fundacion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="2020"
                  maxLength={4}
                />
              </div>

              {/* Tamaño del Despacho */}
              <div>
                <label htmlFor="tamano_despacho" className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño del Despacho
                </label>
                <select
                  id="tamano_despacho"
                  name="tamano_despacho"
                  value={formData.tamano_despacho}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  <option value="pequeño">Pequeño (1-5 abogados)</option>
                  <option value="mediano">Mediano (6-20 abogados)</option>
                  <option value="grande">Grande (21-50 abogados)</option>
                  <option value="muy_grande">Muy Grande (50+ abogados)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : (
                'Guardar Nueva Sede'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
