/**
 * Representa un usuario autenticado en el sistema
 */
export type AuthUser = {
  /** ID único del usuario en el sistema */
  id: string;
  
  /** Correo electrónico del usuario */
  email: string;
  
  /** Nombre completo del usuario */
  name: string;
  
  /** Rol del usuario en el sistema */
  role: 'super_admin' | 'despacho_admin' | 'usuario';
};

/**
 * Respuesta estándar para operaciones de autenticación
 */
export type AuthResponse = {
  /** Datos del usuario autenticado o null si hubo un error */
  user: AuthUser | null;
  
  /** Mensaje de error en caso de fallo, null si la operación fue exitosa */
  error: string | null;
  
  /** Indica si el usuario ya existe (usado en flujos de registro) */
  exists?: boolean;
};

/**
 * Datos requeridos para registrar un nuevo usuario
 */
export type RegisterUserData = {
  /** Nombre del usuario */
  nombre: string;
  
  /** Apellidos del usuario */
  apellidos: string;
  
  /** Teléfono del usuario (opcional) */
  telefono?: string;
  
  /** Correo electrónico del usuario */
  email: string;
  
  /** Contraseña del usuario (debe tener al menos 6 caracteres) */
  password: string;
};

/**
 * Credenciales para iniciar sesión
 */
export type LoginCredentials = {
  /** Correo electrónico del usuario */
  email: string;
  
  /** Contraseña del usuario */
  password: string;
};
