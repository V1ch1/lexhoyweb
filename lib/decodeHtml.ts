// lib/decodeHtml.ts
// Decodifica entidades HTML simples (SSR-safe)
export function decodeHtml(html: string): string {
  return html
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
