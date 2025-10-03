# 🚀 INICIO RÁPIDO - LEXHOY

> **Para retomar el trabajo sin perder contexto**

---

## 📚 Documentos Clave (Lee en este orden)

1. **`CONTEXTO_PROYECTO.md`** ← Empieza aquí siempre
   - Estado actual del proyecto
   - Lo que funciona y lo que falta
   - Estructura de datos
   - Variables de entorno

2. **`FLUJO_COMPLETO_DESPACHOS.md`** ← Flujo detallado
   - Paso 1: Usuario busca despacho (3 escenarios)
   - Paso 2: Solicitud de propiedad
   - Paso 3: Aprobación/rechazo por super admin
   - Paso 4: Gestión del despacho

3. **`TAREAS_PENDIENTES.md`** ← Plan de trabajo
   - 7 tareas priorizadas
   - Subtareas con checkboxes
   - Criterios de aceptación
   - Orden de ejecución

---

## 🎯 Flujo Visual del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ASIGNACIÓN DE DESPACHOS              │
└─────────────────────────────────────────────────────────────────┘

USUARIO BUSCA DESPACHO
         │
         ├─→ ESCENARIO A: Existe en Next.js
         │   └─→ Solicitar Propiedad → PASO 2
         │
         ├─→ ESCENARIO B: Existe en WordPress ⚠️ TAREA 1
         │   ├─→ Importar a Next.js
         │   └─→ Solicitar Propiedad → PASO 2
         │
         └─→ ESCENARIO C: NO existe ⚠️ TAREA 2
             ├─→ Crear en Next.js
             ├─→ Enviar a WordPress
             └─→ Solicitar Propiedad → PASO 2

PASO 2: SOLICITUD DE PROPIEDAD ✅ YA FUNCIONA
         │
         ├─→ Crear solicitud en BD
         ├─→ Notificar super_admin (campana + email)
         └─→ Usuario espera

PASO 3: SUPER ADMIN APRUEBA/RECHAZA ✅ YA FUNCIONA
         │
         ├─→ APROBAR:
         │   ├─→ Crear relación user_despachos
         │   └─→ Notificar usuario
         │
         └─→ RECHAZAR:
             └─→ Notificar usuario con motivo

PASO 4: GESTIÓN DEL DESPACHO ⚠️ TAREA 3, 4, 5
         │
         ├─→ Usuario edita información
         ├─→ Gestiona sedes
         └─→ Sincroniza con WordPress
```

---

## ✅ Lo que YA funciona

- ✅ Sistema de usuarios y roles
- ✅ Solicitud de propiedad de despachos
- ✅ Aprobación/rechazo por super admin
- ✅ Notificaciones en campana
- ✅ Emails con Resend
- ✅ Búsqueda básica de despachos
- ✅ Importación básica desde WordPress

---

## ⚠️ Lo que FALTA implementar

### 🔴 PRIORIDAD ALTA

**Tarea 1: Importación desde WordPress (ESCENARIO B)**
- Mejorar importación de despachos
- Importar sedes automáticamente
- Guardar object_id correctamente

**Tarea 2: Creación de Despachos (ESCENARIO C)**
- Formulario de creación
- Crear en Next.js
- Enviar a WordPress
- Guardar object_id

### 🟡 PRIORIDAD MEDIA

**Tarea 3: Gestión de Sedes**
- CRUD completo de sedes
- Sincronización con WordPress

**Tarea 4: Webhook WordPress → Next.js**
- Recibir webhooks automáticos
- Sincronizar cambios de WordPress

**Tarea 5: Sincronización Next.js → WordPress**
- Enviar ediciones a WordPress

### 🟢 PRIORIDAD BAJA

**Tarea 6: Dashboard de Sincronización**
- Panel de admin para monitoreo

**Tarea 7: Sistema de Reintentos**
- Reintentos automáticos

---

## 🚀 Cómo Retomar el Trabajo

### Opción 1: Continuar donde lo dejaste
```
"Lee CONTEXTO_PROYECTO.md y continúa con Tarea 1"
```

### Opción 2: Empezar tarea específica
```
"Lee CONTEXTO_PROYECTO.md y empieza Tarea 2"
```

### Opción 3: Revisar estado
```
"Lee CONTEXTO_PROYECTO.md y muéstrame el estado actual"
```

---

## 📁 Estructura de Archivos Importantes

```
lexhoyweb/
├── 📄 CONTEXTO_PROYECTO.md          ← Contexto permanente
├── 📄 FLUJO_COMPLETO_DESPACHOS.md   ← Flujo detallado
├── 📄 TAREAS_PENDIENTES.md          ← Plan de trabajo
├── 📄 INICIO_RAPIDO.md              ← Este archivo
│
├── app/
│   ├── api/
│   │   ├── aprobar-solicitud/       ✅ Funciona
│   │   ├── rechazar-solicitud/      ✅ Funciona
│   │   ├── sync-despacho/           ⚠️ Solo debug
│   │   └── crear-despacho/          ❌ No existe (Tarea 2)
│   │
│   ├── dashboard/
│   │   ├── solicitar-despacho/      ✅ Funciona (mejorar)
│   │   └── despachos/               ✅ Funciona
│   │
│   └── admin/
│       └── users/                   ✅ Funciona
│
└── lib/
    ├── userService.ts               ✅ Funciona
    ├── despachoService.ts           ✅ Funciona (mejorar)
    ├── notificationService.ts       ✅ Funciona
    ├── emailService.ts              ✅ Funciona
    └── syncService.ts               ❌ No existe (Tarea 1, 2)
```

---

## 🔑 Variables de Entorno Necesarias

```env
# WordPress
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2/despachos
WORDPRESS_USERNAME=admin
WORDPRESS_APPLICATION_PASSWORD=xxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=notificaciones@lexhoy.com

# Base URL
NEXT_PUBLIC_BASE_URL=https://lexhoy.com
```

---

## 💡 Tips para Ahorrar Créditos

1. **Siempre menciona** `CONTEXTO_PROYECTO.md` al empezar
2. **Actualiza** `TAREAS_PENDIENTES.md` después de cada tarea
3. **No repitas** el contexto, solo di "lee CONTEXTO_PROYECTO.md"
4. **Sé específico** sobre qué tarea quieres hacer

---

## 🎯 Próximos Pasos Inmediatos

1. **Revisar** que todos los documentos están correctos
2. **Empezar** con Tarea 1 (Importación desde WordPress)
3. **Actualizar** TAREAS_PENDIENTES.md conforme avances
4. **Probar** cada funcionalidad antes de pasar a la siguiente

---

**Última actualización**: 2025-10-03 17:27
**Estado**: Documentación completa, listo para empezar Tarea 1
