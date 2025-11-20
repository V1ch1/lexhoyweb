# 📘 Migración de Supabase Auth → Clerk + Supabase DB

## 🎯 Objetivo

Migrar la autenticación de Supabase Auth a Clerk, **manteniendo toda la base de datos en Supabase**.

---

## 📊 Arquitectura Actual vs Nueva

### **ANTES** (Supabase Auth + DB):

```
┌─────────────────────────────────────┐
│         SUPABASE                    │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Supabase Auth│  │ PostgreSQL  │ │
│  │  (usuarios)  │◄─┤   (datos)   │ │
│  └──────────────┘  └─────────────┘ │
│         ▲               ▲           │
└─────────┼───────────────┼───────────┘
          │               │
     ❌ Rate Limit    ✅ Bien
     (4 emails/hora)
```

### **DESPUÉS** (Clerk + Supabase DB):

```
┌──────────────┐       ┌──────────────────┐
│    CLERK     │       │    SUPABASE      │
│   (Auth)     │       │   (PostgreSQL)   │
│              │       │                  │
│ ✅ Usuario   │──────►│ Tabla: users     │
│    autenticado      │ - id (Clerk ID)  │
│              │       │ - email          │
│              │       │ - despachos      │
└──────────────┘       │ - leads          │
  ✅ Sin límite        └──────────────────┘
     de emails              ✅ Mantener todo
```

---

## 🗄️ Impacto en Base de Datos

### **Tabla `users` - CAMBIOS CRÍTICOS**

#### **ANTES** (Supabase Auth):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- ⚠️ ID de Supabase Auth
  email TEXT NOT NULL,
  nombre TEXT,
  apellidos TEXT,
  rol TEXT DEFAULT 'usuario',
  plan TEXT DEFAULT 'free',
  despacho_id UUID,  -- Despacho asignado
  ...
);
```

#### **DESPUÉS** (Clerk):

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- ✅ CAMBIO: ID de Clerk (formato: user_xxxxxxxxx)
  clerk_id TEXT UNIQUE NOT NULL,  -- ✅ NUEVO: Redundancia por seguridad
  email TEXT NOT NULL,
  nombre TEXT,
  apellidos TEXT,
  rol TEXT DEFAULT 'usuario',
  plan TEXT DEFAULT 'free',
  despacho_id UUID,  -- ✅ MANTENER: Despacho asignado
  ...
);
```

### **Cambios en otras tablas**:

```sql
-- ✅ SIN CAMBIOS: Todas estas FK siguen funcionando
user_despachos.user_id → users.id
despachos.aprobado_por → users.id
despachos.owner_email → users.email  -- ✅ Seguir usando email
leads.user_id → users.id (si existe)
notificaciones.user_id → users.id
```

---

## 🔑 Sistema de Usuarios - FUNCIONALIDADES CRÍTICAS

### **1. Registro de Usuarios**

#### **ANTES** (Supabase):

```typescript
// ❌ Rate limit: 4 emails/hora
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

// Crear en tabla users
await supabase.from("users").insert({
  id: data.user.id, // UUID de Supabase
  email,
  rol: "usuario",
});
```

#### **DESPUÉS** (Clerk):

```typescript
// ✅ Sin límite de emails
// Clerk maneja registro automáticamente via componente <SignUp />

// En webhook de Clerk (cuando se crea usuario):
await supabase.from("users").insert({
  id: clerkUserId, // user_xxxxxxxxx
  clerk_id: clerkUserId,
  email,
  rol: "usuario",
  email_verificado: true, // Clerk ya lo verificó
});
```

### **2. Propiedad de Despachos**

**SISTEMA ACTUAL** - ⚠️ **CRÍTICO NO ROMPER**:

```typescript
// Despacho tiene owner_email
despachos {
  id: UUID,
  owner_email: TEXT,  // ✅ MANTENER: Email del propietario
  nombre: TEXT,
  ...
}

// Verificar si usuario es propietario
const { data: despacho } = await supabase
  .from('despachos')
  .select('*')
  .eq('id', despachoId)
  .eq('owner_email', user.email)  // ✅ Sigue funcionando
  .single();
```

**CON CLERK** - ✅ **COMPATIBLE**:

