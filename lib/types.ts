// Tipos TypeScript para el proyecto Lexhoy Portal

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  fechaRegistro: Date;
  ultimoAcceso?: Date;
  activo: boolean;
  emailVerificado: boolean;
  plan: PlanType;
  despachoId?: string;
}

export interface Despacho {
  id: string;
  userId: string;
  // Datos básicos
  nombre: string;
  descripcion?: string;
  cif?: string;
  telefono: string;
  email: string;
  website?: string;
  
  // Dirección
  direccion: {
    calle: string;
    numero: string;
    piso?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
  };
  
  // Información profesional
  especialidades: string[];
  colegioAbogados?: string;
  numeroColegiadoPrincipal?: string;
  anoFundacion?: number;
  numeroAbogados?: number;
  idiomas: string[];
  
  // Horarios
  horarios?: {
    [key: string]: {
      abierto: boolean;
      horaApertura?: string;
      horaCierre?: string;
    };
  };
  
  // Multimedia
  logo?: string;
  imagenes: string[];
  
  // Configuración
  recibirLeads: boolean;
  radioAccion: number; // km
  presupuestoMinimo?: number;
  presupuestoMaximo?: number;
  
  // Metadata
  fechaCreacion: Date;
  fechaActualizacion: Date;
  verificado: boolean;
  activo: boolean;
  
  // SEO y Algolia
  slug: string;
  puntuacion?: number;
  numeroResenas?: number;
}

export interface Lead {
  id: string;
  // Información del cliente
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  
  // Información de la consulta
  especialidad: string;
  descripcion: string;
  urgencia: UrgenciaLevel;
  presupuestoEstimado?: number;
  
  // Ubicación
  provincia: string;
  ciudad: string;
  codigoPostal?: string;
  
  // Estado y gestión
  estado: LeadStatus;
  fechaCreacion: Date;
  fechaAsignacion?: Date;
  fechaCierre?: Date;
  
  // Asignación
  despachoAsignado?: string;
  despachoContactado?: string[];
  
  // Origen
  fuente: string; // "web", "formulario", "telefono", etc.
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  
  // Seguimiento
  notas?: string;
  valoracion?: number;
  feedback?: string;
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  despachoId: string;
  tipo: InteractionType;
  descripcion?: string;
  fecha: Date;
  resultado?: InteractionResult;
}

export interface Notification {
  id: string;
  userId: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: Date;
  metadata?: Record<string, unknown>;
}

export interface Analytics {
  despachoId: string;
  periodo: {
    inicio: Date;
    fin: Date;
  };
  metrics: {
    leadsRecibidos: number;
    leadsContactados: number;
    leadsConvertidos: number;
    tasaConversion: number;
    tiempoPromedioRespuesta: number; // en minutos
    satisfaccionCliente: number;
  };
}

// Enums
export type PlanType = "basico" | "profesional" | "enterprise";

export type LeadStatus = 
  | "nuevo" 
  | "asignado" 
  | "contactado" 
  | "en_negociacion" 
  | "convertido" 
  | "perdido" 
  | "rechazado";

export type UrgenciaLevel = "baja" | "media" | "alta" | "urgente";

export type InteractionType = 
  | "llamada" 
  | "email" 
  | "reunion" 
  | "propuesta" 
  | "contrato" 
  | "nota";

export type InteractionResult = 
  | "exitoso" 
  | "sin_respuesta" 
  | "reagendar" 
  | "no_interesado" 
  | "convertido";

export type NotificationType = 
  | "nuevo_lead" 
  | "lead_expirado" 
  | "mensaje_sistema" 
  | "actualizacion_perfil" 
  | "facturacion" 
  | "promocion";

// Interfaces para formularios
export interface RegisterDespachoForm {
  // Datos del usuario
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  
  // Datos del despacho
  nombreDespacho: string;
  especialidades: string[];
  provincia: string;
  ciudad: string;
  codigoPostal: string;
  direccion: string;
  telefonoDespacho: string;
  emailDespacho: string;
  website?: string;
  
  // Términos
  aceptaTerminos: boolean;
  aceptaPrivacidad: boolean;
  recibirNewsletter?: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
  recordar?: boolean;
}

export interface ContactForm {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  despacho?: string;
  asunto: string;
  mensaje: string;
  aceptaPrivacidad: boolean;
}

export interface PerfilForm {
  // Datos básicos del despacho
  nombre: string;
  descripcion?: string;
  cif?: string;
  telefono: string;
  email: string;
  website?: string;
  
  // Dirección
  calle: string;
  numero: string;
  piso?: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  
  // Información profesional
  especialidades: string[];
  colegioAbogados?: string;
  numeroColegiadoPrincipal?: string;
  anoFundacion?: number;
  numeroAbogados?: number;
  idiomas: string[];
  
  // Configuración de leads
  recibirLeads: boolean;
  radioAccion: number;
  presupuestoMinimo?: number;
  presupuestoMaximo?: number;
}

// Respuestas de API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Filtros y búsqueda
export interface LeadFilters {
  especialidad?: string;
  provincia?: string;
  urgencia?: UrgenciaLevel;
  fechaDesde?: Date;
  fechaHasta?: Date;
  presupuestoMin?: number;
  presupuestoMax?: number;
  estado?: LeadStatus;
}

export interface DespachoFilters {
  especialidad?: string;
  provincia?: string;
  ciudad?: string;
  verificado?: boolean;
  activo?: boolean;
  puntuacionMin?: number;
}

// Configuración de componentes
export interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: unknown, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
  onClose?: () => void;
}