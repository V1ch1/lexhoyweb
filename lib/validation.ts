/**
 * Utilidades de Validación
 * 
 * Funciones para validar datos de entrada en endpoints y formularios
 */

/**
 * Valida que un email tenga formato correcto
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida que un UUID tenga formato correcto
 */
export function validateUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Valida que una URL tenga formato correcto
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza una cadena eliminando caracteres peligrosos
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, ''); // Eliminar event handlers
}

/**
 * Valida que un string no esté vacío
 */
export function validateNotEmpty(str: string): boolean {
  return str.trim().length > 0;
}

/**
 * Valida que un string tenga una longitud mínima
 */
export function validateMinLength(str: string, minLength: number): boolean {
  return str.trim().length >= minLength;
}

/**
 * Valida que un string tenga una longitud máxima
 */
export function validateMaxLength(str: string, maxLength: number): boolean {
  return str.trim().length <= maxLength;
}

/**
 * Valida que un número esté en un rango
 */
export function validateRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Clase de error personalizada para errores de validación
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Valida un objeto con múltiples campos
 */
export function validateFields(
  data: Record<string, unknown>,
  rules: Record<string, (value: unknown) => boolean | string>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const result = rule(value);
    
    if (typeof result === 'string') {
      errors[field] = result;
    } else if (!result) {
      errors[field] = `El campo ${field} no es válido`;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida datos de solicitud de despacho
 */
export function validateSolicitudDespacho(data: {
  userId?: string;
  despachoId?: string;
  mensaje?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.userId || !validateUUID(data.userId)) {
    errors.push('ID de usuario inválido');
  }
  
  if (!data.despachoId || !validateUUID(data.despachoId)) {
    errors.push('ID de despacho inválido');
  }
  
  if (data.mensaje && data.mensaje.length > 500) {
    errors.push('El mensaje no puede exceder 500 caracteres');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida datos de usuario
 */
export function validateUserData(data: {
  email?: string;
  nombre?: string;
  apellidos?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push('Email inválido');
  }
  
  if (!data.nombre || !validateMinLength(data.nombre, 2)) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (!data.apellidos || !validateMinLength(data.apellidos, 2)) {
    errors.push('Los apellidos deben tener al menos 2 caracteres');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
