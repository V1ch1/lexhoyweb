# 🚀 Guía Rápida: Subir a Vercel

## ⚠️ Problema Actual

El build falla porque `EmailService` requiere `RESEND_API_KEY` en tiempo de compilación.

```
Error: Neither apiKey nor config.authenticator provided
```

## ✅ Solución

### Opción 1: Añadir RESEND_API_KEY (Recomendado)

Añade esta variable a tu `.env.local`:

```bash
RESEND_API_KEY=tu_clave_de_resend_aqui
```

Luego ejecuta:
```bash
pnpm run build
```

### Opción 2: Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Añade `RESEND_API_KEY` con tu clave
4. Haz push a tu repositorio

```bash
git add .
git commit -m "feat: añadir cron job y notificación despacho_asignado"
git push
```

Vercel construirá automáticamente con las variables de entorno configuradas.

---

## 📝 Cambios Realizados (Listos para Deploy)

### 1. ✅ Cron Job Configurado
- Archivo: `vercel.json`
- Ejecuta `/api/cron/daily-summary` cada hora
- Vercel lo activará automáticamente en producción

### 2. ✅ Notificación Añadida
- Archivo: `lib/userService.ts`
- Nueva notificación: `despacho_asignado`
- Se crea cuando se asigna un despacho a un usuario

### 3. ✅ Dependencia Stripe
- Instalada correctamente
- Ya está en `package.json`

---

## 🔄 Proceso de Deploy

```bash
# 1. Asegúrate de que todo está commiteado
git status

# 2. Añade los cambios
git add .

# 3. Commit
git commit -m "feat: sistema de notificaciones optimizado + cron job"

# 4. Push a tu rama
git push

# 5. Vercel detectará el push y hará el deploy automáticamente
```

---

## ✅ Verificación Post-Deploy

Después del deploy, verifica:

1. **Cron Job**: En Vercel → Settings → Cron Jobs
   - Debería aparecer `/api/cron/daily-summary`
   - Schedule: `0 * * * *` (cada hora)

2. **Variables de Entorno**: En Vercel → Settings → Environment Variables
   - `RESEND_API_KEY` debe estar configurada
   - `NEXT_PUBLIC_SUPABASE_URL` debe estar configurada
   - `SUPABASE_SERVICE_ROLE_KEY` debe estar configurada

3. **Notificaciones**: Prueba asignando un despacho a un usuario
   - Debería crear una notificación de tipo `despacho_asignado`

---

## 🐛 Si el Build Falla en Vercel

Si el build falla en Vercel con el mismo error:

1. Ve a Vercel → Settings → Environment Variables
2. Añade `RESEND_API_KEY` con tu clave de Resend
3. Redeploy: Deployments → ... → Redeploy

---

## 📊 Resumen de Archivos Modificados

```
✅ vercel.json                    - Cron job añadido
✅ lib/userService.ts             - Notificación despacho_asignado
✅ package.json                   - Stripe añadido
✅ supabase/migrations/           - 2 migraciones aplicadas
```

**Total:** 4 archivos modificados, listos para producción.
