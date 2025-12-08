'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { CookieService } from '@/lib/services/cookieService';

export default function GoogleAnalytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    // Aplicar preferencias al cargar
    const prefs = CookieService.getPreferences();
    CookieService.applyPreferences(prefs);
  }, []);

  // Si no hay ID de GA, no renderizar nada
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          // Configuración inicial con consent mode
          gtag('consent', 'default', {
            'analytics_storage': 'granted',
            'ad_storage': 'granted'
          });

          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
