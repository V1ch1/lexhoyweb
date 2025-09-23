// Tipos TypeScript para el proyecto Lexhoy Portal - Estructura compatible con Algolia

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
  rol: UserRole;
  estado: UserStatus;
  fechaAprobacion?: Date;
  aprobadoPor?: string;
  notasAdmin?: string;
  despachoId?: string; // Campo legacy - usar user_despachos para relaciones actuales
}

// Nuevas interfaces para el sistema de roles
export interface UserDespacho {
  id: string;
  userId: string;
  despachoId: string;
  fechaAsignacion: Date;
  asignadoPor?: string;
  activo: boolean;
  permisos: {
    leer: boolean;
    escribir: boolean;
    eliminar: boolean;
  };
}

// Nueva interfaz para solicitudes de asignación de despachos
export interface SolicitudAsignacionDespacho {
  id: string;
  userId: string;
  despachoId: string;
  fechaSolicitud: Date;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  justificacion: string; // Por qué el usuario debe tener acceso a este despacho
  tipoSolicitud: 'propiedad' | 'colaboracion' | 'otro';
  documentosAdjuntos?: string[]; // URLs de documentos que comprueban la propiedad
  fechaRespuesta?: Date;
  respondidoPor?: string;
  motivoRechazo?: string;
  notasAdmin?: string;
}

// Interfaz para gestión de despachos en el admin
export interface DespachoGestion {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaCreacion: Date;
  verificado: boolean;
  activo: boolean;
  usuariosAsignados: number;
  solicitudesPendientes: number;
  creadoPor?: string;
}

export interface SolicitudRegistro {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  empresa?: string;
  mensaje?: string;
  datosDespacho?: {
    nombre: string;
    descripcion?: string;
    especialidades: string[];
    provincia: string;
    ciudad: string;
    direccion: string;
    telefono: string;
    email: string;
    website?: string;
  };
  estado: SolicitudStatus;
  fechaSolicitud: Date;
  fechaRespuesta?: Date;
  respondidoPor?: string;
  notasRespuesta?: string;
  userCreadoId?: string;
  despachoCreadoId?: string;
}

export interface SyncLog {
  id: string;
  tipo: 'algolia' | 'wordpress';
  accion: 'create' | 'update' | 'delete';
  entidad: 'despacho' | 'sede' | 'user';
  entidadId: string;
  datosEnviados?: Record<string, unknown>;
  respuestaApi?: Record<string, unknown>;
  exitoso: boolean;
  errorMensaje?: string;
  fechaSync: Date;
  reintentos: number;
}

// Estructura actualizada basada en el ejemplo de Algolia
export interface Despacho {
  id: string;
  object_id: string; // ID único para Algolia
  nombre: string;
  descripcion?: string;
  sedes: Sede[];
  num_sedes: number;
  areas_practica: string[]; // Especialidades principales del despacho
  ultima_actualizacion: string;
  slug: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  verificado?: boolean;
  activo?: boolean;
}

export interface Sede {
  id?: number;
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
  
  // Dirección
  calle?: string;
  numero?: string;
  piso?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  
  // Información profesional
  especialidades?: string;
  servicios_especificos?: string;
  areas_practica: string[];
  
  // Estados
  estado_verificacion: 'pendiente' | 'verificado' | 'rechazado';
  estado_registro: 'activo' | 'inactivo' | 'suspendido';
  is_verified: boolean;
  es_principal: boolean;
  activa: boolean;
  
  // Multimedia y contacto
  foto_perfil?: string;
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
  
  // Notas internas
  observaciones?: string;
}

export interface Lead {
  id: string;
  despacho_id: string;
  sede_id?: string;
  
  // Información del cliente
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
  
  // Información de la consulta
  consulta: string;
  especialidad: string;
  urgencia?: UrgenciaLevel;
  presupuestoEstimado?: number;
  
  // Ubicación
  provincia?: string;
  ciudad?: string;
  codigo_postal?: string;
  
  // Estado y gestión
  estado: 'nuevo' | 'contactado' | 'cerrado';
  fechaCreacion: Date;
  fechaAsignacion?: Date;
  fechaCierre?: Date;
  
  // Origen
  fuente: string;
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
    tiempoPromedioRespuesta: number;
    satisfaccionCliente: number;
  };
}

// Enums
export type PlanType = "basico" | "profesional" | "enterprise";
export type UserRole = "super_admin" | "despacho_admin" | "usuario";
export type UserStatus = "pendiente" | "activo" | "inactivo" | "suspendido";
export type DespachoStatus = "borrador" | "pendiente" | "aprobado" | "rechazado" | "suspendido";
export type SolicitudStatus = "pendiente" | "aprobado" | "rechazado";

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

// Interfaces para formularios actualizadas
export interface RegisterDespachoForm {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  nombreDespacho: string;
  especialidades: string[];
  provincia: string;
  ciudad: string;
  codigoPostal: string;
  direccion: string;
  telefonoDespacho: string;
  emailDespacho: string;
  website?: string;
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
  apellidos?: string;
  email: string;
  telefono?: string;
  despacho?: string;
  asunto: string;
  mensaje: string;
  especialidad?: string;
  aceptaPrivacidad: boolean;
}

export interface SedeForm {
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
  pais?: string;
  especialidades?: string;
  servicios_especificos?: string;
  areas_practica: string[];
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

// Interfaces para integración externa
export interface AlgoliaDespacho {
  objectID: string;
  nombre: string;
  sedes: Sede[];
  num_sedes: number;
  areas_practica: string[];
  ultima_actualizacion: string;
  slug: string;
}

export interface WordPressDespacho {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  slug: string;
  meta: {
    sedes: Sede[];
    areas_practica: string[];
    [key: string]: unknown;
  };
}