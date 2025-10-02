# 🔧 Configuración de Variables de Entorno

## Archivo: `.env.local`

Crea o edita el archivo `.env.local` en la raíz del proyecto y agrega:

```bash
# Supabase (ya deberías tenerlas)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Service Role Key (para bypass RLS en notificaciones)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Resend (para emails)
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# WordPress (si las tienes)
NEXT_PUBLIC_WP_USER=tu_usuario
NEXT_PUBLIC_WP_APP_PASSWORD=tu_password
```

## 📧 Cómo Obtener RESEND_API_KEY

### Opción A: Email de Prueba (Rápido - 5 min)

1. Ir a [resend.com](https://resend.com)
2. Crear cuenta gratis
3. Ir a "API Keys"
4. Click "Create API Key"
5. Copiar la key
6. Usar email: `onboarding@resend.dev` (email de prueba de Resend)

```bash
RESEND_API_KEY=re_abc123...
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Opción B: Dominio Propio (Producción - 30 min)

1. Ir a [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Agregar `lexhoy.com`
4. Copiar registros DNS (SPF, DKIM, DMARC)
5. Agregar registros en tu proveedor DNS
6. Esperar verificación (5-10 min)
7. Usar email: `notificaciones@lexhoy.com`

```bash
RESEND_API_KEY=re_abc123...
RESEND_FROM_EMAIL=notificaciones@lexhoy.com
```

## 🔑 Cómo Obtener SUPABASE_SERVICE_ROLE_KEY

1. Ir a Supabase → Settings → API
2. Buscar "service_role key" (secret)
3. Click "Reveal" y copiar
4. **⚠️ IMPORTANTE**: Esta key bypassa RLS, nunca la expongas en el frontend

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔄 Después de Configurar

1. **Reiniciar servidor**:
```bash
Ctrl + C
pnpm dev
```

2. **Probar emails**:
   - Solicitar un despacho
   - Verificar que llega email al super_admin
   - Aprobar solicitud
   - Verificar que llega email al usuario

3. **Verificar logs**:
   - No debe aparecer error 403 en emails
   - No debe aparecer error RLS en notificaciones

## ✅ Verificación

```bash
# Ver variables cargadas (en terminal del servidor)
echo $RESEND_API_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

Si están vacías, el archivo `.env.local` no se está leyendo correctamente.
