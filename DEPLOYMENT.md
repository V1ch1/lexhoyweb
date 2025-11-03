# 🚀 Guía de Deployment

Esta guía detalla el proceso completo de deployment del proyecto LexHoy Portal.

---

## 📋 Pre-requisitos

### Cuentas Necesarias
- [ ] Cuenta de Vercel
- [ ] Cuenta de Supabase
- [ ] Cuenta de GitHub
- [ ] Cuenta de Resend (email)
- [ ] Acceso a WordPress API

### Herramientas Locales
- [ ] Node.js 18+ instalado
- [ ] pnpm instalado
- [ ] Git configurado
- [ ] Editor de código (VS Code recomendado)

---

## 🔧 Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/V1ch1/lexhoyweb.git
cd lexhoyweb
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Resend (Email)
RESEND_API_KEY=re_tu-api-key
RESEND_FROM_EMAIL=noreply@lexhoy.com

# WordPress
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despachos
WORDPRESS_USERNAME=tu-usuario
WORDPRESS_APPLICATION_PASSWORD=tu-password

# Algolia (opcional)
NEXT_PUBLIC_ALGOLIA_APP_ID=tu-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=tu-search-key
ALGOLIA_ADMIN_KEY=tu-admin-key

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Configurar Base de Datos

```bash
# Ejecutar migraciones en Supabase
# Ver docs/DATABASE_SCHEMA.md para el schema completo
```

---

## 🏗️ Build Local

### Verificar que Todo Funciona

```bash
# Desarrollo
pnpm dev

# Build de producción
pnpm build

# Ejecutar build localmente
pnpm start
```

### Verificaciones Pre-Deploy

```bash
# Linting
pnpm lint

# Type checking
pnpm type-check

# Tests (si existen)
pnpm test
```

---

## 🌐 Deployment en Vercel

### Opción 1: Deploy Automático (Recomendado)

1. **Conectar con GitHub**
   - Ir a [vercel.com](https://vercel.com)
   - Click en "Import Project"
   - Seleccionar el repositorio `lexhoyweb`

2. **Configurar Variables de Entorno**
   - En Vercel Dashboard → Settings → Environment Variables
   - Añadir todas las variables del `.env.local`
   - Marcar para: Production, Preview, Development

3. **Deploy Automático**
   - Cada push a `main` despliega automáticamente
   - Pull requests crean preview deployments

### Opción 2: Deploy Manual con CLI

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

### Configuración de Vercel

**vercel.json** (ya incluido):
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**next.config.ts** - Configuración importante:
```typescript
{
  // output: 'standalone', // Comentado por problemas en Windows
  typescript: {
    ignoreBuildErrors: false, // ✅ Habilitado
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Habilitado
  }
}
```

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto

1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Guardar las credenciales

### 2. Ejecutar Migraciones

```sql
-- Ver docs/DATABASE_SCHEMA.md para el schema completo
-- Ejecutar en Supabase SQL Editor
```

### 3. Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Ver docs/DATABASE_SCHEMA.md para políticas completas
```

### 4. Configurar Auth

- Habilitar Email/Password authentication
- Configurar redirect URLs
- Configurar email templates

---

## 📧 Configuración de Resend

### 1. Crear Cuenta y API Key

1. Ir a [resend.com](https://resend.com)
2. Crear API key
3. Verificar dominio de email

### 2. Configurar Templates

Los templates están en el código:
- `app/api/send-email/route.ts`

---

## 🔍 Verificación Post-Deploy

### Checklist de Verificación

- [ ] Sitio accesible en URL de producción
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] Solicitudes de despacho funcionan
- [ ] Emails se envían correctamente
- [ ] Sincronización con WordPress funciona
- [ ] No hay errores en consola
- [ ] Headers de seguridad activos

### Comandos de Verificación

```bash
# Verificar headers de seguridad
curl -I https://tu-dominio.vercel.app

# Verificar build
vercel logs

# Verificar variables de entorno
vercel env ls
```

---

## 🔄 Proceso de Deploy Continuo

### Workflow de Git

```bash
# Desarrollo
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
# Vercel crea preview deployment automáticamente

# Después de review y merge a main
# Vercel despliega automáticamente a producción
```

### Branches

- `main` → Producción (auto-deploy)
- `develop` → Staging (preview)
- `feature/*` → Features (preview)
- `fix/*` → Fixes (preview)

---

## 🚨 Rollback

### Si algo sale mal

```bash
# Opción 1: Desde Vercel Dashboard
# Deployments → Seleccionar deployment anterior → Promote to Production

# Opción 2: Desde CLI
vercel rollback

# Opción 3: Git revert
git revert HEAD
git push origin main
```

---

## 📊 Monitoreo

### Vercel Analytics

- Activar en Vercel Dashboard
- Ver métricas de performance
- Revisar errores

### Logs

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver logs de producción
vercel logs --prod

# Ver logs de función específica
vercel logs --function=api/endpoint
```

### Supabase Logs

- Dashboard → Logs
- Ver queries SQL
- Ver errores de autenticación

---

## 🔐 Seguridad en Producción

### Variables de Entorno

- ✅ Nunca commitear `.env.local`
- ✅ Usar Vercel Environment Variables
- ✅ Rotar keys periódicamente
- ✅ Usar diferentes keys para staging/production

### Headers de Seguridad

Ya configurados en `next.config.ts`:
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

---

## 🐛 Troubleshooting

### Build Falla

```bash
# Verificar localmente
pnpm build

# Ver logs detallados
vercel logs --build
```

### Variables de Entorno No Funcionan

```bash
# Verificar que están configuradas
vercel env ls

# Añadir variable
vercel env add VARIABLE_NAME

# Redeploy
vercel --prod
```

### Errores de TypeScript

```bash
# Verificar localmente
pnpm type-check

# Ver errores específicos
pnpm build
```

### Problemas de Supabase

- Verificar URL y keys
- Verificar RLS policies
- Revisar logs en Supabase Dashboard

---

## 📚 Recursos Adicionales

### Documentación
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)

### Soporte
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com

---

## 📞 Contacto

Para problemas de deployment:
- **Email**: dev@lexhoy.com
- **GitHub Issues**: Para bugs y features

---

**Última actualización**: 3 de noviembre de 2025  
**Versión**: 1.0.0
