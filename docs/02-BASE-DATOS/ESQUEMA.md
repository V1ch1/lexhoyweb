# Documentación de la Base de Datos

## Diagrama de Relaciones

\`\`\`mermaid
erDiagram
USERS ||--o{ USER_DESPACHOS : tiene
USERS ||--o{ DESPACHOS : "aprobado_por"
USERS ||--o{ DESPACHO_PROP_HIST : "realizado_por"
USERS ||--o{ DESPACHO_OWNERSHIP_REQ : "solicita"
DESPACHOS ||--o{ SEDES : tiene
DESPACHOS ||--o{ LEADS : recibe
DESPACHOS ||--o{ USER_DESPACHOS : "asignado_a"
DESPACHOS ||--o{ DESPACHO_PROP_HIST : "historial"
DESPACHOS ||--o{ DESPACHO_OWNERSHIP_REQ : "solicitudes"
LEADS ||--o{ LEAD_INTERACTIONS : "tiene"
SEDES }o--|| DESPACHOS : "pertenece_a"
\`\`\`

## Tablas

### despacho_ownership_requests

Solicitudes de propiedad de despachos

- **id**: uuid (PK, NOT NULL, default: uuid_generate_v4())
- **user_id**: uuid (FK a users.id, NOT NULL)
- **despacho_id**: uuid (FK a despachos.id, NOT NULL)
- **status**: text (NOT NULL, default: 'pending')
- **message**: text (NULLABLE)
- **created_at**: timestamp with time zone (NULLABLE, default: now())
- **updated_at**: timestamp with time zone (NULLABLE, default: now())

### despacho_propiedad_historial

Historial de cambios de propiedad de despachos

- **id**: uuid (PK, NOT NULL, default: gen_random_uuid())
- **despacho_id**: uuid (FK a despachos.id, NOT NULL)
- **user_id**: uuid (FK a users.id, NULLABLE)
- **accion**: text (NOT NULL)
- **realizado_por**: uuid (FK a users.id, NULLABLE)
- **usuario_anterior**: uuid (FK a users.id, NULLABLE)
- **notas**: text (NULLABLE)
- **metadata**: jsonb (NULLABLE, default: '{}'::jsonb)
- **created_at**: timestamp with time zone (NULLABLE, default: now())

### despachos

Información principal de los despachos

- **id**: uuid (PK, NOT NULL, default: uuid_generate_v4())
- **object_id**: character varying (NOT NULL)
- **nombre**: character varying (NOT NULL)
- **descripcion**: text (NULLABLE)
- **num_sedes**: integer (NULLABLE, default: 1)
- **areas_practica**: ARRAY (NULLABLE, default: '{}'::text[])
- **ultima_actualizacion**: timestamp with time zone (NULLABLE, default: now())
- **slug**: character varying (NOT NULL)
- **fecha_creacion**: timestamp with time zone (NULLABLE, default: now())
- **fecha_actualizacion**: timestamp with time zone (NULLABLE, default: now())
- **verificado**: boolean (NULLABLE, default: false)
- **activo**: boolean (NULLABLE, default: true)
- **estado_registro**: character varying (NULLABLE, default: 'borrador')
- **fecha_solicitud**: timestamp with time zone (NULLABLE)
- **fecha_aprobacion**: timestamp with time zone (NULLABLE)
- **aprobado_por**: uuid (FK a users.id, NULLABLE)
- **notas_aprobacion**: text (NULLABLE)
- **sincronizado_algolia**: boolean (NULLABLE, default: false)
- **sincronizado_wordpress**: boolean (NULLABLE, default: false)
- **fecha_sync_algolia**: timestamp with time zone (NULLABLE)
- **fecha_sync_wordpress**: timestamp with time zone (NULLABLE)
- **owner_email**: text (NULLABLE)
- **direccion**: text (NULLABLE)
- **telefono**: text (NULLABLE)
- **email**: text (NULLABLE)
- **web**: text (NULLABLE)
- **wp_post_id**: integer (NULLABLE)
- **sincronizado_wp**: boolean (NULLABLE, default: false)
- **ultima_sincronizacion**: timestamp without time zone (NULLABLE)

### leads

Gestión de leads/clientes potenciales

- **id**: uuid (PK, NOT NULL, default: uuid_generate_v4())
- **despacho_id**: uuid (FK a despachos.id, NOT NULL)
- **sede_id**: integer (FK a sedes.id, NULLABLE)
- **cliente_nombre**: character varying (NOT NULL)
- **cliente_email**: character varying (NOT NULL)
- **cliente_telefono**: character varying (NULLABLE)
- **consulta**: text (NOT NULL)
- **especialidad**: character varying (NOT NULL)
- **urgencia**: character varying (NULLABLE, default: 'media')
- **presupuesto_estimado**: numeric (NULLABLE)
- **provincia**: character varying (NULLABLE)
- **ciudad**: character varying (NULLABLE)
- **codigo_postal**: character varying (NULLABLE)
- **estado**: character varying (NULLABLE, default: 'nuevo')
- **fecha_creacion**: timestamp with time zone (NULLABLE, default: now())
- **fecha_asignacion**: timestamp with time zone (NULLABLE)
- **fecha_cierre**: timestamp with time zone (NULLABLE)
- **fuente**: character varying (NULLABLE, default: 'web')
- **utm_source**: character varying (NULLABLE)
- **utm_medium**: character varying (NULLABLE)
- **utm_campaign**: character varying (NULLABLE)
- **notas**: text (NULLABLE)
- **valoracion**: integer (NULLABLE)
- **feedback**: text (NULLABLE)
- **created_at**: timestamp with time zone (NULLABLE, default: now())
- **updated_at**: timestamp with time zone (NULLABLE, default: now())

### lead_interactions

Interacciones con los leads

- **id**: uuid (PK, NOT NULL, default: uuid_generate_v4())
- **lead_id**: uuid (FK a leads.id, NOT NULL)
- **despacho_id**: uuid (FK a despachos.id, NOT NULL)
- **tipo**: character varying (NOT NULL)
- **descripcion**: text (NULLABLE)
- **fecha**: timestamp with time zone (NULLABLE, default: now())
- **resultado**: character varying (NULLABLE)
- **created_at**: timestamp with time zone (NULLABLE, default: now())

### notificaciones

Sistema de notificaciones

- **id**: uuid (PK, NOT NULL, default: gen_random_uuid())
- **user_id**: text (NOT NULL)
- **tipo**: text (NOT NULL)
- **titulo**: text (NOT NULL)
- **mensaje**: text (NOT NULL)
- **leida**: boolean (NULLABLE, default: false)
- **url**: text (NULLABLE)
- **metadata**: jsonb (NULLABLE, default: '{}'::jsonb)
- **created_at**: timestamp without time zone (NULLABLE, default: now())
- **updated_at**: timestamp without time zone (NULLABLE, default: now())

### sedes

Sedes de los despachos

**Campos básicos**:
- **id**: integer (PK, NOT NULL, default: nextval('sedes_id_seq'::regclass))
- **idx**: integer (NULLABLE)
- **despacho_id**: uuid (FK a despachos.id, NOT NULL)
- **wp_sede_id**: integer (NULLABLE)
- **nombre**: character varying (NOT NULL)
- **descripcion**: text (NULLABLE)

**Ubicación**:
- **calle**: character varying (NULLABLE)
- **numero**: character varying (NULLABLE)
- **piso**: character varying (NULLABLE)
- **localidad**: character varying (NULLABLE)
- **provincia**: character varying (NULLABLE)
- **codigo_postal**: character varying (NULLABLE)
- **pais**: character varying (NULLABLE, default: 'España')
- **direccion**: jsonb (NULLABLE) - Objeto con estructura completa de dirección

**Contacto**:
- **telefono**: character varying (NULLABLE)
- **email_contacto**: character varying (NULLABLE)
- **persona_contacto**: character varying (NULLABLE)
- **web**: character varying (NULLABLE)

**Información profesional**:
- **numero_colegiado**: character varying (NULLABLE)
- **colegio**: character varying (NULLABLE)
- **experiencia**: text (NULLABLE)
- **areas_practica**: text[] (NULLABLE) - Array de áreas de práctica
- **especialidades**: text (NULLABLE)
- **servicios_especificos**: text (NULLABLE)

**Información adicional**:
- **ano_fundacion**: integer (NULLABLE)
- **tamano_despacho**: character varying (NULLABLE)

**Estado**:
- **es_principal**: boolean (NULLABLE, default: false)
- **activa**: boolean (NULLABLE, default: true)
- **estado_verificacion**: character varying (NULLABLE)
- **estado_registro**: character varying (NULLABLE)
- **is_verified**: boolean (NULLABLE)

**Multimedia**:
- **foto_perfil**: text (NULLABLE) - URL de la foto

**Datos estructurados (JSONB)**:
- **horarios**: jsonb (NULLABLE) - Horarios de atención
- **redes_sociales**: jsonb (NULLABLE) - Enlaces a redes sociales
- **observaciones**: text (NULLABLE)

**Auditoría**:
- **created_at**: timestamp with time zone (NULLABLE, default: now())
- **updated_at**: timestamp with time zone (NULLABLE, default: now())

### users

Usuarios del sistema

- **id**: uuid (PK, NOT NULL)
- **despacho_id**: uuid (FK a despachos.id, NULLABLE)
- **aprobado_por**: uuid (FK a users.id, NULLABLE)
- **created_at**: timestamp with time zone (NULLABLE, default: now())
- **updated_at**: timestamp with time zone (NULLABLE, default: now())

### user_despachos

Relación muchos a muchos entre usuarios y despachos

- **id**: uuid (PK, NOT NULL, default: uuid_generate_v4())
- **user_id**: uuid (FK a users.id, NOT NULL)
- **despacho_id**: uuid (FK a despachos.id, NOT NULL)
- **asignado_por**: uuid (FK a users.id, NULLABLE)
- **rol**: text (NULLABLE)
- **created_at**: timestamp with time zone (NULLABLE, default: now())
- **updated_at**: timestamp with time zone (NULLABLE, default: now())

## Índices Recomendados

1. **despacho_ownership_requests**:
   - Índice en (user_id, status) para búsquedas de solicitudes por usuario
   - Índice en (despacho_id, status) para búsquedas por despacho

2. **despachos**:
   - Índice en (slug) para búsquedas por URL
   - Índice en (estado_registro) para filtrar por estado
   - Índice en (owner_email) para búsquedas por email
   - Índice en (aprobado_por) para búsquedas por aprobador

3. **leads**:
   - Índice en (despacho_id, estado) para consultas de panel
   - Índice en (fecha_creacion) para análisis temporales
   - Índice en (cliente_email) para búsquedas por email
   - Índice en (sede_id) para consultas por sede

4. **sedes**:
   - Índice en (despacho_id) para consultas de sedes por despacho

5. **users**:
   - Índice en (despacho_id) para consultas de usuarios por despacho
   - Índice en (aprobado_por) para seguimiento de aprobaciones

6. **user_despachos**:
   - Índice único en (user_id, despacho_id) para evitar duplicados
   - Índice en (despacho_id) para búsquedas por despacho
   - Índice en (asignado_por) para seguimiento de asignaciones

## Políticas RLS Recomendadas

1. **despachos**:
   - Los usuarios solo pueden ver/editar despachos donde son propietarios o están asignados
   - Solo administradores pueden ver todos los despachos

2. **leads**:
   - Los usuarios solo pueden ver/editar leads de sus despachos asignados
   - Restringir acceso a información sensible según el rol

3. **user_despachos**:
   - Los usuarios solo pueden ver sus propias asignaciones
   - Solo administradores pueden gestionar asignaciones

4. **despacho_ownership_requests**:
   - Los usuarios solo pueden ver sus propias solicitudes
   - Los administradores pueden ver todas las solicitudes

## Scripts Útiles

### Crear índices

\`\`\`sql
-- Índices para despachos
CREATE INDEX idx_despachos_slug ON public.despachos(slug);
CREATE INDEX idx_despachos_estado ON public.despachos(estado_registro);
CREATE INDEX idx_despachos_aprobado_por ON public.despachos(aprobado_por);

-- Índices para leads
CREATE INDEX idx_leads_despacho_estado ON public.leads(despacho_id, estado);
CREATE INDEX idx_leads_fecha_creacion ON public.leads(fecha_creacion);
CREATE INDEX idx_leads_sede ON public.leads(sede_id);

-- Índices para user_despachos
CREATE UNIQUE INDEX idx_user_despachos_unique ON public.user_despachos(user_id, despacho_id);
CREATE INDEX idx_user_despachos_despacho ON public.user_despachos(despacho_id);
\`\`\`

### Políticas de Seguridad Básicas

\`\`\`sql
-- Políticas para despachos
CREATE POLICY "Los usuarios pueden ver sus despachos"
ON public.despachos FOR SELECT
USING (
id IN (
SELECT despacho_id
FROM public.user_despachos
WHERE user_id = auth.uid()
)
OR id IN (
SELECT id
FROM public.despachos
WHERE aprobado_por = auth.uid()
)
);

-- Políticas para leads
CREATE POLICY "Los usuarios pueden ver leads de sus despachos"
ON public.leads FOR SELECT
USING (
despacho_id IN (
SELECT despacho_id
FROM public.user_despachos
WHERE user_id = auth.uid()
)
);
\`\`\`

## Flujos Importantes

1. **Solicitud de Propiedad**:
   - Usuario crea una solicitud en `despacho_ownership_requests`
   - Se registra el evento en `despacho_propiedad_historial`
   - Administrador aprueba/rechaza la solicitud
   - Si se aprueba, se actualiza `despachos.aprobado_por` y se crea registro en `user_despachos`

2. **Gestión de Leads**:
   - Se crea un nuevo lead en `leads`
   - Se registran interacciones en `lead_interactions`
   - Se actualiza el estado del lead según avanza el proceso

3. **Notificaciones**:
   - Se generan notificaciones para eventos importantes
   - Las notificaciones pueden incluir enlaces a la acción correspondiente
     `;

