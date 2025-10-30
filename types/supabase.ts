export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tabla de interacciones con leads
      lead_interactions: {
        Row: {
          id: string
          lead_id: string
          despacho_id: string
          tipo: string
          descripcion: string | null
          fecha: string
          resultado: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          despacho_id: string
          tipo: string
          descripcion?: string | null
          fecha: string
          resultado?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          despacho_id?: string
          tipo?: string
          descripcion?: string | null
          fecha?: string
          resultado?: string | null
          created_at?: string
        }
      },
      
      // Tabla de sedes
      sedes: {
        Row: {
          id: string
          despacho_id: string
          nombre: string
          descripcion: string | null
          direccion: string | null
          calle: string | null
          numero: string | null
          piso: string | null
          localidad: string | null
          provincia: string | null
          codigo_postal: string | null
          pais: string | null
          telefono: string | null
          email_contacto: string | null
          web: string | null
          persona_contacto: string | null
          ano_fundacion: string | null
          tamano_despacho: string | null
          numero_colegiado: string | null
          colegio: string | null
          experiencia: string | null
          especialidades: string | null
          servicios_especificos: string | null
          foto_perfil: string | null
          horarios: Json | null
          redes_sociales: Json | null
          observaciones: string | null
          es_principal: boolean
          activa: boolean
          estado_verificacion: string
          estado_registro: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          despacho_id: string
          nombre: string
          descripcion?: string | null
          direccion?: string | null
          calle?: string | null
          numero?: string | null
          piso?: string | null
          localidad?: string | null
          provincia?: string | null
          codigo_postal?: string | null
          pais?: string | null
          telefono?: string | null
          email_contacto?: string | null
          web?: string | null
          persona_contacto?: string | null
          ano_fundacion?: string | null
          tamano_despacho?: string | null
          numero_colegiado?: string | null
          colegio?: string | null
          experiencia?: string | null
          especialidades?: string | null
          servicios_especificos?: string | null
          foto_perfil?: string | null
          horarios?: Json | null
          redes_sociales?: Json | null
          observaciones?: string | null
          es_principal?: boolean
          activa?: boolean
          estado_verificacion?: string
          estado_registro?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          despacho_id?: string
          nombre?: string
          descripcion?: string | null
          direccion?: string | null
          calle?: string | null
          numero?: string | null
          piso?: string | null
          localidad?: string | null
          provincia?: string | null
          codigo_postal?: string | null
          pais?: string | null
          telefono?: string | null
          email_contacto?: string | null
          web?: string | null
          persona_contacto?: string | null
          ano_fundacion?: string | null
          tamano_despacho?: string | null
          numero_colegiado?: string | null
          colegio?: string | null
          experiencia?: string | null
          especialidades?: string | null
          servicios_especificos?: string | null
          foto_perfil?: string | null
          horarios?: Json | null
          redes_sociales?: Json | null
          observaciones?: string | null
          es_principal?: boolean
          activa?: boolean
          estado_verificacion?: string
          estado_registro?: string
          created_at?: string
          updated_at?: string | null
        }
      },
      
      // Tabla de usuarios
      users: {
        Row: {
          id: string
          email: string
          nombre: string
          apellidos: string | null
          telefono: string | null
          fecha_registro: string
          ultimo_acceso: string | null
          activo: boolean
          email_verificado: boolean
          plan: string
          rol: string
          estado: string
          fecha_aprobacion: string | null
          aprobado_por: string | null
          notas_admin: string | null
          despacho_id: string | null
          created_at: string
          updated_at: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          email: string
          nombre: string
          apellidos?: string | null
          telefono?: string | null
          fecha_registro?: string
          ultimo_acceso?: string | null
          activo?: boolean
          email_verificado?: boolean
          plan?: string
          rol?: string
          estado?: string
          fecha_aprobacion?: string | null
          aprobado_por?: string | null
          notas_admin?: string | null
          despacho_id?: string | null
          created_at?: string
          updated_at?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          nombre?: string
          apellidos?: string | null
          telefono?: string | null
          fecha_registro?: string
          ultimo_acceso?: string | null
          activo?: boolean
          email_verificado?: boolean
          plan?: string
          rol?: string
          estado?: string
          fecha_aprobacion?: string | null
          aprobado_por?: string | null
          notas_admin?: string | null
          despacho_id?: string | null
          created_at?: string
          updated_at?: string | null
          avatar_url?: string | null
        }
      },
      
      // Tabla de solicitudes de despacho
      solicitudes_despacho: {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_name: string
          despacho_id: string | null
          despacho_nombre: string | null
          despacho_localidad: string | null
          despacho_provincia: string | null
          estado: string
          fecha_solicitud: string
          fecha_respuesta: string | null
          respondido_por: string | null
          notas_respuesta: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          user_name: string
          despacho_id?: string | null
          despacho_nombre?: string | null
          despacho_localidad?: string | null
          despacho_provincia?: string | null
          estado?: string
          fecha_solicitud?: string
          fecha_respuesta?: string | null
          respondido_por?: string | null
          notas_respuesta?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          user_name?: string
          despacho_id?: string | null
          despacho_nombre?: string | null
          despacho_localidad?: string | null
          despacho_provincia?: string | null
          estado?: string
          fecha_solicitud?: string
          fecha_respuesta?: string | null
          respondido_por?: string | null
          notas_respuesta?: string | null
          created_at?: string
          updated_at?: string | null
        }
      },
      
      // Tabla de notificaciones
      notificaciones: {
        Row: {
          id: string
          user_id: string
          tipo: string
          titulo: string
          mensaje: string
          leida: boolean
          url: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: string
          titulo: string
          mensaje: string
          leida?: boolean
          url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tipo?: string
          titulo?: string
          mensaje?: string
          leida?: boolean
          url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      },
      
      // Tabla de despachos
      despachos: {
        Row: {
          id: string
          object_id: string
          nombre: string
          descripcion: string | null
          num_sedes: number
          areas_practica: string[]
          ultima_actualizacion: string | null
          slug: string
          activo: boolean
          verificado: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id: string
          nombre: string
          descripcion?: string | null
          num_sedes?: number
          areas_practica?: string[]
          ultima_actualizacion?: string | null
          slug: string
          activo?: boolean
          verificado?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string
          nombre?: string
          descripcion?: string | null
          num_sedes?: number
          areas_practica?: string[]
          ultima_actualizacion?: string | null
          slug?: string
          activo?: boolean
          verificado?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
    },
    
    Views: {
      [_ in never]: never
    },
    
    Functions: {
      [_ in never]: never
    },
    
    Enums: {
      [_ in never]: never
    },
    
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos de ayuda para las tablas
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Tipos para las tablas específicas
export type LeadInteraction = Tables<'lead_interactions'>
export type NewLeadInteraction = Inserts<'lead_interactions'>
export type UpdateLeadInteraction = Updates<'lead_interactions'>

export type Sede = Tables<'sedes'>
export type NewSede = Inserts<'sedes'>
export type UpdateSede = Updates<'sedes'>

export type User = Tables<'users'>
export type NewUser = Inserts<'users'>
export type UpdateUser = Updates<'users'>

export type SolicitudDespacho = Tables<'solicitudes_despacho'>
export type NewSolicitudDespacho = Inserts<'solicitudes_despacho'>
export type UpdateSolicitudDespacho = Updates<'solicitudes_despacho'>

export type Notificacion = Tables<'notificaciones'>
export type NewNotificacion = Inserts<'notificaciones'>
export type UpdateNotificacion = Updates<'notificaciones'>

export type Despacho = Tables<'despachos'>
export type NewDespacho = Inserts<'despachos'>
export type UpdateDespacho = Updates<'despachos'>