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
      despacho_ownership_requests: {
        Row: {
          id: string
          user_id: string
          despacho_id: string
          status: string
          message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          despacho_id: string
          status?: string
          message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          despacho_id?: string
          status?: string
          message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despacho_ownership_requests_despacho_id_fkey"
            columns: ["despacho_id"]
            referencedRelation: "despachos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despacho_ownership_requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      despacho_propiedad_historial: {
        Row: {
          id: string
          despacho_id: string
          anterior_propietario_id: string | null
          nuevo_propietario_id: string | null
          realizado_por: string
          fecha_cambio: string
          motivo: string | null
        }
        Insert: {
          id?: string
          despacho_id: string
          anterior_propietario_id?: string | null
          nuevo_propietario_id?: string | null
          realizado_por: string
          fecha_cambio?: string
          motivo?: string | null
        }
        Update: {
          id?: string
          despacho_id?: string
          anterior_propietario_id?: string | null
          nuevo_propietario_id?: string | null
          realizado_por?: string
          fecha_cambio?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despacho_propiedad_historial_anterior_propietario_id_fkey"
            columns: ["anterior_propietario_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despacho_propiedad_historial_despacho_id_fkey"
            columns: ["despacho_id"]
            referencedRelation: "despachos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despacho_propiedad_historial_nuevo_propietario_id_fkey"
            columns: ["nuevo_propietario_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despacho_propiedad_historial_realizado_por_fkey"
            columns: ["realizado_por"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      despachos: {
        Row: {
          id: string
          nombre: string
          direccion: string | null
          telefono: string | null
          email: string | null
          web: string | null
          logo_url: string | null
          activo: boolean
          fecha_creacion: string
          fecha_actualizacion: string | null
          creado_por: string | null
          aprobado_por: string | null
          fecha_aprobacion: string | null
          sede_id: string | null
          tipo_despacho: string
          propietario_id: string | null
        }
        Insert: {
          id?: string
          nombre: string
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          web?: string | null
          logo_url?: string | null
          activo?: boolean
          fecha_creacion?: string
          fecha_actualizacion?: string | null
          creado_por?: string | null
          aprobado_por?: string | null
          fecha_aprobacion?: string | null
          sede_id?: string | null
          tipo_despacho?: string
          propietario_id?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          web?: string | null
          logo_url?: string | null
          activo?: boolean
          fecha_creacion?: string
          fecha_actualizacion?: string | null
          creado_por?: string | null
          aprobado_por?: string | null
          fecha_aprobacion?: string | null
          sede_id?: string | null
          tipo_despacho?: string
          propietario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despachos_aprobado_por_fkey"
            columns: ["aprobado_por"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_creado_por_fkey"
            columns: ["creado_por"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_propietario_id_fkey"
            columns: ["propietario_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_sede_id_fkey"
            columns: ["sede_id"]
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          nombre: string
          apellidos: string | null
          email: string | null
          telefono: string | null
          origen: string | null
          estado: string
          fecha_creacion: string
          fecha_actualizacion: string | null
          despacho_id: string
          asignado_a: string | null
        }
        Insert: {
          id?: string
          nombre: string
          apellidos?: string | null
          email?: string | null
          telefono?: string | null
          origen?: string | null
          estado?: string
          fecha_creacion?: string
          fecha_actualizacion?: string | null
          despacho_id: string
          asignado_a?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          apellidos?: string | null
          email?: string | null
          telefono?: string | null
          origen?: string | null
          estado?: string
          fecha_creacion?: string
          fecha_actualizacion?: string | null
          despacho_id?: string
          asignado_a?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_asignado_a_fkey"
            columns: ["asignado_a"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_despacho_id_fkey"
            columns: ["despacho_id"]
            referencedRelation: "despachos"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_interactions: {
        Row: {
          id: string
          lead_id: string
          tipo: string
          descripcion: string | null
          fecha: string
          usuario_id: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          tipo: string
          descripcion?: string | null
          fecha?: string
          usuario_id?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          tipo?: string
          descripcion?: string | null
          fecha?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sedes: {
        Row: {
          id: string
          nombre: string
          direccion: string | null
          ciudad: string | null
          codigo_postal: string | null
          pais: string | null
          telefono: string | null
          email: string | null
          responsable_id: string | null
        }
        Insert: {
          id?: string
          nombre: string
          direccion?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          pais?: string | null
          telefono?: string | null
          email?: string | null
          responsable_id?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          direccion?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          pais?: string | null
          telefono?: string | null
          email?: string | null
          responsable_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sedes_responsable_id_fkey"
            columns: ["responsable_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_despachos: {
        Row: {
          id: string
          user_id: string
          despacho_id: string
          rol: string
          fecha_asignacion: string
          activo: boolean
        }
        Insert: {
          id?: string
          user_id: string
          despacho_id: string
          rol?: string
          fecha_asignacion?: string
          activo?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          despacho_id?: string
          rol?: string
          fecha_asignacion?: string
          activo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_despachos_despacho_id_fkey"
            columns: ["despacho_id"]
            referencedRelation: "despachos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_despachos_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string | null
          updated_at: string | null
          full_name: string | null
          avatar_url: string | null
          telefono: string | null
          fecha_nacimiento: string | null
          genero: string | null
          dni: string | null
          direccion: string | null
          ciudad: string | null
          codigo_postal: string | null
          pais: string | null
          ultimo_acceso: string | null
          activo: boolean
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string | null
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          dni?: string | null
          direccion?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          pais?: string | null
          ultimo_acceso?: string | null
          activo?: boolean
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string | null
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          dni?: string | null
          direccion?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          pais?: string | null
          ultimo_acceso?: string | null
          activo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_despacho: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      is_despacho_owner: {
        Args: {
          user_id: string
          despacho_id: string
        }
        Returns: boolean
      }
      get_user_despacho_role: {
        Args: {
          user_id: string
          despacho_id: string
        }
        Returns: string
      }
      update_modified_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]