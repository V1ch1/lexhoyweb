'use client';

import { useState, useEffect } from 'react';
import CookieSettings from './CookieSettings';

export default function CookieButton() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar el botón después de un pequeño delay
    setTimeout(() => setIsVisible(true), 2000);

    // Escuchar evento para abrir configuración
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('openCookieSettings', handleOpenSettings);

    return () => {
      window.removeEventListener('openCookieSettings', handleOpenSettings);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 left-6 z-40 group"
        aria-label="Configurar cookies"
        title="Configurar cookies"
      >
        <div className="relative">
          {/* Botón principal */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              🍪 Configurar cookies
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        </div>
      </button>

      {/* Modal de configuración */}
      <CookieSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
