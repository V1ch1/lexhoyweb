# Sistema de Gestión de Despachos

## Estructura de Datos Sincronizada con WordPress y Algolia

### Tabla: despachos (Sync con WordPress)
- `id` (UUID): Identificador único en Next.js
- `object_id` (String): ID de WordPress (obligatorio para sincronización)
- `nombre` (String): Nombre del despacho
- `descripcion` (Text): Descripción/Resumen
- `slug` (String): URL amigable (debe coincidir con WordPress)
- `activo` (Boolean): Estado de activación
- `verificado` (Boolean): Verificado por administración
- `num_sedes` (Integer): Número de sedes
- `areas_practica` (String[]): Áreas de práctica
- `fecha_creacion` (Timestamp): Fecha de creación
- `fecha_actualizacion` (Timestamp): Última actualización
- `sincronizado_wp` (Boolean): Estado de sincronización
- `ultima_sincronizacion` (Timestamp): Última sincronización

### Campos de Sincronización con WordPress
```typescript
interface DespachoWP {
  object_id: string;      // ID en WordPress
  nombre: string;         // Título del despacho
  descripcion: string;    // Contenido/descripción
  slug: string;           // Slug de la URL
  localidad?: string;     // Localidad principal
  provincia?: string;     // Provincia principal
  email_contacto?: string;
  telefono?: string;
  sedes?: SedeWP[];       // Array de sedes
  // Metadatos adicionales de WordPress
  meta?: {
    _despacho_sedes?: Array<{
      localidad?: string;
      provincia?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
      web?: string;
      es_principal?: boolean;
    }>;
    // Otros campos personalizados de WordPress
  };
}
```

### Tabla: users
- `id`: Identificador único (UUID)
- `email`: Correo electrónico (único)
- `rol`: Tipo de usuario (admin, abogado, usuario)
- `despacho_id`: Referencia al despacho (opcional)
- `estado`: Estado del usuario (pendiente, activo, inactivo)
- `fecha_aprobacion`: Cuándo fue aprobado
- `aprobado_por`: Quién lo aprobó

### Tabla: sedes (Sync con WordPress)
- `id` (Serial): Identificador único
- `despacho_id` (UUID): Referencia al despacho
- `es_principal` (Boolean): Si es la sede principal
- `nombre` (String): Nombre de la sede
- `direccion` (String): Dirección completa
- `localidad` (String): Localidad
- `provincia` (String): Provincia
- `codigo_postal` (String): Código postal
- `pais` (String): País (default: 'España')
- `telefono` (String): Teléfono de contacto
- `email` (String): Email de contacto
- `web` (String): Sitio web
- `horarios` (JSONB): Horarios de atención
- `activa` (Boolean): Estado de la sede
- `wp_sede_id` (String): ID de la sede en WordPress (si existe)
- `sincronizado_wp` (Boolean): Estado de sincronización

### Tabla: solicitudes_despacho
- `id`: Identificador único
- `usuario_id`: Usuario que solicita
- `despacho_id`: Despacho solicitado
- `estado`: (pendiente, aprobada, rechazada, cancelada)
- `fecha_solicitud`: Cuándo se realizó
- `fecha_respuesta`: Cuándo se respondió
- `notas`: Observaciones

## Roles del Sistema

1. **Super Admin (rol: 'admin')**
   - Gestionar todos los usuarios y sus roles
   - Aprobar/Rechazar solicitudes de despacho
   - Ver todos los despachos y su información
   - Acceso a estadísticas globales
   - Ver y gestionar sedes de todos los despachos

2. **Propietario/Abogado (rol: 'abogado')**
   - Gestionar la información de su despacho
   - Administrar sedes del despacho
   - Ver estadísticas de su despacho
   - No puede gestionar otros despachos
   - Acceso a herramientas profesionales

3. **Usuario Registrado (rol: 'usuario')**
   - Buscar despachos
   - Solicitar propiedad de un despacho
   - Ver información básica de despachos
   - Gestionar su perfil

4. **Usuario Pendiente (sin rol asignado)**
   - Estado inicial al registrarse
   - Debe ser aprobado por un administrador
   - Acceso limitado hasta su aprobación

## Flujos de Trabajo

### 1. Registro y Aprobación de Usuarios
1. Usuario se registra
2. Sistema asigna estado 'pendiente' y notifica a administradores
3. Administrador revisa y:
   - Aprueba:
     - Asigna rol según perfil
     - Notifica al usuario
   - Rechaza:
     - Ingresa motivo
     - Notifica al usuario con razones

### 2. Búsqueda y Solicitud de Despacho
1. Usuario inicia sesión
2. Si no tiene despacho asignado, ve opción "Buscar mi despacho"
3. Sistema muestra buscador con filtros (nombre, ubicación, especialidad)
4. Usuario busca su despacho:
   - Si existe en la base de datos:
     - Muestra información básica
     - Opción "Solicitar propiedad"
   - Si no existe:
     - Opción "Solicitar creación de despacho"
     - Formulario con datos básicos
     - Se crea solicitud para revisión

### 3. Proceso de Solicitud de Propiedad
1. Usuario solicita propiedad de un despacho
2. Sistema crea registro en `solicitudes_despacho`
3. Notificación a administradores
4. Administrador revisa:
   - Si aprueba:
     - Asigna `despacho_id` al usuario
     - Actualiza rol si es necesario
     - Notifica al usuario
   - Si rechaza:
     - Ingresa motivo
     - Notifica al usuario

