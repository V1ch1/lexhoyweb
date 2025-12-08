-- Script SQL para crear notificaciones de prueba
-- Ejecutar en Supabase SQL Editor

-- IMPORTANTE: Reemplaza 'TU_USER_ID_AQUI' con el ID de un usuario real de cada rol

-- ============================================
-- NOTIFICACIONES PARA SUPER ADMIN
-- ============================================

-- Obtener un super_admin
DO $$
DECLARE
  admin_id TEXT;
BEGIN
  SELECT id INTO admin_id FROM users WHERE rol = 'super_admin' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Nueva solicitud de despacho
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      admin_id,
      'solicitud_despacho',
      '🔔 Nueva Solicitud de Despacho',
      'El usuario Juan Pérez ha solicitado acceso al despacho "Bufete Legal Madrid"',
      false,
      '{"test": true}'::jsonb
    );

    -- Nuevo usuario registrado
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      admin_id,
      'usuario_nuevo',
      '👤 Nuevo Usuario Registrado',
      'María García se ha registrado en la plataforma',
      false,
      '{"test": true}'::jsonb
    );

    -- Nuevo lead procesado (vista admin)
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      admin_id,
      'nuevo_lead_admin',
      '📊 Nuevo Lead Procesado',
      'Lead "Divorcio express" procesado. Especialidad: Derecho de Familia. Calidad: 85/100',
      false,
      '{"test": true}'::jsonb
    );

    -- Lead vendido
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      admin_id,
      'lead_vendido',
      '💰 Lead Vendido',
      'El lead "Reclamación laboral" ha sido vendido por 150€',
      false,
      '{"test": true}'::jsonb
    );

    RAISE NOTICE 'Notificaciones creadas para super_admin: %', admin_id;
  ELSE
    RAISE NOTICE 'No se encontró ningún super_admin';
  END IF;
END $$;

-- ============================================
-- NOTIFICACIONES PARA DESPACHO ADMIN
-- ============================================

DO $$
DECLARE
  despacho_admin_id TEXT;
BEGIN
  SELECT id INTO despacho_admin_id FROM users WHERE rol = 'despacho_admin' LIMIT 1;
  
  IF despacho_admin_id IS NOT NULL THEN
    -- Nuevo lead disponible
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      despacho_admin_id,
      'nuevo_lead',
      '🎯 Nuevo Lead Disponible',
      'Nuevo lead de Derecho Mercantil disponible. Urgencia: Alta. Precio: 200€',
      false,
      '{"test": true, "leadId": "test-123", "especialidad": "Mercantil", "precio": 200}'::jsonb
    );

    -- Lead comprado
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      despacho_admin_id,
      'lead_comprado',
      '✅ Lead Adquirido',
      'Has comprado el lead "Constitución de sociedad" por 180€',
      false,
      '{"test": true, "leadId": "test-456", "precio": 180}'::jsonb
    );

    -- Despacho asignado
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      despacho_admin_id,
      'despacho_asignado',
      '👑 Asignado como Propietario',
      'Has sido asignado como propietario del despacho "Abogados Asociados"',
      false,
      '{"test": true}'::jsonb
    );

    -- Despacho desasignado
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      despacho_admin_id,
      'despacho_desasignado',
      '🔄 Cambio de Propiedad',
      'Has dejado de ser propietario del despacho "Legal Partners"',
      false,
      '{"test": true}'::jsonb
    );

    RAISE NOTICE 'Notificaciones creadas para despacho_admin: %', despacho_admin_id;
  ELSE
    RAISE NOTICE 'No se encontró ningún despacho_admin';
  END IF;
END $$;

-- ============================================
-- NOTIFICACIONES PARA USUARIO REGULAR
-- ============================================

DO $$
DECLARE
  usuario_id TEXT;
BEGIN
  SELECT id INTO usuario_id FROM users WHERE rol = 'usuario' LIMIT 1;
  
  IF usuario_id IS NOT NULL THEN
    -- Solicitud recibida
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      usuario_id,
      'solicitud_recibida',
      '📋 Solicitud Recibida',
      'Hemos recibido tu solicitud para el despacho "Despacho Jurídico Central"',
      false,
      '{"test": true}'::jsonb
    );

    -- Solicitud aprobada
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      usuario_id,
      'solicitud_aprobada',
      '🎉 Solicitud Aprobada',
      'Tu solicitud para "Bufete Internacional" ha sido aprobada',
      false,
      '{"test": true}'::jsonb
    );

    -- Solicitud rechazada
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      usuario_id,
      'solicitud_rechazada',
      '❌ Solicitud No Aprobada',
      'Tu solicitud para "Asesoría Legal" no ha sido aprobada',
      false,
      '{"test": true}'::jsonb
    );

    -- Mensaje del sistema
    INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, leida, metadata)
    VALUES (
      usuario_id,
      'mensaje_sistema',
      '📢 Mensaje del Sistema',
      'Mantenimiento programado el próximo domingo de 2:00 a 4:00 AM',
      false,
      '{"test": true}'::jsonb
    );

    RAISE NOTICE 'Notificaciones creadas para usuario: %', usuario_id;
  ELSE
    RAISE NOTICE 'No se encontró ningún usuario regular';
  END IF;
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver notificaciones de prueba creadas
SELECT 
  u.email,
  u.rol,
  n.tipo,
  n.titulo,
  n.created_at
FROM notificaciones n
JOIN users u ON u.id = n.user_id
WHERE n.metadata->>'test' = 'true'
ORDER BY u.rol, n.created_at DESC;

-- ============================================
-- PARA LIMPIAR LAS NOTIFICACIONES DE PRUEBA
-- ============================================

-- Ejecuta esto cuando quieras eliminar las notificaciones de prueba:
-- DELETE FROM notificaciones WHERE metadata->>'test' = 'true';
