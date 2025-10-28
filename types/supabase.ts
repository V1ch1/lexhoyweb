export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      despacho_ownership_requests: {
        Row: {
          created_at: string | null
          despacho_id: string
          id: string
          message: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          despacho_id: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          despacho_id?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "despacho_ownership_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      despacho_propiedad_historial: {
        Row: {
          accion: string
          created_at: string | null
          despacho_id: string
          id: string
          metadata: Json | null
          notas: string | null
          realizado_por: string | null
          user_id: string | null
          usuario_anterior: string | null
        }
        Insert: {
          accion: string
          created_at?: string | null
          despacho_id: string
          id?: string
          metadata?: Json | null
          notas?: string | null
          realizado_por?: string | null
          user_id?: string | null
          usuario_anterior?: string | null
        }
        Update: {
          accion?: string
          created_at?: string | null
          despacho_id?: string
          id?: string
          metadata?: Json | null
          notas?: string | null
          realizado_por?: string | null
          user_id?: string | null
          usuario_anterior?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despacho_propiedad_historial_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despacho_propiedad_historial_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despacho_propiedad_historial_usuario_anterior_fkey"
            columns: ["usuario_anterior"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      despachos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          featured_media_url: string | null
          id: string
          nombre: string
          slug: string
          status: string | null
          updated_at: string | null
          wordpress_id: number | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          featured_media_url?: string | null
          id?: string
          nombre: string
          slug: string
          status?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          featured_media_url?: string | null
          id?: string
          nombre?: string
          slug?: string
          status?: string | null
          updated_at?: string | null
          wordpress_id?: number | null
        }
        Relationships: []
      }
      despachos_backup_20241028: {
        Row: {
          ano_fundacion: number | null
          areas_practica: string[] | null
          created_at: string | null
          descripcion: string | null
          email_contacto: string | null
          especialidades: string | null
          estado_registro: string | null
          estado_verificacion: string | null
          foto_perfil: string | null
          id: string | null
          is_verified: boolean | null
          nombre: string | null
          object_id: string | null
          observaciones: string | null
          persona_contacto: string | null
          servicios_especificos: string | null
          slug: string | null
          tamano_despacho: string | null
          telefono_contacto: string | null
          updated_at: string | null
          web: string | null
          wp_metadata: Json | null
        }
        Insert: {
          ano_fundacion?: number | null
          areas_practica?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          email_contacto?: string | null
          especialidades?: string | null
          estado_registro?: string | null
          estado_verificacion?: string | null
          foto_perfil?: string | null
          id?: string | null
          is_verified?: boolean | null
          nombre?: string | null
          object_id?: string | null
          observaciones?: string | null
          persona_contacto?: string | null
          servicios_especificos?: string | null
          slug?: string | null
          tamano_despacho?: string | null
          telefono_contacto?: string | null
          updated_at?: string | null
          web?: string | null
          wp_metadata?: Json | null
        }
        Update: {
          ano_fundacion?: number | null
          areas_practica?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          email_contacto?: string | null
          especialidades?: string | null
          estado_registro?: string | null
          estado_verificacion?: string | null
          foto_perfil?: string | null
          id?: string | null
          is_verified?: boolean | null
          nombre?: string | null
          object_id?: string | null
          observaciones?: string | null
          persona_contacto?: string | null
          servicios_especificos?: string | null
          slug?: string | null
          tamano_despacho?: string | null
          telefono_contacto?: string | null
          updated_at?: string | null
          web?: string | null
          wp_metadata?: Json | null
        }
        Relationships: []
      }
      lead_interactions: {
        Row: {
          created_at: string | null
          descripcion: string | null
          despacho_id: string
          fecha: string | null
          id: string
          lead_id: string
          resultado: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          despacho_id: string
          fecha?: string | null
          id?: string
          lead_id: string
          resultado?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          despacho_id?: string
          fecha?: string | null
          id?: string
          lead_id?: string
          resultado?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ciudad: string | null
          cliente_email: string
          cliente_nombre: string
          cliente_telefono: string | null
          codigo_postal: string | null
          consulta: string
          created_at: string | null
          despacho_id: string
          especialidad: string
          estado: string | null
          fecha_asignacion: string | null
          fecha_cierre: string | null
          fecha_creacion: string | null
          feedback: string | null
          fuente: string | null
          id: string
          notas: string | null
          presupuesto_estimado: number | null
          provincia: string | null
          sede_id: number | null
          updated_at: string | null
          urgencia: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valoracion: number | null
        }
        Insert: {
          ciudad?: string | null
          cliente_email: string
          cliente_nombre: string
          cliente_telefono?: string | null
          codigo_postal?: string | null
          consulta: string
          created_at?: string | null
          despacho_id: string
          especialidad: string
          estado?: string | null
          fecha_asignacion?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          feedback?: string | null
          fuente?: string | null
          id?: string
          notas?: string | null
          presupuesto_estimado?: number | null
          provincia?: string | null
          sede_id?: number | null
          updated_at?: string | null
          urgencia?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valoracion?: number | null
        }
        Update: {
          ciudad?: string | null
          cliente_email?: string
          cliente_nombre?: string
          cliente_telefono?: string | null
          codigo_postal?: string | null
          consulta?: string
          created_at?: string | null
          despacho_id?: string
          especialidad?: string
          estado?: string | null
          fecha_asignacion?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          feedback?: string | null
          fuente?: string | null
          id?: string
          notas?: string | null
          presupuesto_estimado?: number | null
          provincia?: string | null
          sede_id?: number | null
          updated_at?: string | null
          urgencia?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valoracion?: number | null
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          created_at: string | null
          id: string
          leida: boolean | null
          mensaje: string
          metadata: Json | null
          tipo: string
          titulo: string
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          mensaje: string
          metadata?: Json | null
          tipo: string
          titulo: string
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          metadata?: Json | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sedes: {
        Row: {
          activa: boolean | null
          ano_fundacion: number | null
          colegio: string | null
          created_at: string | null
          descripcion: string | null
          despacho_id: string
          direccion: Json | null
          email_contacto: string | null
          es_principal: boolean | null
          estado_registro: string | null
          estado_verificacion: string | null
          experiencia: string | null
          foto_perfil: string | null
          horarios: Json | null
          id: string
          is_verified: boolean | null
          nombre: string
          numero_colegiado: string | null
          observaciones: string | null
          persona_contacto: string | null
          redes_sociales: Json | null
          telefono: string | null
          updated_at: string | null
          web: string | null
          wp_sede_id: string | null
        }
        Insert: {
          activa?: boolean | null
          ano_fundacion?: number | null
          colegio?: string | null
          created_at?: string | null
          descripcion?: string | null
          despacho_id: string
          direccion?: Json | null
          email_contacto?: string | null
          es_principal?: boolean | null
          estado_registro?: string | null
          estado_verificacion?: string | null
          experiencia?: string | null
          foto_perfil?: string | null
          horarios?: Json | null
          id?: string
          is_verified?: boolean | null
          nombre: string
          numero_colegiado?: string | null
          observaciones?: string | null
          persona_contacto?: string | null
          redes_sociales?: Json | null
          telefono?: string | null
          updated_at?: string | null
          web?: string | null
          wp_sede_id?: string | null
        }
        Update: {
          activa?: boolean | null
          ano_fundacion?: number | null
          colegio?: string | null
          created_at?: string | null
          descripcion?: string | null
          despacho_id?: string
          direccion?: Json | null
          email_contacto?: string | null
          es_principal?: boolean | null
          estado_registro?: string | null
          estado_verificacion?: string | null
          experiencia?: string | null
          foto_perfil?: string | null
          horarios?: Json | null
          id?: string
          is_verified?: boolean | null
          nombre?: string
          numero_colegiado?: string | null
          observaciones?: string | null
          persona_contacto?: string | null
          redes_sociales?: Json | null
          telefono?: string | null
          updated_at?: string | null
          web?: string | null
          wp_sede_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sedes_despacho_id_fkey"
            columns: ["despacho_id"]
            isOneToOne: false
            referencedRelation: "despachos"
            referencedColumns: ["id"]
          },
        ]
      }
      sedes_areas_practica: {
        Row: {
          area_nombre: string
          created_at: string | null
          id: number
          sede_id: string
        }
        Insert: {
          area_nombre: string
          created_at?: string | null
          id?: number
          sede_id: string
        }
        Update: {
          area_nombre?: string
          created_at?: string | null
          id?: number
          sede_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sede"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      sedes_backup_20241028: {
        Row: {
          activa: boolean | null
          calle: string | null
          codigo_postal: string | null
          colegio: string | null
          created_at: string | null
          descripcion: string | null
          despacho_id: string | null
          email: string | null
          es_principal: boolean | null
          experiencia: string | null
          foto_perfil: string | null
          horarios: Json | null
          id: string | null
          localidad: string | null
          nombre: string | null
          numero: string | null
          numero_colegiado: string | null
          observaciones: string | null
          pais: string | null
          piso: string | null
          provincia: string | null
          redes_sociales: Json | null
          telefono: string | null
          updated_at: string | null
          web: string | null
          wp_sede_id: string | null
        }
        Insert: {
          activa?: boolean | null
          calle?: string | null
          codigo_postal?: string | null
          colegio?: string | null
          created_at?: string | null
          descripcion?: string | null
          despacho_id?: string | null
          email?: string | null
          es_principal?: boolean | null
          experiencia?: string | null
          foto_perfil?: string | null
          horarios?: Json | null
          id?: string | null
          localidad?: string | null
          nombre?: string | null
          numero?: string | null
          numero_colegiado?: string | null
          observaciones?: string | null
          pais?: string | null
          piso?: string | null
          provincia?: string | null
          redes_sociales?: Json | null
          telefono?: string | null
          updated_at?: string | null
          web?: string | null
          wp_sede_id?: string | null
        }
        Update: {
          activa?: boolean | null
          calle?: string | null
          codigo_postal?: string | null
          colegio?: string | null
          created_at?: string | null
          descripcion?: string | null
          despacho_id?: string | null
          email?: string | null
          es_principal?: boolean | null
          experiencia?: string | null
          foto_perfil?: string | null
          horarios?: Json | null
          id?: string | null
          localidad?: string | null
          nombre?: string | null
          numero?: string | null
          numero_colegiado?: string | null
          observaciones?: string | null
          pais?: string | null
          piso?: string | null
          provincia?: string | null
          redes_sociales?: Json | null
          telefono?: string | null
          updated_at?: string | null
          web?: string | null
          wp_sede_id?: string | null
        }
        Relationships: []
      }
      solicitudes_despacho: {
        Row: {
          despacho_id: string
          despacho_localidad: string | null
          despacho_nombre: string | null
          despacho_provincia: string | null
          estado: string | null
          fecha_respuesta: string | null
          fecha_solicitud: string | null
          id: string
          notas_respuesta: string | null
          respondido_por: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          despacho_id: string
          despacho_localidad?: string | null
          despacho_nombre?: string | null
          despacho_provincia?: string | null
          estado?: string | null
          fecha_respuesta?: string | null
          fecha_solicitud?: string | null
          id?: string
          notas_respuesta?: string | null
          respondido_por?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          despacho_id?: string
          despacho_localidad?: string | null
          despacho_nombre?: string | null
          despacho_provincia?: string | null
          estado?: string | null
          fecha_respuesta?: string | null
          fecha_solicitud?: string | null
          id?: string
          notas_respuesta?: string | null
          respondido_por?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          accion: string
          created_at: string | null
          datos_enviados: Json | null
          entidad: string
          entidad_id: string
          error_mensaje: string | null
          exitoso: boolean | null
          fecha_sync: string | null
          id: string
          reintentos: number | null
          respuesta_api: Json | null
          tipo: string
        }
        Insert: {
          accion: string
          created_at?: string | null
          datos_enviados?: Json | null
          entidad: string
          entidad_id: string
          error_mensaje?: string | null
          exitoso?: boolean | null
          fecha_sync?: string | null
          id?: string
          reintentos?: number | null
          respuesta_api?: Json | null
          tipo: string
        }
        Update: {
          accion?: string
          created_at?: string | null
          datos_enviados?: Json | null
          entidad?: string
          entidad_id?: string
          error_mensaje?: string | null
          exitoso?: boolean | null
          fecha_sync?: string | null
          id?: string
          reintentos?: number | null
          respuesta_api?: Json | null
          tipo?: string
        }
        Relationships: []
      }
      user_despachos: {
        Row: {
          activo: boolean | null
          asignado_por: string | null
          created_at: string | null
          despacho_id: string
          fecha_asignacion: string | null
          id: string
          permisos: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          asignado_por?: string | null
          created_at?: string | null
          despacho_id: string
          fecha_asignacion?: string | null
          id?: string
          permisos?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activo?: boolean | null
          asignado_por?: string | null
          created_at?: string | null
          despacho_id?: string
          fecha_asignacion?: string | null
          id?: string
          permisos?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_despachos_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activo: boolean | null
          apellidos: string
          aprobado_por: string | null
          created_at: string | null
          despacho_id: string | null
          email: string
          email_verificado: boolean | null
          estado: string | null
          fecha_aprobacion: string | null
          fecha_registro: string | null
          id: string
          nombre: string
          notas_admin: string | null
          plan: string | null
          rol: string | null
          telefono: string | null
          ultimo_acceso: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          apellidos: string
          aprobado_por?: string | null
          created_at?: string | null
          despacho_id?: string | null
          email: string
          email_verificado?: boolean | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_registro?: string | null
          id?: string
          nombre: string
          notas_admin?: string | null
          plan?: string | null
          rol?: string | null
          telefono?: string | null
          ultimo_acceso?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          apellidos?: string
          aprobado_por?: string | null
          created_at?: string | null
          despacho_id?: string | null
          email?: string
          email_verificado?: boolean | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_registro?: string | null
          id?: string
          nombre?: string
          notas_admin?: string | null
          plan?: string | null
          rol?: string | null
          telefono?: string | null
          ultimo_acceso?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_areas_sede: {
        Args: { p_areas_nombres: string[]; p_sede_id: string }
        Returns: Json
      }
      cambiar_sede_principal: {
        Args: { despacho_id_param: string; nueva_sede_id: string }
        Returns: undefined
      }
      importar_desde_wordpress: {
        Args: {
          p_descripcion: string
          p_imagen_url: string
          p_nombre: string
          p_sedes: Json
          p_slug: string
          p_status: string
          p_wordpress_id: number
        }
        Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
node.exe : A new version of Supabase CLI is 
available: v2.54.10 (currently installed v2.53.6)
En C:\Program Files\nodejs\npx.ps1: 29 Carácter: 3
+   & $NODE_EXE $NPX_CLI_JS $args
+   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (A new 
    version o...talled v2.53.6):String) [], Remot  
  eException
    + FullyQualifiedErrorId : NativeCommandError
 
We recommend updating regularly for new features 
and bug fixes: https://supabase.com/docs/guides/cli
/getting-started#updating-the-supabase-cli
