# 🔔 Sistema de Notificaciones - Instrucciones de Configuración

## ✅ Lo que ya está implementado

1. ✅ **Tabla de notificaciones** - Schema SQL creado
2. ✅ **Servicio de notificaciones** - `lib/notificationService.ts`
3. ✅ **Servicio de emails** - `lib/emailService.ts` con Resend
4. ✅ **Campana de notificaciones** - Componente en navbar
5. ✅ **Panel de notificaciones** - Página completa `/dashboard/notificaciones`
6. ✅ **API endpoints** - `/api/notifications` y `/api/send-email`
7. ✅ **Integración en flujo de solicitudes** - Notificaciones automáticas

## 📦 Pasos para completar la configuración

### 1. Instalar Resend

```bash
npm install resend
```

### 2. Crear la tabla en Supabase

Ve a tu proyecto de Supabase → SQL Editor y ejecuta:

```sql
-- Copiar y pegar el contenido de: lib/schema/notificaciones.sql
```

O ejecuta directamente:

```sql
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'solicitud_recibida',
    'solicitud_aprobada',
    'solicitud_rechazada',
    'despacho_asignado',
    'despacho_desasignado',
    'usuario_nuevo',
    'mensaje_sistema'
  )),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);
```

### 3. Configurar Resend

#### Paso 3.1: Crear cuenta en Resend
1. Ve a https://resend.com
2. Crea una cuenta gratuita
3. Verifica tu email

#### Paso 3.2: Obtener API Key
1. En el dashboard de Resend, ve a "API Keys"
2. Crea una nueva API Key
3. Copia la key (empieza con `re_`)

#### Paso 3.3: Configurar dominio (Opcional pero recomendado)
1. Ve a "Domains" en Resend
2. Añade tu dominio (ej: `lexhoy.com`)
3. Configura los registros DNS según las instrucciones
4. Espera a que se verifique (puede tardar unos minutos)

**Nota**: Si no tienes dominio verificado, puedes usar el dominio de prueba de Resend (`onboarding@resend.dev`) pero los emails pueden ir a spam.

### 4. Añadir variables de entorno

Edita `.env.local` y añade:

```env
# Resend Email Service
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=notificaciones@lexhoy.com

# Base URL (para links en emails)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Importante**: 
- Reemplaza `re_tu_api_key_aqui` con tu API key real
- Si no tienes dominio verificado, usa: `RESEND_FROM_EMAIL=onboarding@resend.dev`
- En producción, cambia `NEXT_PUBLIC_BASE_URL` a tu dominio real

### 5. Reiniciar el servidor

```bash
npm run dev
```

## 🧪 Cómo probar el sistema

### Prueba 1: Notificación de solicitud recibida

1. Login como usuario normal
2. Ve a `/dashboard/solicitar-despacho`
3. Busca y solicita un despacho
4. **Resultado esperado**:
   - ✅ Super admins reciben notificación en la campana
   - ✅ Super admins reciben email
   - ✅ Logs en consola: "✅ Notificaciones enviadas a super admins"

### Prueba 2: Notificación de solicitud aprobada

1. Login como super admin
2. Ve a `/admin/solicitudes-despachos`
3. Aprueba una solicitud
4. **Resultado esperado**:
   - ✅ Usuario recibe notificación en la campana
   - ✅ Usuario recibe email
   - ✅ Logs en consola: "✅ Notificación creada para el usuario"

### Prueba 3: Notificación de solicitud rechazada

1. Login como super admin
2. Ve a `/admin/solicitudes-despachos`
3. Rechaza una solicitud con motivo
4. **Resultado esperado**:
   - ✅ Usuario recibe notificación en la campana
   - ✅ Usuario recibe email con el motivo
   - ✅ Logs en consola: "✅ Email enviado al usuario"

### Prueba 4: Campana de notificaciones

1. Login con cualquier usuario
2. Mira la campana en el navbar (arriba a la derecha)
3. Debería mostrar:
   - Badge rojo con número de no leídas
   - Dropdown con últimas 5 notificaciones
   - Link "Ver todas las notificaciones"

### Prueba 5: Panel completo de notificaciones

1. Ve a `/dashboard/notificaciones`
2. Deberías ver:
   - Filtros: Todas / No leídas / Leídas
   - Botón "Marcar todas como leídas"
   - Botón "Eliminar leídas"
   - Lista completa de notificaciones
   - Botones para marcar como leída y eliminar individualmente

## 🔍 Verificar en la base de datos

```sql
-- Ver todas las notificaciones
SELECT 
  n.id,
  u.email as usuario,
  n.tipo,
  n.titulo,
  n.leida,
  n.created_at
