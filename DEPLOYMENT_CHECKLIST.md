# 🚀 Checklist de Deployment a Vercel

## ✅ Pre-deployment (Completado)

- [x] Build exitoso localmente (`pnpm build`)
- [x] No hay errores de TypeScript
- [x] No hay errores de ESLint críticos
- [x] Commit de todos los cambios
- [x] Push a GitHub (branch: master)

## 📋 Configuración en Vercel Dashboard

### 1. Variables de Entorno

Ve a: **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**

Copia todas las variables de `.env.vercel.template`:

#### Supabase (CRÍTICO)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Resend Email (CRÍTICO)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_ADMIN_EMAIL`

#### URLs (ACTUALIZAR)
- `NEXT_PUBLIC_APP_URL` → `https://lexhoy.com`
- `NEXT_PUBLIC_BASE_URL` → `https://lexhoy.com`

#### WordPress (CRÍTICO)
- `WORDPRESS_API_URL`
- `WORDPRESS_API_USERNAME`
- `WORDPRESS_API_PASSWORD`

#### Algolia (CRÍTICO)
- `ALGOLIA_APP_ID`
- `ALGOLIA_ADMIN_API_KEY`
- `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`
- `ALGOLIA_INDEX_NAME`

#### Otras
- `NODE_ENV` → `production`

### 2. Build & Development Settings

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Node Version**: 20.x (recomendado)

### 3. Dominio

1. Ve a: **Settings → Domains**
2. Agrega tu dominio: `lexhoy.com`
3. Configura los DNS records según las instrucciones de Vercel
4. Espera la propagación (puede tardar hasta 48h)

### 4. Deployment

1. Ve a: **Deployments**
2. Click en **Redeploy** (o push nuevo commit)
3. Espera que el deployment complete
4. Verifica que el build sea exitoso

## 🧪 Post-deployment Testing

### Funcionalidades Críticas a Probar

- [ ] **Login/Registro**: Autenticación con Supabase
- [ ] **Crear Despacho**: Formulario completo con sedes
- [ ] **Upload de Imágenes**: Supabase Storage funcionando
- [ ] **Visualizar Despachos**: Lista de despachos propios
- [ ] **Sincronización WordPress**: Crear despacho y verificar en WordPress
- [ ] **Búsqueda**: Algolia indexando correctamente
- [ ] **Notificaciones Email**: Resend enviando emails
- [ ] **CSP**: No hay errores de Content Security Policy en consola

### URLs para Probar

```
https://lexhoy.com
https://lexhoy.com/login
https://lexhoy.com/register
https://lexhoy.com/dashboard
https://lexhoy.com/dashboard/despachos/crear
https://lexhoy.com/dashboard/despachos/mis-despachos
https://lexhoy.com/dashboard/despachos/ver-despachos
```

## 🔍 Debugging en Producción

### Ver Logs en Tiempo Real
```bash
vercel logs <deployment-url> --follow
```

### Ver Logs por Función
```bash
vercel logs <deployment-url> --output=raw
```

### Ver Build Logs
Ve a: **Vercel Dashboard → Deployments → Click en el deployment → View Build Logs**

## 🚨 Troubleshooting

### Error: "SUPABASE_URL is not defined"
→ Asegúrate de que todas las variables de entorno estén configuradas en Vercel

### Error: "Failed to load images from Supabase"
→ Verifica que el bucket 'despachos-fotos' existe y es público
→ Verifica que `NEXT_PUBLIC_SUPABASE_URL` es correcta

### Error: "WordPress API connection failed"
→ Verifica `WORDPRESS_API_URL`, `WORDPRESS_API_USERNAME` y `WORDPRESS_API_PASSWORD`

### Error: "Algolia indexing failed"
→ Verifica todas las credenciales de Algolia
→ Verifica que el índice 'despachos' existe

### Error: "Email sending failed"
→ Verifica `RESEND_API_KEY`
→ Verifica que el dominio `lexhoy.com` está verificado en Resend

## 📦 Características Implementadas

### ✅ Supabase Storage
- Bucket `despachos-fotos` configurado
- Upload de imágenes optimizadas (WebP, 500x500px)
- URLs públicas persistentes
- No más base64 en database

### ✅ Content Security Policy
- CSP diferenciado por entorno
- Development: Permite WebSockets locales
- Production: Políticas estrictas de seguridad

### ✅ Sincronización
- Next.js ↔ WordPress bidireccional
- Next.js → Algolia automática
- WordPress → Next.js vía webhooks

### ✅ Gestión de Imágenes
- Optimización automática a WebP
- Compresión inteligente (85% calidad)
- Redimensionamiento proporcional
- Preview en tiempo real

## 🎯 Próximos Pasos

1. **Monitorear Errores**: Instalar Sentry o similar
2. **Analíticas**: Configurar Google Analytics
3. **Performance**: Verificar Core Web Vitals
4. **SEO**: Verificar meta tags y sitemap
5. **Backups**: Configurar backups automáticos de Supabase

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica todas las variables de entorno
3. Comprueba que todos los servicios externos están activos
4. Consulta la documentación de Next.js 15 y Vercel

---

**Fecha de Deployment**: Noviembre 17, 2025
**Versión**: 0.1.0
**Branch**: master
**Commit**: 99231bd