// Creando el archivo de tipos TypeScript
const typesFile = `// types/supabase.ts
export type Json =
| string
| number
| boolean
| null
| { [key: string]: Json | undefined }
| Json[];

export interface Database {
public: {
Tables: {
despacho_ownership_requests: {
Row: {
id: string;
user_id: string;
despacho_id: string;
status: string;
message: string | null;
created_at: string | null;
updated_at: string | null;
};
Insert: {
id?: string;
user_id: string;
despacho_id: string;
status?: string;
message?: string | null;
created_at?: string | null;
updated_at?: string | null;
};
Update: {
id?: string;
user_id?: string;
despacho_id?: string;
status?: string;
message?: string | null;
created_at?: string | null;
updated_at?: string | null;
};
Relationships: [
{
foreignKeyName: "despacho_ownership_requests_despacho_id_fkey";
columns: ["despacho_id"];
referencedRelation: "despachos";
referencedColumns: ["id"];
},
{
foreignKeyName: "despacho_ownership_requests_user_id_fkey";
columns: ["user_id"];
referencedRelation: "users";
referencedColumns: ["id"];
}
];
};

      despacho_propiedad_historial: {
        Row: {
          id: string;
          despacho_id: string;
          user_id: string | null;
          accion: string;
          realizado_por: string | null;
          usuario_anterior: string | null;
          notas: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          despacho_id: string;
          user_id?: string | null;
          accion: string;
          realizado_por?: string | null;
          usuario_anterior?: string | null;
          notas?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          despacho_id?: string;
          user_id?: string | null;
          accion?: string;
          realizado_por?: string | null;
          usuario_anterior?: string | null;
          notas?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "despacho_propiedad_historial_despacho_id_fkey";
            columns: ["despacho_id"];
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "despacho_propiedad_historial_realizado_por_fkey";
            columns: ["realizado_por"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "despacho_propiedad_historial_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "despacho_propiedad_historial_usuario_anterior_fkey";
            columns: ["usuario_anterior"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      despachos: {
        Row: {
          id: string;
          object_id: string;
          nombre: string;
          descripcion: string | null;
          num_sedes: number | null;
          areas_practica: string[] | null;
          ultima_actualizacion: string | null;
          slug: string;
          fecha_creacion: string | null;
          fecha_actualizacion: string | null;
          verificado: boolean | null;
          activo: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          estado_registro: string | null;
          fecha_solicitud: string | null;
          fecha_aprobacion: string | null;
          aprobado_por: string | null;
          notas_aprobacion: string | null;
          sincronizado_algolia: boolean | null;
          sincronizado_wordpress: boolean | null;
          fecha_sync_algolia: string | null;
          fecha_sync_wordpress: string | null;
          owner_email: string | null;
          direccion: string | null;
          telefono: string | null;
          email: string | null;
          web: string | null;
          wp_post_id: number | null;
          sincronizado_wp: boolean | null;
          ultima_sincronizacion: string | null;
        };
        Insert: {
          id?: string;
          object_id: string;
          nombre: string;
          descripcion?: string | null;
          num_sedes?: number | null;
          areas_practica?: string[] | null;
          ultima_actualizacion?: string | null;
          slug: string;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
          verificado?: boolean | null;
          activo?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          estado_registro?: string | null;
          fecha_solicitud?: string | null;
          fecha_aprobacion?: string | null;
          aprobado_por?: string | null;
          notas_aprobacion?: string | null;
          sincronizado_algolia?: boolean | null;
          sincronizado_wordpress?: boolean | null;
          fecha_sync_algolia?: string | null;
          fecha_sync_wordpress?: string | null;
          owner_email?: string | null;
          direccion?: string | null;
          telefono?: string | null;
          email?: string | null;
          web?: string | null;
          wp_post_id?: number | null;
          sincronizado_wp?: boolean | null;
          ultima_sincronizacion?: string | null;
        };
        Update: {
          id?: string;
          object_id?: string;
          nombre?: string;
          descripcion?: string | null;
          num_sedes?: number | null;
          areas_practica?: string[] | null;
          ultima_actualizacion?: string | null;
          slug?: string;
          fecha_creacion?: string | null;
          fecha_actualizacion?: string | null;
          verificado?: boolean | null;
          activo?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          estado_registro?: string | null;
          fecha_solicitud?: string | null;
          fecha_aprobacion?: string | null;
          aprobado_por?: string | null;
          notas_aprobacion?: string | null;
          sincronizado_algolia?: boolean | null;
          sincronizado_wordpress?: boolean | null;
          fecha_sync_algolia?: string | null;
          fecha_sync_wordpress?: string | null;
          owner_email?: string | null;
          direccion?: string | null;
          telefono?: string | null;
          email?: string | null;
          web?: string | null;
          wp_post_id?: number | null;
          sincronizado_wp?: boolean | null;
          ultima_sincronizacion?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "despachos_aprobado_por_fkey";
            columns: ["aprobado_por"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      leads: {
        Row: {
          id: string;
          despacho_id: string;
          sede_id: number | null;
          cliente_nombre: string;
          cliente_email: string;
          cliente_telefono: string | null;
          consulta: string;
          especialidad: string;
          urgencia: string | null;
          presupuesto_estimado: number | null;
          provincia: string | null;
          ciudad: string | null;
          codigo_postal: string | null;
          estado: string | null;
          fecha_creacion: string | null;
          fecha_asignacion: string | null;
          fecha_cierre: string | null;
          fuente: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          notas: string | null;
          valoracion: number | null;
          feedback: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          despacho_id: string;
          sede_id?: number | null;
          cliente_nombre: string;
          cliente_email: string;
          cliente_telefono?: string | null;
          consulta: string;
          especialidad: string;
          urgencia?: string | null;
          presupuesto_estimado?: number | null;
          provincia?: string | null;
          ciudad?: string | null;
          codigo_postal?: string | null;
          estado?: string | null;
          fecha_creacion?: string | null;
          fecha_asignacion?: string | null;
          fecha_cierre?: string | null;
          fuente?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          notas?: string | null;
          valoracion?: number | null;
          feedback?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          despacho_id?: string;
          sede_id?: number | null;
          cliente_nombre?: string;
          cliente_email?: string;
          cliente_telefono?: string | null;
          consulta?: string;
          especialidad?: string;
          urgencia?: string | null;
          presupuesto_estimado?: number | null;
          provincia?: string | null;
          ciudad?: string | null;
          codigo_postal?: string | null;
          estado?: string | null;
          fecha_creacion?: string | null;
          fecha_asignacion?: string | null;
          fecha_cierre?: string | null;
          fuente?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          notas?: string | null;
          valoracion?: number | null;
          feedback?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_despacho_id_fkey";
            columns: ["despacho_id"];
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_sede_id_fkey";
            columns: ["sede_id"];
            referencedRelation: "sedes";
            referencedColumns: ["id"];
          }
        ];
      };

      lead_interactions: {
        Row: {
          id: string;
          lead_id: string;
          despacho_id: string;
          tipo: string;
          descripcion: string | null;
          fecha: string | null;
          resultado: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          despacho_id: string;
          tipo: string;
          descripcion?: string | null;
          fecha?: string | null;
          resultado?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          despacho_id?: string;
          tipo?: string;
          descripcion?: string | null;
          fecha?: string | null;
          resultado?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_interactions_despacho_id_fkey";
            columns: ["despacho_id"];
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_interactions_lead_id_fkey";
            columns: ["lead_id"];
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };

      notificaciones: {
        Row: {
          id: string;
          user_id: string;
          tipo: string;
          titulo: string;
          mensaje: string;
          leida: boolean | null;
          url: string | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tipo: string;
          titulo: string;
          mensaje: string;
          leida?: boolean | null;
          url?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tipo?: string;
          titulo?: string;
          mensaje?: string;
          leida?: boolean | null;
          url?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      sedes: {
        Row: {
          id: number;
          despacho_id: string;
          nombre: string;
          descripcion: string | null;
          web: string | null;
          ano_fundacion: string | null;
          tamano_despacho: string | null;
          persona_contacto: string | null;
          email_contacto: string | null;
        };
        Insert: {
          id?: number;
          despacho_id: string;
          nombre: string;
          descripcion?: string | null;
          web?: string | null;
          ano_fundacion?: string | null;
          tamano_despacho?: string | null;
          persona_contacto?: string | null;
          email_contacto?: string | null;
        };
        Update: {
          id?: number;
          despacho_id?: string;
          nombre?: string;
          descripcion?: string | null;
          web?: string | null;
          ano_fundacion?: string | null;
          tamano_despacho?: string | null;
          persona_contacto?: string | null;
          email_contacto?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sedes_despacho_id_fkey";
            columns: ["despacho_id"];
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          }
        ];
      };

      users: {
        Row: {
          id: string;
          despacho_id: string | null;
          aprobado_por: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          despacho_id?: string | null;
          aprobado_por?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          despacho_id?: string | null;
          aprobado_por?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_aprobado_por_fkey";
            columns: ["aprobado_por"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_despacho_id_fkey";
            columns: ["despacho_id"];
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          }
        ];
      };

      user_despachos: {
        Row: {
          id: string;
          user_id: string;
          despacho_id: string;
          asignado_por: string | null;
          rol: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          despacho_id: string;
          asignado_por?: string | null;
          rol?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          despacho_id?: string;
          asignado_por?: string | null;
          rol?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_despachos_asignado_por_fkey";
            columns: ["asignado_por"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_despachos_despacho_id_fkey";
            columns: ["despacho_id"];
            referencedRelation: "despachos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_despachos_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
## Funciones

```sql
-- Función para obtener el despacho actual de un usuario
CREATE OR REPLACE FUNCTION public.get_user_despacho(user_id uuid)
RETURNS uuid AS $$
  SELECT despacho_id 
  FROM public.user_despachos 
  WHERE user_id = $1 
  AND activo = true 
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Función para verificar si un usuario es propietario de un despacho
CREATE OR REPLACE FUNCTION public.is_despacho_owner(user_id uuid, despacho_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.despachos 
    WHERE id = $2 
    AND propietario_id = $1
  );
