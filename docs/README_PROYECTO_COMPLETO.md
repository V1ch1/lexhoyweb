# PROYECTO LEXHOY - DOCUMENTACION COMPLETA

Fecha: 10 de noviembre de 2025

---

## INDICE DE DOCUMENTACION

Este proyecto tiene 5 documentos principales que debes leer en orden:

### 1. **ARQUITECTURA_CORRECTA_Y_PROPUESTA.md** ⭐ LEER PRIMERO
- Situacion actual real del proyecto
- Problema de sincronizacion
- Arquitectura propuesta
- Decision de fuente unica de verdad

### 2. **PLAN_ACCION_INMEDIATO.md** ⭐ LEER SEGUNDO
- Tareas especificas paso a paso
- Codigo completo para implementar
- Testing y verificacion
- Checklist de implementacion

### 3. **RESUMEN_ESTADO_Y_PLAN.md**
- Estado actual detallado
- Lo que funciona vs lo que falta
- Variables de entorno
- Estimaciones de tiempo

### 4. **ANALISIS_COMPLETO_PROYECTO.md**
- Ecosistema completo
- Flujo del sistema de leads
- Integracion con WordPress
- Procesamiento con IA

### 5. **LISTADO_TAREAS_PRIORIZADAS.md**
- Todas las tareas con checkboxes
- Orden de ejecucion
- Estimaciones

---

## RESUMEN EJECUTIVO

### El Problema

**AHORA**:
- Los despachos se modifican en Next.js
- Los cambios se guardan en Supabase
- ❌ NO se sincronizan a WordPress
- ❌ NO llegan a Algolia
- ❌ Hay 3 fuentes de verdad diferentes

### La Solucion

**PROPUESTA**:
```
Next.js (Supabase) = FUENTE UNICA DE VERDAD
    |
    +--> WordPress (sincronizacion automatica)
    |        |
    |        +--> Algolia (via plugin WP)
    |
    +--> Algolia (sincronizacion directa - opcional)
```

**Beneficios**:
- ✅ Una sola fuente de verdad (Supabase)
- ✅ Sincronizacion automatica
- ✅ WordPress y Algolia siempre actualizados
- ✅ Cola de reintentos para fallos
- ✅ Facil agregar nuevas funcionalidades

---

## PLAN DE IMPLEMENTACION

### FASE 1: Sincronizacion Next.js → WordPress (1-2 semanas)

**Objetivo**: Cuando se modifica un despacho en Next.js, actualizar WordPress automaticamente

**Tareas**:
1. Crear endpoint `/api/despachos/[id]/sync`
2. Modificar paginas de edicion para llamar sync
3. Crear tabla `sync_queue` para reintentos
4. Crear servicio `SyncQueue`
5. Configurar cron job para procesar cola
6. Testing completo

**Resultado**: WordPress siempre actualizado → Algolia actualizado via plugin WP

### FASE 2: Sistema de Leads con IA (3-4 semanas)

**Objetivo**: Monetizar las consultas de lexhoy.com

**Flujo**:
1. Usuario llena formulario en lexhoy.com
2. Formulario envia a `/api/leads/capturar`
3. IA (OpenAI) procesa y anonimiza
4. Super admin revisa y aprueba precio
5. Lead se publica en marketplace
6. Despachos compran leads
7. Datos se revelan tras compra

**Componentes**:
- 3 tablas nuevas en Supabase
- Servicio de IA (OpenAI GPT-4)
- 4 APIs nuevas
- 3 paginas nuevas

### FASE 3: [OPCIONAL] Sincronizacion directa a Algolia (1 semana)

**Objetivo**: Backup si WordPress falla

**Tareas**:
1. Crear `lib/algoliaService.ts`
2. Sincronizar directamente a Algolia
3. Usar como fallback

---

## TECNOLOGIAS

### Stack Actual
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **CMS**: WordPress (lexhoy.com)
- **Busqueda**: Algolia
- **Email**: Resend
- **Hosting**: Vercel

### Nuevas Integraciones
- **IA**: OpenAI GPT-4 (para leads)
- **Pagos**: Stripe (futuro)

---

## VARIABLES DE ENTORNO

### Ya Configuradas ✅
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WORDPRESS_API_URL=
WORDPRESS_USERNAME=
WORDPRESS_APPLICATION_PASSWORD=
RESEND_API_KEY=
```

### Por Configurar ⚠️
```env
# Para sincronizacion directa a Algolia (opcional)
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=

# Para sistema de leads
OPENAI_API_KEY=

# Para pagos (futuro)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## ESTRUCTURA DEL PROYECTO

### Archivos Clave Existentes
```
lib/
├── userService.ts          ✅ Gestion de usuarios
├── despachoService.ts      ✅ Busqueda e importacion
├── sedeService.ts          ✅ Gestion de sedes
├── syncService.ts          ✅ Sincronizacion (mejorar)
├── notificationService.ts  ✅ Notificaciones
└── emailService.ts         ✅ Emails

app/api/
├── despachos/              ✅ APIs de despachos
├── sync-despacho/          ✅ Webhook de WordPress
└── aprobar-solicitud/      ✅ Aprobacion de solicitudes
```

