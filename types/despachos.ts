/**
 * Tipos y interfaces para el manejo de despachos en la aplicación.
 * @module types/despachos
 */

export interface DespachoSummary {
  id: string;
  object_id?: string;
  nombre: string;
  slug?: string;
  num_sedes: number;
  created_at?: string; // Made optional with ?
  estado?: string;
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  owner_nombre?: string | null;
  owner_apellidos?: string | null;
  owner_email?: string | null;
  isOwner?: boolean; // Indica si el usuario actual es propietario del despacho
}

import { SedeWP, DespachoWP as BaseDespachoWP } from './wordpress';

/**
 * Representa una ubicación genérica con información de localización
 */

/**
 * Representa una ubicación con información de dirección y localización
 * @property {string} [localidad] - Nombre de la localidad
 * @property {string} [provincia] - Nombre de la provincia
 * @property {string} [direccion] - Dirección completa
 * @property {string} [codigo_postal] - Código postal
 */
export interface Ubicacion {
  localidad?: string;
  provincia?: string;
  direccion?: string;
  codigo_postal?: string;
  [key: string]: unknown;
}

/**
 * Representa una sede de un despacho, extendiendo la interfaz base de WordPress
 * y añadiendo propiedades específicas de la aplicación
 * @extends SedeWP
 * @extends Ubicacion
 */
export interface Sede extends SedeWP, Ubicacion {
  id?: string | number;
  nombre?: string;
  telefono?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Metadatos extendidos para un despacho
 * @extends Omit<BaseDespachoWP['meta'], '_despacho_sedes'>
 */
export interface MetaData extends Omit<BaseDespachoWP['meta'], '_despacho_sedes'> {
  _despacho_sedes?: Sede[];
  telefono?: string;
  email_contacto?: string;
  direccion?: string;
  codigo_postal?: string;
  [key: string]: unknown;
}

/**
 * Tipo extendido para representar un despacho en la aplicación local
 * @extends Omit<BaseDespachoWP, 'meta' | 'title' | 'content'>
 */
export type LocalDespachoWP = Omit<BaseDespachoWP, 'meta' | 'title' | 'content'> & {
  object_id: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  meta?: MetaData;
  localidad?: string;
  provincia?: string;
  nombre: string;
  email_contacto?: string;
  telefono?: string;
  ubicacion?: Ubicacion;
  [key: string]: unknown;
};

/**
 * Propiedades para el componente BuscadorDespachosWordpress
 * @property {Function} [onImport] - Función que se ejecuta al importar un despacho
 * @property {Function} [onClose] - Función que se ejecuta al cerrar el buscador
 */
export interface BuscadorDespachosProps {
  onImport?: (objectId: string) => Promise<{success: boolean; error?: string}>;
  onClose?: () => void;
}
