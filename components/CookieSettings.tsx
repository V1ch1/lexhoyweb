'use client';

import { useState, useEffect } from 'react';
import { CookieService, type CookiePreferences } from '@/lib/services/cookieService';

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookieSettings({ isOpen, onClose }: CookieSettingsProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(
    CookieService.getDefaultPreferences()
  );

  useEffect(() => {
    if (isOpen) {
      setPreferences(CookieService.getPreferences());
    }
  }, [isOpen]);

  const handleSave = () => {
    CookieService.savePreferences(preferences);
    onClose();
  };

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // No se puede desactivar
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🍪 Configuración de Cookies
              </h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-white/90 text-sm mt-2">
              Gestiona tus preferencias de cookies. Puedes cambiarlas en cualquier momento.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Cookies Esenciales */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">🔒</span>
                    Cookies Esenciales
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Necesarias para el funcionamiento básico del sitio (autenticación, sesión, seguridad).
                    No se pueden desactivar.
                  </p>
                </div>
                <div className="ml-4">
                  <div className="relative inline-block w-12 h-6 bg-green-500 rounded-full cursor-not-allowed opacity-50">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookies de Analítica */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Cookies de Analítica
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Nos ayudan a entender cómo usas el sitio para mejorarlo (Google Analytics).
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('analytics')}
                    className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                      preferences.analytics ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.analytics ? 'right-1' : 'left-1'
                      }`}
                    ></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cookies de Marketing */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Cookies de Marketing
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Permiten mostrarte contenido y anuncios relevantes basados en tus intereses.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('marketing')}
                    className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                      preferences.marketing ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        preferences.marketing ? 'right-1' : 'left-1'
                      }`}
                    ></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Nota:</strong> Por defecto, todas las cookies están activas para ofrecerte la mejor experiencia.
                Puedes desactivar las que no desees en cualquier momento.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all"
              >
                💾 Guardar Preferencias
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
