// Tipos para la integración con WordPress

export interface SedeWP {
  provincia?: string;
  localidad?: string;
  [key: string]: unknown;
}

export interface MetaWP {
  _despacho_sedes?: SedeWP[];
  [key: string]: unknown;
}

export interface DespachoWP {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  meta?: MetaWP;
  [key: string]: unknown;
}

// Respuesta de búsqueda tipada
export interface BusquedaDespachosResponse {
  data: DespachoWP[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Parámetros de búsqueda
export interface BusquedaDespachosParams {
  query?: string;
  id?: string | null;
  provincia?: string;
  localidad?: string;
  page?: number;
  perPage?: number;
}
