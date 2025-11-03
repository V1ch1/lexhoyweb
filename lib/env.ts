/**
 * Validación de Variables de Entorno
 * 
 * Este módulo valida que todas las variables de entorno requeridas
 * estén configuradas correctamente antes de iniciar la aplicación.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'WORDPRESS_API_URL',
  'WORDPRESS_USERNAME',
  'WORDPRESS_APPLICATION_PASSWORD',
  'NEXT_PUBLIC_BASE_URL',
] as const;

type EnvVar = typeof requiredEnvVars[number];

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @throws Error si falta alguna variable de entorno
 */
export function validateEnv(): void {
  const missing: EnvVar[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    const errorMessage = [
      '❌ Faltan las siguientes variables de entorno requeridas:',
      '',
      ...missing.map(v => `  - ${v}`),
      '',
      '📝 Por favor, configúralas en tu archivo .env.local',
      '',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  console.log('✅ Todas las variables de entorno están configuradas correctamente');
}

/**
 * Obtiene una variable de entorno de forma segura
 * @param key - Nombre de la variable de entorno
 * @returns El valor de la variable o undefined
 */
export function getEnvVar(key: string): string | undefined {
  return process.env[key];
}

/**
 * Obtiene una variable de entorno requerida
 * @param key - Nombre de la variable de entorno
 * @throws Error si la variable no está definida
 * @returns El valor de la variable
 */
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`❌ Variable de entorno requerida no encontrada: ${key}`);
  }
  
  return value;
}

// Validar en desarrollo
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnv();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    // No lanzar error en desarrollo para permitir configuración gradual
  }
}
