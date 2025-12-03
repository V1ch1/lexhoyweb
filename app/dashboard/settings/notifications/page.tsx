'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotificationPreferences {
  email_new_lead: boolean;
  email_lead_purchased: boolean;
  email_solicitud_status: boolean;
  email_despacho_changes: boolean;
  email_marketing: boolean;
  especialidades_interes: string[] | null;
  precio_min: number | null;
  precio_max: number | null;
  solo_alta_urgencia: boolean;
  resumen_diario: boolean;
  hora_resumen: string;
}

const ESPECIALIDADES_DISPONIBLES = [
  'Civil',
  'Penal',
  'Laboral',
  'Mercantil',
  'Administrativo',
  'Fiscal',
  'Familia',
  'Inmobiliario',
  'Extranjería',
  'Propiedad Intelectual',
];

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_new_lead: true,
    email_lead_purchased: true,
    email_solicitud_status: true,
    email_despacho_changes: true,
    email_marketing: false,
    especialidades_interes: null,
    precio_min: null,
    precio_max: null,
    solo_alta_urgencia: false,
    resumen_diario: false,
    hora_resumen: '09:00',
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          email_new_lead: data.email_new_lead,
          email_lead_purchased: data.email_lead_purchased,
          email_solicitud_status: data.email_solicitud_status,
          email_despacho_changes: data.email_despacho_changes,
          email_marketing: data.email_marketing,
          especialidades_interes: data.especialidades_interes,
          precio_min: data.precio_min,
          precio_max: data.precio_max,
          solo_alta_urgencia: data.solo_alta_urgencia,
          resumen_diario: data.resumen_diario,
          hora_resumen: data.hora_resumen?.substring(0, 5) || '09:00',
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast.success('✅ Preferencias guardadas correctamente');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleEspecialidad = (especialidad: string) => {
    setPreferences((prev) => {
      const current = prev.especialidades_interes || [];
      const isSelected = current.includes(especialidad);
      
      return {
        ...prev,
        especialidades_interes: isSelected
          ? current.filter((e) => e !== especialidad)
          : [...current, especialidad],
      };
    });
  };

  const clearEspecialidades = () => {
    setPreferences((prev) => ({
      ...prev,
      especialidades_interes: null,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h1 className="text-2xl font-bold text-gray-900">
            ⚙️ Preferencias de Notificaciones
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Configura cómo y cuándo quieres recibir notificaciones por email
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8">
          {/* Notificaciones Básicas de Leads */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📊</span>
              Notificaciones de Leads
            </h2>
            <div className="space-y-4">
              <PreferenceToggle
                label="Nuevos leads disponibles"
                description="Recibe un email cuando haya un nuevo lead disponible"
                checked={preferences.email_new_lead}
                onChange={() => togglePreference('email_new_lead')}
              />
              <PreferenceToggle
                label="Leads comprados"
                description="Recibe un email cuando compres un lead con los datos del cliente"
                checked={preferences.email_lead_purchased}
                onChange={() => togglePreference('email_lead_purchased')}
              />
            </div>
          </div>

          {/* Filtros Avanzados de Leads */}
          {preferences.email_new_lead && (
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                Filtros Avanzados de Leads
              </h2>
              
              {/* Especialidades */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-900">
                    Especialidades de Interés
                  </label>
                  {preferences.especialidades_interes && preferences.especialidades_interes.length > 0 && (
                    <button
                      onClick={clearEspecialidades}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {preferences.especialidades_interes === null || preferences.especialidades_interes.length === 0
                    ? 'Recibirás notificaciones de todas las especialidades'
                    : `Solo recibirás notificaciones de: ${preferences.especialidades_interes.join(', ')}`}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ESPECIALIDADES_DISPONIBLES.map((esp) => {
                    const isSelected = preferences.especialidades_interes?.includes(esp) || false;
                    return (
                      <button
                        key={esp}
                        onClick={() => toggleEspecialidad(esp)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {esp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rango de Precios */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-900 block mb-3">
                  Rango de Precios
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {preferences.precio_min === null && preferences.precio_max === null
                    ? 'Sin filtro de precio (todos los leads)'
                    : `Solo leads entre ${preferences.precio_min || 0}€ y ${preferences.precio_max || '∞'}€`}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Precio Mínimo (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={preferences.precio_min || ''}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          precio_min: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      placeholder="Sin mínimo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Precio Máximo (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={preferences.precio_max || ''}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          precio_max: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      placeholder="Sin máximo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Urgencia */}
              <div className="mb-6">
                <PreferenceToggle
                  label="Solo leads de alta urgencia"
                  description="Recibe solo notificaciones de leads marcados como urgentes o de alta prioridad"
                  checked={preferences.solo_alta_urgencia}
                  onChange={() => togglePreference('solo_alta_urgencia')}
                />
              </div>

              {/* Resumen Diario */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <PreferenceToggle
                  label="📅 Resumen diario"
                  description="En lugar de emails individuales, recibe un resumen diario con todos los leads del día"
                  checked={preferences.resumen_diario}
                  onChange={() => togglePreference('resumen_diario')}
                />
                {preferences.resumen_diario && (
                  <div className="mt-4 ml-8">
                    <label className="text-sm font-medium text-gray-900 block mb-2">
                      Hora del resumen
                    </label>
                    <input
                      type="time"
                      value={preferences.hora_resumen}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          hora_resumen: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Recibirás un email diario a las {preferences.hora_resumen}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notificaciones de Despacho */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🏢</span>
              Notificaciones de Despacho
            </h2>
            <div className="space-y-4">
              <PreferenceToggle
                label="Estado de solicitudes"
                description="Recibe emails sobre el estado de tus solicitudes de despacho (aprobadas, rechazadas)"
                checked={preferences.email_solicitud_status}
                onChange={() => togglePreference('email_solicitud_status')}
              />
              <PreferenceToggle
                label="Cambios de propiedad"
                description="Recibe emails cuando seas asignado o removido como propietario de un despacho"
                checked={preferences.email_despacho_changes}
                onChange={() => togglePreference('email_despacho_changes')}
              />
            </div>
          </div>

          {/* Notificaciones de Marketing */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📧</span>
              Comunicaciones
            </h2>
            <div className="space-y-4">
              <PreferenceToggle
                label="Emails de marketing"
                description="Recibe novedades, consejos y ofertas especiales de LexHoy"
                checked={preferences.email_marketing}
                onChange={() => togglePreference('email_marketing')}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Los cambios se aplicarán inmediatamente
          </p>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm hover:shadow-md"
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              '💾 Guardar Cambios'
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-900">
              💡 Sobre las notificaciones
            </h3>
            <div className="mt-2 text-sm text-blue-800 space-y-2">
              <p>
                <strong>Notificaciones del dashboard:</strong> Siempre estarán activas (campana 🔔)
              </p>
              <p>
                <strong>Filtros inteligentes:</strong> Solo recibirás emails de leads que cumplan TODOS tus filtros
              </p>
              <p>
                <strong>Resumen diario:</strong> Perfecto si recibes muchos leads y prefieres revisarlos una vez al día
              </p>
              <p>
                <strong>Emails de seguridad:</strong> Los emails importantes de seguridad no se pueden desactivar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para cada toggle
function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <button
          type="button"
          onClick={onChange}
          className={`${
            checked ? 'bg-indigo-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          role="switch"
          aria-checked={checked}
        >
          <span
            className={`${
              checked ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>
      <div className="ml-3 flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
