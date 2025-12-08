'use client';

import { useState, useEffect } from 'react';
import { CookieService } from '@/lib/services/cookieService';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar banner solo si no lo ha visto antes
    const hasSeenBanner = CookieService.hasSeenBanner();
    if (!hasSeenBanner) {
      // Pequeño delay para mejor UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    CookieService.markBannerSeen();
    setIsVisible(false);
  };

  const handleConfigure = () => {
    CookieService.markBannerSeen();
    setIsVisible(false);
    // Disparar evento para abrir modal de configuración
    window.dispatchEvent(new CustomEvent('openCookieSettings'));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Mensaje */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white text-sm sm:text-base font-medium mb-1">
                🍪 Usamos cookies para mejorar tu experiencia
              </p>
              <p className="text-gray-300 text-xs sm:text-sm">
                Utilizamos cookies esenciales, analíticas y de marketing para ofrecerte la mejor experiencia.
                Puedes gestionar tus preferencias en cualquier momento.
              </p>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleConfigure}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-all"
              >
                Configurar
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
