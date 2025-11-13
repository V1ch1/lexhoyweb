// Configuración de logs para el proyecto

// Desactivar logs verbosos de Supabase
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

// Filtrar logs de Supabase en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log = (...args) => {
    // Filtrar logs de GoTrueClient y otros logs internos de Supabase
    if (args.length > 0 && typeof args[0] === 'string') {
      const logStr = args[0].toString();
      if (
        logStr.includes('GoTrueClient@') ||
        logStr.includes('#_acquireLock') ||
        logStr.includes('#_useSession') ||
        logStr.includes('#__loadSession') ||
        logStr.includes('#getSession()') ||
        logStr.includes('#_autoRefreshTokenTick') ||
        logStr.includes('storage key sb-') ||
        logStr.includes('lock acquired') ||
        logStr.includes('lock released')
      ) {
        return; // Silenciar estos logs
      }
    }
    originalConsole.log.apply(console, args);
  };
}

// Logger personalizado para la aplicación
export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      originalConsole.log('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    originalConsole.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    originalConsole.error('[ERROR]', ...args);
  },
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      originalConsole.log('[DEBUG]', ...args);
    }
  }
};