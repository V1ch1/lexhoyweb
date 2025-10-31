import { UserDespacho, Despacho } from "../types";

// Extender la interfaz UserDespacho para incluir la propiedad despachos
export interface UserDespachoWithDetails extends UserDespacho {
  despachos?: Despacho;
  nombre?: string;
  localidad?: string;
  provincia?: string;
}