$$ LANGUAGE sql STABLE;

-- Función para obtener el rol de un usuario en un despacho
CREATE OR REPLACE FUNCTION public.get_user_despacho_role(user_id uuid, despacho_id uuid)
RETURNS text AS $$
  SELECT rol 
  FROM public.user_despachos 
  WHERE user_id = $1 
  AND despacho_id = $2 
  AND activo = true 
  LIMIT 1;
$$ LANGUAGE sql STABLE;
```

## Triggers

```sql
-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a las tablas que lo necesiten
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_despachos_updated_at
BEFORE UPDATE ON public.despachos
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
```

## Vistas útiles

```sql
-- Vista para ver los despachos con información de propietario
CREATE OR REPLACE VIEW public.despachos_con_propietario AS
SELECT 
  d.*,
  u.email as propietario_email,
  u.full_name as propietario_nombre
FROM 
  public.despachos d
  LEFT JOIN public.users u ON d.propietario_id = u.id;

-- Vista para ver los leads con información de asignación
CREATE OR REPLACE VIEW public.leads_con_asignacion AS
SELECT 
  l.*,
  u.email as asignado_email,
  u.full_name as asignado_nombre,
  d.nombre as despacho_nombre
FROM 
  public.leads l
  LEFT JOIN public.users u ON l.asignado_a = u.id
  LEFT JOIN public.despachos d ON l.despacho_id = d.id;