### Archivos a Crear
```
lib/
├── syncQueue.ts            ⚠️ CREAR - Cola de sincronizacion
├── leadAIService.ts        ⚠️ CREAR - Procesamiento IA
├── leadService.ts          ⚠️ CREAR - Logica de leads
└── algoliaService.ts       ⚠️ CREAR - Sincronizacion Algolia

app/api/
├── despachos/[id]/sync/    ⚠️ CREAR - Endpoint sync
├── leads/capturar/         ⚠️ CREAR - Captura formularios
├── leads/marketplace/      ⚠️ CREAR - Listar leads
├── leads/comprar/          ⚠️ CREAR - Comprar lead
└── admin/
    ├── sync-queue/         ⚠️ CREAR - Procesar cola
    └── leads/
        ├── aprobar/        ⚠️ CREAR - Aprobar lead
        └── rechazar/       ⚠️ CREAR - Rechazar lead

app/
├── admin/
│   ├── sincronizacion/     ⚠️ CREAR - Panel sync
│   └── leads/pendientes/   ⚠️ CREAR - Aprobar leads
└── dashboard/leads/
    ├── marketplace/        ⚠️ CREAR - Comprar leads
    └── comprados/          ⚠️ CREAR - Ver comprados

supabase/migrations/
├── create_sync_queue.sql   ⚠️ CREAR
├── create_leads_marketplace.sql ⚠️ CREAR
└── create_leads_compras.sql ⚠️ CREAR
```

---

## COMO EMPEZAR

### Paso 1: Leer Documentacion
1. Leer `ARQUITECTURA_CORRECTA_Y_PROPUESTA.md`
2. Leer `PLAN_ACCION_INMEDIATO.md`
3. Revisar `RESUMEN_ESTADO_Y_PLAN.md`

### Paso 2: Configurar Entorno
1. Verificar que todas las variables de entorno estan configuradas
2. Tener acceso a Supabase
3. Tener acceso a WordPress admin
4. Tener acceso a Algolia (para verificar)

### Paso 3: Implementar Fase 1
1. Seguir las tareas en `PLAN_ACCION_INMEDIATO.md`
2. Crear endpoint de sincronizacion
3. Modificar paginas de edicion
4. Crear cola de sincronizacion
5. Testing completo

### Paso 4: Verificar
1. Editar un despacho en Next.js
2. Verificar que se actualiza en WordPress
3. Verificar que se actualiza en Algolia
4. Verificar logs de sincronizacion

### Paso 5: Implementar Fase 2 (Leads)
1. Configurar OpenAI API Key
2. Crear tablas de leads
3. Implementar servicio de IA
4. Crear APIs de captura y compra
5. Crear interfaces de admin y marketplace

---

## METRICAS DE EXITO

### Tecnicas
- ✅ Sincronizacion: >99% exitosa
- ✅ Latencia: <3 segundos
- ✅ Uptime: >99.9%

### Negocio
- 📊 Leads capturados/mes
- 📊 Tasa de aprobacion admin
- 📊 Leads vendidos/mes
- 📊 Revenue por lead
- 📊 Tasa de conversion despacho

---

## SOPORTE Y CONTACTO

### Documentacion
- Todos los archivos .md en la raiz del proyecto
- Comentarios en el codigo
- README de cada servicio

### Logs
- Consola del navegador (frontend)
- Vercel logs (backend)
- Supabase logs (base de datos)

---

## PROXIMOS PASOS INMEDIATOS

### HOY
1. ✅ Revisar toda la documentacion
2. ⚠️ Crear endpoint `/api/despachos/[id]/sync`
3. ⚠️ Modificar pagina de edicion de despachos

### ESTA SEMANA
1. ⚠️ Crear tabla `sync_queue`
2. ⚠️ Implementar `SyncQueue` service
3. ⚠️ Testing de sincronizacion
4. ⚠️ Configurar cron job

### PROXIMA SEMANA
1. ⚠️ Verificar que todo sincroniza correctamente
2. ⚠️ Configurar OpenAI API Key
3. ⚠️ Empezar con sistema de leads

---

## NOTAS IMPORTANTES

### Sincronizacion
- La sincronizacion es ASINCRONA (no bloquea al usuario)
- Si falla, se guarda en cola para reintentar
- Maximo 3 intentos con exponential backoff
- Los cambios SIEMPRE se guardan en Supabase primero

### Sistema de Leads
- IA procesa y anonimiza AUTOMATICAMENTE
- Super admin DEBE revisar antes de publicar
- Datos personales SOLO se revelan tras compra
- Cumplir con GDPR y privacidad

### WordPress
- Mantener plugin de Algolia activo
- WordPress sigue siendo util para contenido del blog
- No eliminar sincronizacion WordPress → Algolia

---

Ultima actualizacion: 10 de noviembre de 2025

**¿Listo para empezar? Sigue el PLAN_ACCION_INMEDIATO.md**