```typescript
// Clerk proporciona el email del usuario
const { userId, emailAddress } = auth();

// ✅ Mismo código funciona
const { data: despacho } = await supabase
  .from("despachos")
  .select("*")
  .eq("id", despachoId)
  .eq("owner_email", emailAddress) // ✅ Email de Clerk
  .single();
```

### **3. Asignación de Despachos (user_despachos)**

**SISTEMA ACTUAL**:

```sql
-- Usuario puede administrar múltiples despachos
user_despachos {
  id: UUID,
  user_id: UUID,  -- ⚠️ Cambiará a TEXT (Clerk ID)
  despacho_id: UUID,
  permisos: JSONB,
  rol: TEXT,
  activo: BOOLEAN
}
```

**CON CLERK**:

```typescript
// ✅ Mismo flujo, solo cambia el tipo de user_id
await supabase.from("user_despachos").insert({
  user_id: clerkUserId, // user_xxxxxxxxx (TEXT, no UUID)
  despacho_id: despachoId,
  permisos: { leer: true, escribir: true },
  activo: true,
});
```

### **4. Compra de Leads**

**SISTEMA ACTUAL** (si existe):

```typescript
// Usuario compra lead para su despacho
leads {
  id: UUID,
  despacho_id: UUID,
  comprado_por: UUID,  -- ⚠️ user_id
  precio: DECIMAL,
  ...
}
```

**CON CLERK**:

```typescript
// ✅ Mismo flujo
await supabase.from("leads").insert({
  despacho_id: despachoId,
  comprado_por: clerkUserId, // TEXT en vez de UUID
  precio: 50.0,
});
```

### **5. Roles y Permisos**

**SISTEMA ACTUAL**:

```typescript
users {
  rol: 'usuario' | 'despacho_admin' | 'super_admin',
  plan: 'free' | 'basic' | 'premium' | 'enterprise'
}
```

**CON CLERK**:

```typescript
// ✅ MANTENER en Supabase
// Clerk solo autentica, roles se gestionan en tu DB
const { data: user } = await supabase
  .from("users")
  .select("rol, plan")
  .eq("id", clerkUserId)
  .single();

if (user.rol === "super_admin") {
  // Admin tiene acceso total
}
```

---

## 🔄 Migración de Datos Existentes

### **Script de Migración**:

```sql
-- ⚠️ IMPORTANTE: BACKUP ANTES DE EJECUTAR
-- pg_dump -h host -U user -d database > backup.sql

-- 1. Agregar nueva columna para Clerk ID
ALTER TABLE users ADD COLUMN clerk_id TEXT;

-- 2. Cambiar tipo de id de UUID a TEXT
-- ⚠️ ESTO ES COMPLEJO - Requiere:
--    a) Desactivar FK constraints temporalmente
--    b) Cambiar tipo de columna
--    c) Actualizar todas las FK
--    d) Reactivar constraints

-- Opción más segura: Crear tabla nueva y migrar
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE,
  email TEXT NOT NULL,
  nombre TEXT,
  apellidos TEXT,
  telefono TEXT,
  fecha_registro TIMESTAMPTZ DEFAULT now(),
  ultimo_acceso TIMESTAMPTZ,
  activo BOOLEAN DEFAULT true,
  email_verificado BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free',
  rol TEXT DEFAULT 'usuario',
  estado TEXT DEFAULT 'activo',
  despacho_id UUID REFERENCES despachos(id),
  -- ... resto de campos
);

-- 3. Migrar usuarios existentes
-- ⚠️ Usuarios existentes NO tendrán Clerk ID
-- Solución: Forzar re-autenticación o migración manual
```

---

## 🚨 PUNTOS CRÍTICOS - NO ROMPER

### **1. Propiedad de Despachos**

- ✅ **owner_email** en `despachos` → Seguir usando
- ✅ Verificación por email → Compatible con Clerk
- ⚠️ NO cambiar lógica de verificación

### **2. Asignación Múltiple**

- ✅ `user_despachos` → Usuario puede tener múltiples despachos
- ✅ Permisos granulares → Mantener sistema actual
- ⚠️ Cambiar user_id de UUID a TEXT

### **3. Sistema de Leads**

- ✅ Compra de leads → Vincular con user_id (Clerk)
- ✅ Facturación → Debe seguir funcionando
- ⚠️ Verificar referencias a user_id

### **4. Notificaciones**

