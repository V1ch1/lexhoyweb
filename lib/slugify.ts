/**
 * Decodifica entidades HTML antes de procesar
 */
function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined') {
    // En el servidor, hacer un reemplazo básico
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#8211;/g, '-')
      .replace(/&#8212;/g, '-')
      .replace(/&ndash;/g, '-')
      .replace(/&mdash;/g, '-');
  }
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Convierte un texto en un slug URL-friendly
 * @param text - El texto a convertir en slug
 * @returns El slug generado
 */
export function slugify(text: string): string {
  // Primero decodificar entidades HTML
  const decoded = decodeHtmlEntities(text);
  
  return decoded
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/&/g, '-y-') // Reemplazar & con -y-
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/--+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-+/, '') // Eliminar guiones al inicio
    .replace(/-+$/, ''); // Eliminar guiones al final
}

/**
 * Genera un slug único añadiendo un sufijo si es necesario
 * @param baseSlug - El slug base
 * @param existingSlugs - Array de slugs existentes
 * @returns Un slug único
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}