```

## Consideraciones de rendimiento

1. **Índices**: Se han definido índices para las columnas más utilizadas en las cláusulas WHERE y JOIN.

2. **Particionamiento**: Para tablas muy grandes como `lead_interactions`, considera particionar por rango de fechas.

3. **Mantenimiento**: Programa tareas de mantenimiento periódicas para VACUUM y ANALYZE.

4. **Backup**: Configura copias de seguridad regulares de la base de datos.

5. **Monitoreo**: Monitorea el rendimiento de las consultas más frecuentes.

## Migraciones

Para realizar cambios en la estructura de la base de datos, utiliza migraciones. Aquí hay un ejemplo de cómo crear una migración para agregar una nueva columna:

```sql
-- migrations/20231022_add_campo_nuevo.sql
BEGIN;

-- Asegúrate de que la transacción sea atómica
ALTER TABLE public.despachos 
ADD COLUMN IF NOT EXISTS nuevo_campo text;

-- Actualiza los registros existentes si es necesario
-- UPDATE public.despachos SET nuevo_campo = 'valor_predeterminado' WHERE nuevo_campo IS NULL;

-- Si necesitas un valor por defecto
-- ALTER TABLE public.despachos ALTER COLUMN nuevo_campo SET DEFAULT 'valor_predeterminado';

-- Si necesitas hacer que la columna sea NOT NULL después de la migración inicial
-- ALTER TABLE public.despachos ALTER COLUMN nuevo_campo SET NOT NULL;

COMMIT;
```