### 4. Gestión de Despacho (Propietario/Abogado)
1. Panel de control con:
   - Resumen de actividad
   - Gestión de sedes
   - Configuración del perfil
   - Estadísticas de consultas
   - Gestión de equipo (si aplica)

### 5. Administración (Super Admin)
1. Gestión de Usuarios:
   - Aprobar/Rechazar nuevos usuarios
   - Asignar/Modificar roles
   - Gestionar permisos
   - Ver actividad

2. Gestión de Despachos:
   - Ver todos los despachos
   - Asignar/retirar propiedad
   - Verificar/Desactivar despachos
   - Gestionar sedes

3. Solicitudes Pendientes:
   - Ver lista de solicitudes
   - Filtrar por tipo y estado
   - Gestionar aprobaciones
   - Comunicarse con solicitantes

## Flujo de Sincronización

### Sincronización WordPress → Next.js
1. **Creación/Actualización**:
   - Cuando se crea/actualiza un despacho en WordPress, se dispara un webhook
   - El endpoint `/api/sync-despacho` recibe los datos
   - Se busca por `object_id` en la tabla `despachos`
   - Si existe, se actualiza; si no, se crea un nuevo registro
   - Se actualiza `ultima_sincronizacion` y `sincronizado_wp = true`

2. **Sincronización de Sedes**:
   - Se procesa el array `_despacho_sedes` de WordPress
   - Cada sede se busca por `wp_sede_id` o se crea una nueva
   - Se mantiene la relación con el despacho principal

### Sincronización Next.js → WordPress
1. **Actualización desde el Panel**:
   - Cuando se actualiza un despacho en Next.js
   - Se marca `sincronizado_wp = false`
   - Se envía una petición a la API de WordPress
   - Tras confirmación, se actualiza `sincronizado_wp = true`

2. **Manejo de Errores**:
   - Si falla la sincronización, se mantiene `sincronizado_wp = false`
   - Se registra el error para reintento posterior
   - Se notifica al administrador

## Estructura de Datos (Sincronizada)

### Usuario (users)
```typescript
interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  rol: 'admin' | 'abogado' | 'usuario';
  despacho_id?: string;
  estado: 'pendiente' | 'activo' | 'inactivo';
  email_verificado: boolean;
  fecha_registro: string;
  ultimo_acceso?: string;
  fecha_aprobacion?: string;
  aprobado_por?: string;
  notas_admin?: string;
  created_at: string;
  updated_at: string;
}
```

### Despacho (despachos)
```typescript
interface Despacho {
  // Identificación
  id: string;                   // UUID en Next.js
  object_id: string;            // ID en WordPress (obligatorio para sync)
  
  // Información básica
  nombre: string;
  descripcion: string;
  slug: string;                 // Debe coincidir con WordPress
  areas_practica: string[];     // Áreas de práctica
  
  // Estado
  activo: boolean;
  verificado: boolean;
  num_sedes: number;
  
  // Sincronización
  sincronizado_wp: boolean;     // Estado de sincronización
  ultima_sincronizacion: string;
  
  // Auditoría
  fecha_creacion: string;
  fecha_actualizacion: string;
  created_at: string;
  updated_at: string;
}
```

### Sede (sedes)
```typescript
interface Sede {
  // Identificación
  id: number;                   // ID en Next.js
  despacho_id: string;          // Referencia al despacho
  wp_sede_id?: string;          // ID en WordPress (si existe)
  
  // Información básica
  nombre: string;
  descripcion?: string;
  es_principal: boolean;
  
  // Ubicación
  calle?: string;
  numero?: string;
  piso?: string;
  localidad: string;
  provincia: string;
  codigo_postal: string;
  pais: string;
  
  // Contacto
  telefono?: string;
  email?: string;
  web?: string;
  
  // Configuración
  horarios: Record<string, any>;
  redes_sociales?: Record<string, string>;
  
  // Estado
  activa: boolean;
  estado_verificacion: 'pendiente' | 'verificado' | 'rechazado';
  sincronizado_wp: boolean;
  
  // Auditoría
  created_at: string;
  updated_at: string;
}
```

### Solicitud de Despacho (solicitudes_despacho)
```typescript
interface SolicitudDespacho {
  id: string;
  usuario_id: string;
  despacho_id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  fecha_solicitud: string;
  fecha_respuesta?: string;
  respondido_por?: string;
  notas_respuesta?: string;
  created_at: string;
  updated_at: string;
}
```

## Próximos Pasos para la Sincronización

1. **Configuración del Webhook en WordPress**
   - Crear webhook que se active al guardar/actualizar un despacho
   - Configurar la URL del endpoint `/api/sync-despacho`

2. **Implementar Servicio de Sincronización**
   - Crear servicio `syncService.ts` con métodos para:
     - `sincronizarDesdeWordPress(despachoWP)`
     - `sincronizarHaciaWordPress(despachoId)`
     - `verificarEstadoSincronizacion()`

3. **Actualizar Modelos**
   - Añadir campos de sincronización a los modelos
   - Crear migraciones para las nuevas columnas

4. **Desarrollar Interfaces de Sincronización**
   - Estado de sincronización visible en el panel
   - Botón de sincronización manual
   - Historial de sincronizaciones

5. **Pruebas de Sincronización**
   - Pruebas unitarias para el servicio de sincronización
   - Pruebas de integración con WordPress
   - Pruebas de rendimiento para grandes volúmenes

6. **Documentación**
   - Guía de configuración de webhooks
   - Manual de sincronización
   - Solución de problemas comunes
