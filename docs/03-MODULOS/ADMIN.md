# Panel de Administración

**Versión:** 1.0  
**Última actualización:** 2025-12-02  
**Estado:** ✅ Implementado (85%)

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Acceso y Permisos](#acceso-y-permisos)
3. [Secciones del Panel](#secciones-del-panel)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Gestión de Despachos](#gestión-de-despachos)
6. [Gestión de Solicitudes](#gestión-de-solicitudes)
7. [Gestión de Leads](#gestión-de-leads)
8. [Analytics](#analytics)
9. [API Endpoints](#api-endpoints)
10. [Estado Actual](#estado-actual)

---

## 🎯 Visión General

El panel de administración es el centro de control para los **super admins**. Permite gestionar todos los aspectos de la plataforma.

### Ubicación

`/dashboard/admin`

### Acceso

Solo usuarios con rol `super_admin` pueden acceder.

---

## 🔐 Acceso y Permisos

### Verificación de Acceso

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/dashboard/admin')) {
    const user = await getUser();
    
    if (user?.rol !== 'super_admin') {
      return NextResponse.redirect('/dashboard');
    }
  }
  
  return NextResponse.next();
}
```

### Protección de API

```typescript
// En cada endpoint de admin
export async function GET(request: Request) {
  const user = await getCurrentUser();
  
  if (user?.rol !== 'super_admin') {
    return Response.json(
      { error: 'Unauthorized' }, 
      { status: 403 }
    );
  }
  
  // ... lógica del endpoint
}
```

---

## 📊 Secciones del Panel

### Dashboard Principal

**URL:** `/dashboard/admin`

**Contenido:**
- Estadísticas generales
- Gráficos de actividad
- Accesos rápidos
- Alertas y notificaciones

**Métricas Mostradas (Datos Reales):**
Las métricas se obtienen directamente de la base de datos Supabase en tiempo real:

```typescript
interface AdminDashboardStats {
  usuarios: {
    total: number;        // SELECT count(*) FROM users
    nuevos_mes: number;   // created_at > startOfMonth
    activos: number;      // estado = 'activo'
    despacho_admins: number; // rol = 'despacho_admin'
  };
  despachos: {
    total: number;
    verificados: number;
    pendientes: number;
    con_owner: number;
  };
  leads: {
    total: number;
    nuevos_mes: number;
    asignados: number;
    conversion_rate: number; // Calculado
  };
  solicitudes: {
    pendientes: number;
    aprobadas_mes: number;
    rechazadas_mes: number;
  };
}
```

---

## 👥 Gestión de Usuarios

### URL

`/dashboard/admin/users`

### Funcionalidades

#### Lista de Usuarios

**Características:**
- Tabla con todos los usuarios
- Filtros por rol, estado
- Búsqueda por email/nombre
- Paginación
- Ordenamiento

**Columnas:**
- Email
- Nombre completo
- Rol
- Estado
- Fecha de registro
- Último acceso
- Acciones

#### Filtros Disponibles

```typescript
interface UserFilters {
  rol?: 'usuario' | 'despacho_admin' | 'super_admin';
  estado?: 'pendiente' | 'activo' | 'inactivo' | 'suspendido';
  email_verificado?: boolean;
  search?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
}
```

#### Acciones sobre Usuarios

**1. Editar Usuario**

```typescript
interface EditUserData {
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  rol?: UserRole;
  estado?: UserStatus;
  notas_admin?: string;
}
```

**Modal de edición incluye:**
- Información personal
- Cambio de rol
- Cambio de estado
- Notas administrativas

**2. Cambiar Rol**

```typescript
async function changeUserRole(
  userId: string, 
  newRole: UserRole
) {
  // Validar que no sea el único super_admin
  if (currentRole === 'super_admin') {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'super_admin');
    
    if (count === 1) {
      throw new Error('No puedes degradar al único super admin');
    }
  }
  
  await supabase
    .from('users')
    .update({ rol: newRole })
    .eq('id', userId);
}
```

**3. Activar/Desactivar Usuario**

```typescript
async function toggleUserStatus(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('activo')
    .eq('id', userId)
    .single();
  
  await supabase
    .from('users')
    .update({ activo: !user.activo })
    .eq('id', userId);
}
```

**4. Ver Detalles**

Modal con información completa:
- Datos personales
- Despachos asignados
- Leads comprados
- Historial de actividad
- Solicitudes realizadas

**5. Eliminar Usuario (Zona de Peligro)**

Se ha implementado un sistema robusto de eliminación:
- **Modal de Confirmación**: Requiere escribir "ELIMINAR" para confirmar.
- **Manejo de "Ghost Users"**: Si el usuario no existe en Auth pero sí en DB (error 404), el sistema permite eliminar el registro de la DB limpiamente.
- **Validaciones**: Impide eliminar al propio usuario logueado.

```typescript
// app/api/admin/users/[id]/route.ts
export async function DELETE(req: Request, { params }) {
  // 1. Eliminar de Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  
  // 2. Si es 404 (User not found), ignorar y proceder
  if (authError && authError.status !== 404) {
    throw authError;
  }
  
  // 3. Eliminar de tabla users (Cascade eliminará relaciones)
  await supabaseAdmin.from("users").delete().eq("id", id);
}
```

---

## 🏢 Gestión de Despachos

### URL

`/dashboard/admin/despachos`

### Funcionalidades

#### Lista de Despachos

**Columnas:**
- Nombre
- Owner
- Provincia
- Nº Sedes
- Estado publicación
- Estado verificación
- Fecha creación
- Acciones

#### Crear Despacho

**Formulario incluye:**
- Información básica
  - Nombre
  - Descripción
  - Áreas de práctica
- Sede principal (obligatoria)
  - Todos los campos de sede
- Owner (opcional)
  - Email del propietario

**Proceso:**
```typescript
async function createDespacho(data: CreateDespachoData) {
  // 1. Crear despacho
  const despacho = await supabase
    .from('despachos')
    .insert({
      nombre: data.nombre,
      descripcion: data.descripcion,
      areas_practica: data.areas_practica,
      owner_email: data.owner_email,
      slug: slugify(data.nombre)
    })
    .select()
    .single();
  
  // 2. Crear sede principal
  await supabase
    .from('sedes')
    .insert({
      despacho_id: despacho.id,
      ...data.sedePrincipal,
      es_principal: true
    });
  
  // 3. Si hay owner, promocionar
  if (data.owner_email) {
    await supabase
      .from('users')
      .update({ rol: 'despacho_admin' })
      .eq('email', data.owner_email);
  }
  
  // 4. Sincronizar con WordPress
  await syncWithWordPress(despacho);
  
  return despacho;
}
```

#### Editar Despacho

**Admin puede editar:**
- Toda la información
- Cambiar owner
- Cambiar estado de publicación
- Cambiar estado de verificación
- Añadir/editar/eliminar sedes

#### Cambiar Estados

**Estado de Publicación:**
- `publish` - Publicado (visible en web)
- `draft` - Borrador (no visible)
- `trash` - Papelera (eliminado lógicamente)

**Estado de Verificación:**
- `pendiente` - Esperando verificación
- `verificado` - Verificado por admin
- `rechazado` - Rechazado

```typescript
async function changeDespachoStatus(
  despachoId: string,
  estado_publicacion: string,
  estado_verificacion: string
) {
  await supabase
    .from('despachos')
    .update({
      estado_publicacion,
      estado_verificacion
    })
    .eq('id', despachoId);
  
  // Sincronizar con WordPress
  await syncWithWordPress(despachoId);
}
```

---

## 📝 Gestión de Solicitudes

### URL

`/dashboard/admin/solicitudes`

### Tipos de Solicitudes

1. **Solicitudes de Propiedad de Despacho**
2. **Solicitudes de Colaboración** (futuro)

### Lista de Solicitudes

**Filtros:**
- Estado (pendiente, aprobada, rechazada)
- Tipo
- Fecha

**Columnas:**
- Usuario solicitante
- Despacho solicitado
- Tipo
- Fecha solicitud
- Estado
- Acciones

### Detalle de Solicitud

**Información mostrada:**
- Datos del usuario
- Datos del despacho
- Justificación
- Documentos adjuntos
- Historial

### Aprobar Solicitud

**Proceso:**
```typescript
async function aprobarSolicitud(solicitudId: string) {
  // 1. Obtener solicitud
  const { data: solicitud } = await supabase
    .from('solicitudes_despacho')
    .select('*')
    .eq('id', solicitudId)
    .single();
  
  // 2. Asignar owner_email
  await supabase
    .from('despachos')
    .update({ owner_email: solicitud.user_email })
    .eq('object_id', solicitud.despacho_id);
  
  // 3. Promocionar usuario
  await supabase
    .from('users')
    .update({ rol: 'despacho_admin' })
    .eq('id', solicitud.user_id);
  
  // 4. Actualizar solicitud
  await supabase
    .from('solicitudes_despacho')
    .update({
      estado: 'aprobada',
      fecha_respuesta: new Date(),
      respondido_por: adminId
    })
    .eq('id', solicitudId);
  
  // 5. Notificar usuario
  await sendEmail({
    to: solicitud.user_email,
    subject: 'Solicitud aprobada',
    template: 'solicitud-aprobada',
    data: { despacho: solicitud.despacho_nombre }
  });
}
```

### Rechazar Solicitud

**Requiere:**
- Motivo de rechazo (obligatorio)
- Notas adicionales (opcional)

```typescript
async function rechazarSolicitud(
  solicitudId: string,
  motivo: string,
  notas?: string
) {
  await supabase
    .from('solicitudes_despacho')
    .update({
      estado: 'rechazada',
      fecha_respuesta: new Date(),
      respondido_por: adminId,
      motivo_rechazo: motivo,
      notas_admin: notas
    })
    .eq('id', solicitudId);
  
  // Notificar usuario
  await sendEmail({
    to: solicitud.user_email,
    subject: 'Solicitud rechazada',
    template: 'solicitud-rechazada',
    data: { motivo }
  });
}
```

---

## 📊 Gestión de Leads

### URL

`/dashboard/admin/leads-list`

### Funcionalidades

#### Ver Todos los Leads

**Filtros:**
- Estado
- Especialidad
- Provincia
- Fecha
- Despacho asignado

#### Crear Lead Manualmente

**Formulario:**
- Información del cliente
- Consulta
- Especialidad (manual o con IA)
- Urgencia
- Ubicación

#### Asignar Lead a Despacho

**Proceso:**
```typescript
async function assignLeadToDespacho(
  leadId: string,
  despachoId: string
) {
  await supabase
    .from('leads')
    .update({
      despacho_id: despachoId,
      estado: 'asignado',
      fecha_asignacion: new Date()
    })
    .eq('id', leadId);
  
  // Notificar despacho
  await notifyDespacho(despachoId, leadId);
}
```

#### Ver Analytics de Leads

**Métricas:**
- Total de leads
- Leads por especialidad
- Leads por provincia
- Tasa de conversión
- Tiempo promedio de respuesta
- Valoración promedio

---

## 📈 Analytics

### Dashboard de Analytics

**URL:** `/dashboard/admin/analytics`

**Secciones:**

1. **Usuarios**
   - Crecimiento de usuarios
   - Usuarios activos
   - Distribución por rol
   - Retención

2. **Despachos**
   - Despachos creados
   - Despachos verificados
   - Distribución geográfica
   - Áreas de práctica más comunes

3. **Leads**
   - Leads generados
   - Tasa de conversión
   - Ingresos por leads
   - Especialidades más demandadas

4. **Rendimiento**
   - Tiempo de respuesta API
   - Errores
   - Uso de recursos

---

## 🔌 API Endpoints

### Usuarios

- `GET /api/admin/users` - Lista usuarios
- `GET /api/admin/users/[id]` - Detalle de usuario
- `PUT /api/admin/users/[id]` - Editar usuario
- `PUT /api/admin/users/[id]/role` - Cambiar rol
- `PUT /api/admin/users/[id]/status` - Cambiar estado

### Despachos

- `GET /api/admin/despachos` - Lista despachos
- `POST /api/admin/despachos` - Crear despacho
- `PUT /api/admin/despachos/[id]` - Editar despacho
- `DELETE /api/admin/despachos/[id]` - Eliminar despacho
- `PUT /api/admin/despachos/[id]/estado` - Cambiar estado

### Solicitudes

- `GET /api/admin/solicitudes` - Lista solicitudes
- `GET /api/admin/solicitudes/[id]` - Detalle
- `POST /api/admin/solicitudes/[id]/aprobar` - Aprobar
- `POST /api/admin/solicitudes/[id]/rechazar` - Rechazar

### Leads

- `GET /api/admin/leads` - Lista todos los leads
- `POST /api/admin/leads` - Crear lead manual
- `PUT /api/admin/leads/[id]/assign` - Asignar a despacho

### Analytics

- `GET /api/admin/analytics/users` - Métricas de usuarios
- `GET /api/admin/analytics/despachos` - Métricas de despachos
- `GET /api/admin/analytics/leads` - Métricas de leads

---

## ✅ Estado Actual

### Implementado

- [x] Dashboard principal
- [x] Gestión de usuarios
- [x] Gestión de despachos
- [x] Gestión de solicitudes
- [x] Lista de leads
- [x] Estadísticas básicas
- [x] Protección de rutas
- [x] Protección de API

### Funcionando

- ✅ Acceso restringido a super_admin
- ✅ CRUD de usuarios
- ✅ CRUD de despachos
- ✅ Aprobación/rechazo de solicitudes
- ✅ Visualización de leads

---

## 🚧 Pendientes

- [ ] Analytics avanzados
- [ ] Exportación de datos
- [ ] Logs de auditoría
- [ ] Configuración del sistema
- [ ] Gestión de permisos granulares
- [ ] Backup y restore
- [ ] Monitoreo en tiempo real

---

**Última actualización:** 2025-12-02  
**Mantenido por:** José Ramón Blanco Casal
