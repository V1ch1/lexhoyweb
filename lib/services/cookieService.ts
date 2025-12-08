/**
 * Servicio de gestión de cookies y consentimiento
 * Enfoque: Opt-out (todas activas por defecto)
 */

export interface CookiePreferences {
  essential: boolean;    // Siempre true (no se puede desactivar)
  analytics: boolean;    // Google Analytics
  marketing: boolean;    // Marketing y remarketing
  timestamp: string;
  version: string;       // Para futuras actualizaciones de política
}

const PREFERENCES_KEY = 'lexhoy_cookie_preferences';
const CURRENT_VERSION = '1.0';

export class CookieService {
  /**
   * Obtener preferencias por defecto (todas activas)
   */
  static getDefaultPreferences(): CookiePreferences {
    return {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
  }

  /**
   * Obtener preferencias actuales del usuario
   */
  static getPreferences(): CookiePreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (!stored) {
        return this.getDefaultPreferences();
      }

      const prefs = JSON.parse(stored) as CookiePreferences;
      
      // Si la versión cambió, resetear a defaults
      if (prefs.version !== CURRENT_VERSION) {
        return this.getDefaultPreferences();
      }

      return prefs;
    } catch (error) {
      console.error('Error leyendo preferencias de cookies:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Guardar preferencias del usuario
   */
  static savePreferences(prefs: Partial<CookiePreferences>): void {
    if (typeof window === 'undefined') return;

    try {
      const current = this.getPreferences();
      const updated: CookiePreferences = {
        ...current,
        ...prefs,
        essential: true, // Siempre true
        timestamp: new Date().toISOString(),
        version: CURRENT_VERSION,
      };

      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));

      // Aplicar cambios inmediatamente
      this.applyPreferences(updated);
    } catch (error) {
      console.error('Error guardando preferencias de cookies:', error);
    }
  }

  /**
   * Verificar si el usuario ya vio el banner
   */
  static hasSeenBanner(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PREFERENCES_KEY) !== null;
  }

  /**
   * Marcar que el usuario vio el banner
   */
  static markBannerSeen(): void {
    if (typeof window === 'undefined') return;
    
    // Si no hay preferencias guardadas, guardar las por defecto
    if (!this.hasSeenBanner()) {
      this.savePreferences(this.getDefaultPreferences());
    }
  }

  /**
   * Aplicar preferencias (activar/desactivar servicios)
   */
  static applyPreferences(prefs: CookiePreferences): void {
    if (typeof window === 'undefined') return;

    // Google Analytics
    if (prefs.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    // Marketing (por ahora solo log, implementar según necesidad)
    if (prefs.marketing) {
      console.log('✅ Marketing cookies enabled');
    } else {
      console.log('❌ Marketing cookies disabled');
      this.clearMarketingCookies();
    }
  }

  /**
   * Activar Google Analytics
   */
  private static enableAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Habilitar gtag
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  }

  /**
   * Desactivar Google Analytics
   */
  private static disableAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Deshabilitar gtag
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }

    // Limpiar cookies de GA
    this.clearAnalyticsCookies();
  }

  /**
   * Limpiar cookies de Google Analytics
   */
  private static clearAnalyticsCookies(): void {
    if (typeof window === 'undefined') return;

    const gaCookies = ['_ga', '_gat', '_gid'];
    gaCookies.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  /**
   * Limpiar cookies de marketing
   */
  private static clearMarketingCookies(): void {
    if (typeof window === 'undefined') return;

    // Añadir aquí las cookies de marketing que uses
    const marketingCookies = ['_fbp', '_fbc']; // Ejemplo: Facebook Pixel
    marketingCookies.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  /**
   * Resetear todas las preferencias
   */
  static reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PREFERENCES_KEY);
  }
}

// Tipos para window.gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}
