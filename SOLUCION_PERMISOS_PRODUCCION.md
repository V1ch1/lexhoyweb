# Solución al Problema de Permisos en Producción

## 🔍 Problema Identificado

El proyecto funciona correctamente en local pero falla al crear despachos en producción (despachos.lexhoy.com) con error de "no tengo acceso".

## ❌ Errores Encontrados

### 1. Error en URL de WordPress API (CRÍTICO)
**Archivo:** `.env.production`
**Problema:** URL incorrecta de la API de WordPress
```bash
# ❌ INCORRECTO
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp-v2/despacho

# ✅ CORRECTO
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despacho
```

### 2. Variable de contraseña inconsistente
**Archivo:** `lib/config.ts`
**Problema:** Referencia a variable incorrecta
```typescript
// ❌ INCORRECTO
password: process.env.WORDPRESS_PASSWORD || "",

// ✅ CORRECTO  
password: process.env.WORDPRESS_APPLICATION_PASSWORD || "",
```

## 🔧 Soluciones Implementadas

### 1. Corrección de URL de WordPress API
- ✅ Corregida URL en `.env.production`
- ✅ Corregida referencia de variable en `lib/config.ts`

### 2. Variables de entorno necesarias para Vercel

Asegurar que estas variables estén configuradas en el dashboard de Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://oepcitgbnqylfpdryffx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WordPress (CRÍTICO)
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despacho
WORDPRESS_USERNAME=admin
WORDPRESS_APPLICATION_PASSWORD=PExdZ9XXIam3avERP97uBLeU

# Webhooks
WEBHOOK_AUTH_USER=admin
WEBHOOK_AUTH_PASS=PExdZ9XXIam3avERP97uBLeU
WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# NextAuth
NEXTAUTH_URL=https://despachos.lexhoy.com
NEXTAUTH_SECRET=csQ5MY9paFVvfSRkTBHrePtliG0bDKIxz7y6q48gZwOCnm2UWNo1EXJALj3udh

# Resend (Email)
RESEND_API_KEY=re_...

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=...
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=...
ALGOLIA_ADMIN_KEY=...
```

## 🚀 Pasos para Desplegar la Corrección

### 1. En Vercel Dashboard
1. Ir a https://vercel.com/dashboard
2. Seleccionar el proyecto lexhoyweb
3. Ir a Settings → Environment Variables
4. Verificar que todas las variables estén configuradas correctamente
5. **IMPORTANTE:** Verificar que `WORDPRESS_API_URL` tenga el valor correcto

### 2. Redespliegue
```bash
# Hacer commit de los cambios
git add .
git commit -m "fix: corregir URL de WordPress API en producción"
git push origin main

# O redesplegar desde Vercel
```

### 3. Verificación Post-Despliegue
1. Intentar crear un despacho desde https://despachos.lexhoy.com
2. Revisar logs en Vercel para confirmar que no hay errores de autenticación
3. Verificar que el despacho se sincroniza correctamente con WordPress

## 🔍 Diagnóstico del Problema

### Flujo de Creación de Despachos:
1. **Next.js** (`/api/crear-despacho`) → Crea despacho en Supabase
2. **SyncService** → Envía despacho a WordPress usando REST API
3. **WordPress** → Recibe y guarda el despacho usando el plugin LexHoy-Despachos
4. **WordPress** → Sincroniza con Algolia

### Punto de Falla:
- El paso 2 fallaba porque la URL de WordPress API era incorrecta
- Esto causaba error 404/403 que se interpretaba como "sin acceso"

## 🛠 Herramientas de Debugging

### Para verificar conectividad WordPress:
```javascript
// Endpoint de prueba: /api/test-wordpress
const response = await fetch('/api/test-wordpress');
const result = await response.json();
console.log('WordPress connectivity:', result);
```

### Para revisar logs en producción:
- Vercel Dashboard → Functions → Ver logs de `/api/crear-despacho`
- Buscar errores de red o autenticación

## 📋 Checklist de Verificación

- [x] Corregir URL de WordPress API en `.env.production`
- [x] Corregir variable de contraseña en `lib/config.ts` 
- [ ] Verificar variables en Vercel Dashboard
- [ ] Redesplegar aplicación
- [ ] Probar creación de despacho en producción
- [ ] Verificar sincronización con WordPress
- [ ] Verificar que aparece en Algolia

## 🔗 URLs Importantes

- **Producción:** https://despachos.lexhoy.com
- **WordPress API:** https://lexhoy.com/wp-json/wp/v2/despacho
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Test de creación:** https://despachos.lexhoy.com/dashboard/admin/despachos

---

**Nota:** Después de aplicar estos cambios, el sistema debería funcionar correctamente en producción.