- ✅ Sistema actual → Ya usa TEXT para user_id
- ✅ Compatible desde ya con Clerk

### **5. Historial**

- ✅ `despacho_propiedad_historial` → Mantener
- ✅ `aprobado_por` → Cambiar a TEXT
- ⚠️ Migrar registros existentes

---

## 📝 Plan de Migración Seguro

### **Fase 1: Preparación** (Sin downtime)

1. **Crear columna clerk_id en users**

   ```sql
   ALTER TABLE users ADD COLUMN clerk_id TEXT;
   CREATE INDEX idx_users_clerk_id ON users(clerk_id);
   ```

2. **Duplicar tabla users**

   ```sql
   CREATE TABLE users_backup AS SELECT * FROM users;
   ```

3. **Documentar usuarios existentes**
   ```sql
   SELECT id, email, rol, plan, despacho_id
   FROM users
   WHERE activo = true;
   ```

### **Fase 2: Configurar Clerk** (Sin downtime)

1. Crear cuenta en Clerk
2. Configurar aplicación
3. Instalar dependencias
4. Crear webhooks

### **Fase 3: Implementar Auth** (Testing en dev)

1. Crear componentes Clerk
2. Mantener Supabase Auth como fallback
3. Testing exhaustivo
4. Verificar leads, despachos, permisos

### **Fase 4: Migración de usuarios** (Planificada)

**Opción A: Migración manual**

- Usuarios deben re-registrarse con Clerk
- Mantener datos en Supabase
- Vincular por email

**Opción B: Migración automática**

- Crear usuarios en Clerk via API
- Sincronizar con Supabase
- Costoso en tiempo

### **Fase 5: Deploy** (Con rollback plan)

1. Deploy a producción
2. Monitorear errores
3. Rollback si es necesario
4. Migración gradual de usuarios

---

## ⚠️ RIESGOS Y MITIGACIONES

### **Riesgo 1: Pérdida de datos de usuarios**

**Mitigación:**

- ✅ Backup completo antes de migración
- ✅ Tabla users_backup
- ✅ Mantener Supabase Auth temporalmente

### **Riesgo 2: Referencias rotas (user_id UUID → TEXT)**

**Mitigación:**

- ✅ Mapeo de IDs antiguos → nuevos
- ✅ Tabla users_migration_map
- ✅ Scripts de actualización FK

### **Riesgo 3: Usuarios no pueden acceder a sus despachos**

**Mitigación:**

- ✅ Vincular por email (owner_email)
- ✅ Script de re-asignación
- ✅ Panel admin para resolver manualmente

### **Riesgo 4: Pérdida de historial de leads/compras**

**Mitigación:**

- ✅ NO modificar tabla leads
- ✅ Mantener referencias por user_id (actualizar después)
- ✅ Logging exhaustivo

---

## 📋 Checklist Pre-Migración

```
□ Backup completo de base de datos
□ Documentar todos los usuarios activos
□ Listar todos los despachos con owner_email
□ Verificar integridad de user_despachos
□ Revisar tabla leads (si existe)
□ Exportar configuración Supabase Auth
□ Plan de rollback documentado
□ Testing en entorno de desarrollo
□ Comunicación a usuarios (si aplica)
□ Monitoreo preparado
```

---

## 🎯 Resultado Final

**Beneficios:**

- ✅ Sin límites de registro
- ✅ Verificación de email sin rate limit
- ✅ Mejor UX de autenticación
- ✅ Todos los datos en Supabase (control total)
- ✅ Sistema de leads funcional
- ✅ Propiedad de despachos intacta
- ✅ $0/mes hasta 10k usuarios

**Lo que NO cambia:**

- ✅ Base de datos Supabase
- ✅ Lógica de negocio
- ✅ Sistema de leads
- ✅ Propiedad de despachos
- ✅ Permisos y roles
- ✅ WordPress sync
- ✅ Algolia search

---

## 📞 Siguiente Paso

**¿Proceder con la implementación?**

1. Configurar Clerk
2. Implementar webhooks
3. Crear componentes de Auth
4. Testing exhaustivo
5. Plan de migración de usuarios

**Tiempo estimado:** 4-6 horas
**Riesgo:** Medio (con mitigaciones)
**Beneficio:** Alto (sin límites + mejor UX)
