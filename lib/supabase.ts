import { createClient } from "@supabase/supabase-js";

// Asegurarse de que las variables de entorno se estén cargando
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '*** Key is set ***' : 'Key is missing');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

// Tipos TypeScript para la base de datos
export interface Despacho {
  id: number;
  object_id: string;
  nombre: string;
  descripcion?: string;
  num_sedes: number;
  areas_practica: string[];
  ultima_actualizacion: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Sede {
  id: number;
  despacho_id: number;
  nombre: string;
  descripcion?: string;
  web?: string;
  ano_fundacion?: string;
  tamano_despacho?: string;
  persona_contacto?: string;
  email_contacto?: string;
  telefono?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais: string;
  especialidades?: string;
  servicios_especificos?: string;
  estado_verificacion: string;
  estado_registro: string;
  foto_perfil?: string;
  is_verified: boolean;
  observaciones?: string;
  es_principal: boolean;
  activa: boolean;
  horarios: {
    lunes?: string;
    martes?: string;
    miercoles?: string;
    jueves?: string;
    viernes?: string;
    sabado?: string;
    domingo?: string;
  };
  redes_sociales: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  areas_practica: string[];
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  despacho_id: number;
  sede_id?: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
  consulta: string;
  especialidad: string;
  estado: "nuevo" | "contactado" | "cerrado";
  created_at: string;
}

// Funciones de utilidad
export class DespachoService {
  static async getDespachoByObjectId(objectId: string) {
    const { data, error } = await supabase
      .from("despachos")
      .select(
        `
        *,
        sedes (*)
      `
      )
      .eq("object_id", objectId)
      .single();

    return { data, error };
  }

  static async getSedesByDespacho(despachoId: number) {
    const { data, error } = await supabase
      .from("sedes")
      .select("*")
      .eq("despacho_id", despachoId)
      .order("es_principal", { ascending: false });

    return { data, error };
  }

  static async getLeadsByDespacho(despachoId: number) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("despacho_id", despachoId)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  static async createLead(leadData: Partial<Lead>) {
    const { data, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    return { data, error };
  }

  static async updateSede(sedeId: number, updateData: Partial<Sede>) {
    const { data, error } = await supabase
      .from("sedes")
      .update(updateData)
      .eq("id", sedeId)
      .select()
      .single();

    return { data, error };
  }
}
