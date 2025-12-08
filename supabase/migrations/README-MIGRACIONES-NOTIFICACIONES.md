# Guía de Aplicación de Migraciones

## Migraciones Creadas

Se han creado 2 migraciones SQL para corregir problemas críticos del sistema de notificaciones:

### 1. `20251208_update_notification_types.sql`
Actualiza el constraint de tipos de notificación para permitir los 12 tipos usados en el código.

### 2. `20251208_create_pending_daily_notifications.sql`
Crea la tabla necesaria para el sistema de resúmenes diarios de leads.

---

## Cómo Aplicar las Migraciones

### Opción 1: Supabase CLI (Recomendado)

```bash
# 1. Asegúrate de estar en el directorio del proyecto
cd c:\Users\blanc\Documents\WorkSpace\LexHoy\lexhoyweb

# 2. Aplicar migraciones
npx supabase db push

# 3. Verificar que se aplicaron correctamente
npx supabase db diff
```

### Opción 2: Supabase Dashboard

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido de cada archivo SQL
5. Ejecuta cada migración en orden:
   - Primero: `20251208_update_notification_types.sql`
   - Segundo: `20251208_create_pending_daily_notifications.sql`

### Opción 3: Aplicar Manualmente con psql

```bash
# Conectar a la base de datos
psql -h <tu-host> -U postgres -d postgres

# Ejecutar cada migración
\i supabase/migrations/20251208_update_notification_types.sql
\i supabase/migrations/20251208_create_pending_daily_notifications.sql
```

---

## Verificación

Después de aplicar las migraciones, ejecuta el script de verificación:

```bash
npx tsx scripts/verificar-notificaciones.ts
```

Este script verificará:
- ✅ Que todos los tipos de notificación funcionan
- ✅ Que la tabla `pending_daily_notifications` existe
- ✅ Que la tabla `user_notification_preferences` tiene todas las columnas
- ✅ Que el EmailService está configurado correctamente

---

## Rollback (Si es necesario)

Si necesitas revertir las migraciones:

### Para `20251208_update_notification_types.sql`:
```sql
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_check 
CHECK (tipo IN (
  'solicitud_recibida',
  'solicitud_aprobada',
  'solicitud_rechazada',
  'despacho_asignado',
  'despacho_desasignado',
  'usuario_nuevo',
  'mensaje_sistema'
));
```

### Para `20251208_create_pending_daily_notifications.sql`:
```sql
DROP TABLE IF EXISTS pending_daily_notifications CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_pending_notifications();
```

---

## Notas Importantes

- ⚠️ **Backup**: Haz un backup de la base de datos antes de aplicar las migraciones
- ⚠️ **Producción**: Prueba primero en desarrollo/staging antes de aplicar en producción
- ⚠️ **Orden**: Aplica las migraciones en el orden especificado
- ✅ **Verificación**: Siempre ejecuta el script de verificación después de aplicar

---

## Próximos Pasos

Después de aplicar las migraciones:

1. Ejecutar `npx tsx scripts/verificar-notificaciones.ts`
2. Probar manualmente cada tipo de notificación
3. Verificar que los emails se envían correctamente
4. Configurar un cron job para `EmailService.sendDailySummaries()` (opcional)
