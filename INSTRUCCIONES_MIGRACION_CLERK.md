# 🚀 INSTRUCCIONES MIGRACIÓN A CLERK

## ✅ Progreso Actual

### Completado:

- ✅ Backup de usuarios creado en `scripts/backups/`
- ✅ @clerk/nextjs instalado
- ✅ Variables de entorno configuradas en `.env.local`
- ✅ ClerkProvider agregado al layout
- ✅ Middleware de Clerk configurado
- ✅ Páginas de sign-in y sign-up creadas
- ✅ Webhook de Clerk a Supabase implementado
- ✅ Navbar actualizado con componentes de Clerk

### Pendiente:

- ⏳ Migrar schema de base de datos
- ⏳ Configurar webhook en Clerk Dashboard
- ⏳ Probar registro
- ⏳ Load test

---

## 📋 PASO 1: Migrar Schema en Supabase

### 1.1 Acceder a Supabase SQL Editor

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: **oepcitgbnqylfpdryffx**
3. En el menú lateral, click en **SQL Editor**

### 1.2 Ejecutar Script de Migración

1. Crea un nuevo Query
2. Copia **TODO** el contenido del archivo:
   ```
   database/migrations/002_migrate_users_to_clerk.sql
   ```
3. Pega en el editor
4. Click en **Run** o presiona `Ctrl + Enter`

### 1.3 Verificar Migración

Deberías ver mensajes como:

```sql
✅ CREATE TABLE users_backup_pre_clerk
✅ ALTER TABLE users ALTER COLUMN id TYPE TEXT
✅ ALTER TABLE users ADD COLUMN clerk_id
✅ ALTER TABLE user_despachos ALTER COLUMN user_id TYPE TEXT
```

---

## 📋 PASO 2: Configurar Webhook en Clerk

### 2.1 Acceder a Webhooks en Clerk

1. Ve a https://dashboard.clerk.com
2. Selecciona tu aplicación **LexHoy Despachos**
3. En el menú lateral: **Webhooks** → **+ Add Endpoint**

### 2.2 Configurar Endpoint

**Endpoint URL:**

```
https://despachos.lexhoy.com/api/webhooks/clerk
```

**Subscribe to events:**

- ✅ `user.created`
- ✅ `user.updated`
- ✅ `user.deleted`

Click **Create**

### 2.3 Obtener Signing Secret

1. Después de crear el webhook, verás el **Signing Secret**
2. Cópialo (empieza con `whsec_...`)
3. Agrégalo a `.env.local`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 📋 PASO 3: Configurar Variables en Vercel

### 3.1 Acceder a Variables de Entorno

1. Ve a https://vercel.com
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**

### 3.2 Agregar Variables de Clerk

Agrega estas 3 variables:

| Key                                 | Value                                                     | Environments                     |
| ----------------------------------- | --------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_aW5maW5pdGUtYm9hLTE5LmNsZXJrLmFjY291bnRzLmRldiQ` | Production, Preview, Development |
| `CLERK_SECRET_KEY`                  | `sk_test_2Om575Pt5oZR126bYaZj3zlD8FRKmG9lHBtbxEeyPO`      | Production, Preview, Development |
| `CLERK_WEBHOOK_SECRET`              | `whsec_xxxxx` (el que copiaste)                           | Production, Preview, Development |

### 3.3 Re-deploy

Después de agregar las variables, haz un nuevo deploy:

```bash
git add .
git commit -m "feat: migración a Clerk completada"
git push origin main
```

---

## 📋 PASO 4: Probar Localmente

### 4.1 Iniciar Desarrollo

```bash
cd lexhoyweb
pnpm dev
```

### 4.2 Probar Registro

1. Ve a http://localhost:3000/sign-up
2. Registra un usuario de prueba
3. Verifica email (Clerk envía confirmación)
4. Confirma que el usuario aparece en Supabase:
   ```sql
   SELECT * FROM users ORDER BY fecha_registro DESC LIMIT 5;
   ```

### 4.3 Probar Login

1. Ve a http://localhost:3000/sign-in
2. Inicia sesión con el usuario de prueba
3. Deberías ser redirigido a `/dashboard`

---

## 📋 PASO 5: Actualizar URLs en Clerk (Producción)

### 5.1 Configurar URLs Autorizadas

En Clerk Dashboard → **Paths**:

**Sign in URL:**

```
https://despachos.lexhoy.com/sign-in
```

**Sign up URL:**

```
https://despachos.lexhoy.com/sign-up
```

**After sign in:**

```
https://despachos.lexhoy.com/dashboard
```

**After sign up:**

```
https://despachos.lexhoy.com/dashboard
```

### 5.2 Authorized Domains

Agregar:

- `localhost:3000` (desarrollo)
- `despachos.lexhoy.com` (producción)

---

## 🔍 VERIFICACIÓN POST-MIGRACIÓN

### Checklist:

- [ ] ✅ Script SQL ejecutado sin errores
- [ ] ✅ Webhook configurado en Clerk
- [ ] ✅ Variables en Vercel agregadas
- [ ] ✅ App desplegada en Vercel
- [ ] ✅ Registro funciona localmente
- [ ] ✅ Login funciona localmente
- [ ] ✅ Usuario se crea en Supabase automáticamente
- [ ] ✅ Registro funciona en producción
- [ ] ✅ No hay límite de rate en emails

---

## 🚨 TROUBLESHOOTING

### Error: "Missing svix headers"

- Verifica que `CLERK_WEBHOOK_SECRET` esté en `.env.local`
- Verifica que el webhook esté configurado en Clerk Dashboard

### Error: "Cannot find clerk_id"

- La columna se agrega automáticamente en el webhook
- Verifica que el script SQL se haya ejecutado correctamente

### Usuario no se crea en Supabase

1. Verifica logs del webhook en Clerk Dashboard
2. Verifica logs en Vercel (Functions)
3. Verifica que la URL del webhook sea correcta

### Emails no llegan

- Clerk maneja emails automáticamente
- No hay límite de rate (problema resuelto ✅)
- Verifica en Clerk Dashboard → Users → Email logs

---

## 📞 PRÓXIMOS PASOS

Una vez completados todos los pasos:

1. Notificar a tu equipo (5 usuarios) que deben re-registrarse
2. Probar con usuarios reales
3. Ejecutar load test con 50 usuarios
4. Monitorear logs por 24-48 horas
5. Eliminar código antiguo de Supabase Auth

---

## 🎉 BENEFICIOS POST-MIGRACIÓN

✅ **Sin límite de emails** - 10,000 usuarios/mes gratis
✅ **Email verification** - Seguridad mantenida
✅ **Mejor UX** - Componentes pre-diseñados
✅ **OAuth social** - Google, GitHub, etc. (opcional)
✅ **$0/mes** - Hasta 10,000 usuarios activos
✅ **Escalabilidad** - Ready para marketing campaign

---

**Estado actual**: Código listo, falta ejecutar migraciones y configurar webhooks
**Tiempo estimado**: 15-20 minutos para completar pasos restantes