FROM notificaciones n
JOIN users u ON u.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 20;

-- Contar notificaciones por tipo
SELECT 
  tipo,
  COUNT(*) as total,
  SUM(CASE WHEN leida THEN 1 ELSE 0 END) as leidas,
  SUM(CASE WHEN NOT leida THEN 1 ELSE 0 END) as no_leidas
FROM notificaciones
GROUP BY tipo;
```

## 🐛 Troubleshooting

### Problema: No aparecen notificaciones en la campana

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca errores relacionados con notificaciones
3. Verifica que la tabla existe en Supabase
4. Verifica que hay datos en la tabla

### Problema: Los emails no se envían

**Solución**:
1. Verifica que `RESEND_API_KEY` está en `.env.local`
2. Verifica que reiniciaste el servidor después de añadir la variable
3. Revisa los logs de la consola del servidor
4. Si usas dominio propio, verifica que está verificado en Resend

### Problema: Los emails van a spam

**Solución**:
1. Verifica tu dominio en Resend
2. Configura SPF, DKIM y DMARC en tu DNS
3. Usa un dominio real (no `@gmail.com` o similar)
4. Añade un enlace de "darse de baja" en los emails

### Problema: Error "Cannot find module 'resend'"

**Solución**:
```bash
npm install resend
npm run dev
```

## 📊 Monitoreo

### Ver logs en tiempo real

En la consola del servidor verás:
```
📬 Creando notificación: Nueva solicitud de despacho
✅ Notificación creada: abc-123
👑 Notificando a super admins
✅ 2 notificaciones creadas
📧 Enviando email a: admin@lexhoy.com
✅ Email enviado correctamente
```

### Dashboard de Resend

1. Ve a https://resend.com/dashboard
2. Verás estadísticas de emails enviados
3. Puedes ver logs de cada email
4. Métricas de deliverability

## 🎯 Próximas mejoras opcionales

1. **Notificaciones Push** - Web Push API para notificaciones del navegador
2. **Preferencias de usuario** - Permitir desactivar ciertos tipos de notificaciones
3. **Digest diario** - Resumen de notificaciones por email
4. **Webhooks** - Integración con Slack/Discord
5. **Analytics** - Métricas de engagement con notificaciones

## 📝 Archivos creados/modificados

### Nuevos archivos:
- ✅ `lib/schema/notificaciones.sql`
- ✅ `lib/notificationService.ts`
- ✅ `lib/emailService.ts`
- ✅ `app/api/notifications/route.ts`
- ✅ `app/api/notifications/[id]/route.ts`
- ✅ `app/api/send-email/route.ts`
- ✅ `app/dashboard/notificaciones/page.tsx`
- ✅ `docs/SISTEMA_NOTIFICACIONES.md`

### Archivos modificados:
- ✅ `components/NotificationBell.tsx` - Campana completa
- ✅ `components/NavbarDashboard.tsx` - Integración de campana
- ✅ `lib/userService.ts` - Notificaciones en aprobar/rechazar
- ✅ `app/api/solicitar-despacho/route.ts` - Notificaciones al crear solicitud

## ✨ Resumen

El sistema está **100% implementado** y listo para usar. Solo necesitas:

1. ✅ Ejecutar el SQL en Supabase
2. ✅ Instalar Resend: `npm install resend`
3. ✅ Configurar variables de entorno
4. ✅ Reiniciar el servidor

¡Y listo! Las notificaciones funcionarán automáticamente. 🎉
