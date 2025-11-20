# Console Warnings - Explicación

## Warnings Normales en Desarrollo

### 1. Clerk Development Keys Warning
```
Clerk: Clerk has been loaded with development keys...
```

**¿Qué es?** Clerk te avisa que estás usando claves de desarrollo.

**¿Es un problema?** No en desarrollo local. Es normal y esperado.

**Solución para producción:** 
- En Vercel, configura las variables de entorno de producción con tus claves de producción de Clerk
- Las claves de desarrollo tienen límites de uso, pero son perfectas para desarrollo local

### 2. Content Security Policy (CSP) - Vercel Live
```
Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' violates...
```

**¿Qué es?** Vercel Live (herramienta de feedback) intenta cargar pero es bloqueada por CSP.

**¿Es un problema?** No. Es solo una herramienta de desarrollo de Vercel.

**Solución (opcional):**
Si quieres usar Vercel Live, añade a tu CSP en `next.config.ts`:
```typescript
'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://*.clerk.accounts.dev", "https://challenges.cloudflare.com", "https://vercel.live"]
```

### 3. Click-to-Component
```
[click-to-component-browser] enabled
```

**¿Qué es?** Herramienta de desarrollo que te permite hacer click en componentes para abrir su código.

**¿Es un problema?** No. Solo aparece en desarrollo.

**Solución:** No requiere acción. Se desactiva automáticamente en producción.

## Warnings Resueltos ✅

- ✅ **Logs de debug de Supabase** - Eliminados
- ✅ **Múltiples instancias de Supabase** - Optimizado para usar cliente singleton

## Resumen

Los warnings restantes son **normales en desarrollo** y no afectan la funcionalidad. En producción, la mayoría desaparecerán automáticamente.
