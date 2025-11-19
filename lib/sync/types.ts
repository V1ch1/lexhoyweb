/**
 * Tipos compartidos para el sistema de sincronización
 */

export interface Sede {
  id?: string;
  wp_sede_id?: string;
  nombre: string;
  descripcion?: string;
  localidad?: string;
  provincia?: string;
  pais?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  codigo_postal?: string;
  telefono?: string;
  email_contacto?: string;
  web?: string;
  persona_contacto?: string;
  ano_fundacion?: number | null;
  tamano_despacho?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;
  areas_practica?: string[];
  especialidades?: string;
  servicios_especificos?: string;
  foto_perfil?: string;
  horarios?: Record<string, unknown>;
  redes_sociales?: Record<string, unknown>;
  observaciones?: string;
  es_principal?: boolean;
  activa?: boolean;
  estado_verificacion?: string;
  estado_registro?: string;
  is_verified?: boolean;
}

export interface Despacho {
  id: string;
  wordpress_id?: number;
  object_id?: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  estado_verificacion: string;
  estado_publicacion?: string;
  activo?: boolean;
  num_sedes?: number;
  sedes?: Sede[];
}

export interface SyncResult {
  success: boolean;
  error?: string;
  wordpressId?: number;
  objectId?: string;
  message?: string;
}

export interface WordPressDespacho {
  id?: number;
  title: string;
  slug: string;
  content: string;
  status: string;
  meta: Record<string, unknown>;
}
