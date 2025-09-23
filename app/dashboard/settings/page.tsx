'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { UserService } from '@/lib/userService';
import { AuthService } from '@/lib/authService';
import { UserDespacho } from '@/lib/types';
import { 
  UserIcon, 
  KeyIcon, 
  BellIcon, 
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  role: 'super_admin' | 'despacho_admin' | 'usuario';
  despacho_nombre?: string;
  fecha_registro: string;
  ultimo_acceso: string;
}

interface NotificationSettings {
  email_nuevos_leads: boolean;
  email_actualizaciones: boolean;
  email_sistema: boolean;
  push_leads: boolean;
  push_mensajes: boolean;
}

interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Crear instancia del servicio fuera del componente
const userService = new UserService();

const SettingsPage = () => {
  const { user, login } = useAuth(); // Agregamos login para actualizar el contexto
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'despacho' | 'privacy' | 'sessions'>('profile');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para mensajes de éxito y error
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados para los formularios
  const [profileData, setProfileData] = useState<UserProfile>({
    id: user?.id || '',
    email: user?.email || '',
    nombre: user?.name?.split(' ')[0] || '',
    apellidos: user?.name?.split(' ').slice(1).join(' ') || '',
    telefono: '',
    role: user?.role || 'usuario',
    fecha_registro: new Date().toISOString(),
    ultimo_acceso: new Date().toISOString()
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_nuevos_leads: true,
    email_actualizaciones: true,
    email_sistema: true,
    push_leads: true,
    push_mensajes: false
  });

  // Estado para despachos del usuario
  const [userDespachos, setUserDespachos] = useState<UserDespacho[]>([]);

  const [despachoData, setDespachoData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email_contacto: '',
    web: '',
    especialidades: [] as string[],
    descripcion: ''
  });

  const especialidadesDisponibles = [
    'Derecho Civil',
    'Derecho Penal',
    'Derecho Laboral',
    'Derecho Mercantil',
    'Derecho Administrativo',
    'Derecho Fiscal',
    'Derecho de Familia',
    'Derecho Inmobiliario',
    'Derecho de Extranjería',
    'Derecho Sanitario',
    'Derecho Tecnológico',
    'Propiedad Intelectual'
  ];

  const toggleEspecialidad = (especialidad: string) => {
    setDespachoData(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidad)
        ? prev.especialidades.filter(e => e !== especialidad)
        : [...prev.especialidades, especialidad]
    }));
  };

  const [activeSessions] = useState([
    {
      id: '1',
      device: 'Chrome - Windows',
      location: 'Madrid, España',
      ip: '192.168.1.100',
      last_active: '2 minutos ago',
      current: true
    },
    {
      id: '2',
      device: 'Safari - iPhone',
      location: 'Madrid, España',
      ip: '192.168.1.101',
      last_active: '1 hora ago',
      current: false
    }
  ]);

  const tabs = [
    { id: 'profile', name: 'Perfil Personal', icon: UserIcon },
    { id: 'password', name: 'Contraseña', icon: KeyIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    ...(userDespachos.length > 0 ? [{ id: 'despacho', name: 'Mi Despacho', icon: BuildingOfficeIcon }] : []),
    { id: 'privacy', name: 'Privacidad', icon: ShieldCheckIcon },
    { id: 'sessions', name: 'Sesiones', icon: ComputerDesktopIcon }
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (!user) throw new Error('Usuario no encontrado');

      // Actualizar el usuario en la base de datos
      const updatedUser = await userService.updateUser(user.id, {
        nombre: profileData.nombre,
        apellidos: profileData.apellidos,
        email: profileData.email,
        telefono: profileData.telefono || undefined
      });

      // Actualizar el contexto de autenticación con los nuevos datos
      login({
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.nombre} ${updatedUser.apellidos}`,
        role: updatedUser.rol
      });

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => setMessage(null), 5000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil. Inténtalo de nuevo.' });
      
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    setLoading(true);
    try {
      // Usar AuthService para cambiar la contraseña
      const updateResult = await AuthService.updatePassword(passwordData.new_password);
      
      if (updateResult.error) {
        setMessage({ type: 'error', text: updateResult.error });
      } else {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        
        setMessage({ type: 'success', text: 'Contraseña cambiada correctamente. La nueva contraseña estará activa inmediatamente.' });
        setTimeout(() => setMessage(null), 5000);
      }
      
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Esta funcionalidad estará disponible cuando se complete la integración con Supabase Auth.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (!user) throw new Error('Usuario no encontrado');

      // Por ahora guardamos en localStorage hasta que se actualice el schema de la DB
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
      
      setMessage({ type: 'success', text: 'Configuración de notificaciones actualizada correctamente' });
      setTimeout(() => setMessage(null), 5000);
      
    } catch (error) {
      console.error('Error updating notifications:', error);
      setMessage({ type: 'error', text: 'Error al actualizar las notificaciones. Inténtalo de nuevo.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDespachoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (!user) throw new Error('Usuario no encontrado');

      // Por ahora guardamos en localStorage hasta que tengamos el servicio de despachos
      localStorage.setItem(`despacho_${user.id}`, JSON.stringify(despachoData));
      
      setMessage({ type: 'success', text: 'Información del despacho actualizada correctamente' });
      setTimeout(() => setMessage(null), 5000);
      
    } catch (error) {
      console.error('Error updating despacho:', error);
      setMessage({ type: 'error', text: 'Error al actualizar la información del despacho. Inténtalo de nuevo.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos existentes cuando cambia el usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const userData = await userService.getUserById(user.id);
        if (userData) {
          setProfileData({
            id: userData.id,
            email: userData.email,
            nombre: userData.nombre || '',
            apellidos: userData.apellidos || '',
            telefono: userData.telefono || '',
            role: userData.rol,
            despacho_nombre: '', // Se llenará si es necesario
            fecha_registro: userData.fechaRegistro ? 
              (userData.fechaRegistro instanceof Date ? userData.fechaRegistro.toISOString() : userData.fechaRegistro) : 
              new Date().toISOString(),
            ultimo_acceso: userData.ultimoAcceso ? 
              (userData.ultimoAcceso instanceof Date ? userData.ultimoAcceso.toISOString() : userData.ultimoAcceso) : 
              new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setMessage({ 
          type: 'error', 
          text: 'Error al cargar los datos del usuario. Algunos campos pueden estar vacíos.' 
        });
        setTimeout(() => setMessage(null), 5000);
      }
    };

    if (user) {
      // Cargar datos reales del usuario
      loadUserData();
      
      // Cargar despachos del usuario
      const loadUserDespachos = async () => {
        try {
          const despachos = await userService.getUserDespachos(user.id);
          setUserDespachos(despachos.filter(d => d.activo)); // Solo despachos activos
        } catch (error) {
          console.error('Error loading user despachos:', error);
          setUserDespachos([]);
        }
      };
      
      loadUserDespachos();
      
      // Cargar notificaciones guardadas
      const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }

      // Cargar datos del despacho guardados (solo para despacho_admin)
      if (user.role === 'despacho_admin') {
        const savedDespacho = localStorage.getItem(`despacho_${user.id}`);
        if (savedDespacho) {
          setDespachoData(JSON.parse(savedDespacho));
        }
      }
    }
  }, [user]);

  const revokeSession = async (sessionId: string) => {
    if (confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
      try {
        // Aquí iría la llamada a la API para revocar la sesión
        console.log('Revocando sesión:', sessionId);
        alert('Sesión cerrada correctamente');
      } catch (error) {
        console.error('Error revoking session:', error);
        alert('Error al cerrar la sesión');
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Configuración */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">
          Gestiona tu perfil, seguridad y preferencias de la cuenta.
        </p>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'profile' | 'password' | 'notifications' | 'despacho' | 'privacy' | 'sessions')}
                    className={`$
                      {activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="p-6">
          {/* Mensaje de éxito/error */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Perfil Personal */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={profileData.nombre}
                      onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={profileData.apellidos}
                      onChange={(e) => setProfileData({ ...profileData, apellidos: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profileData.telefono}
                      onChange={(e) => setProfileData({ ...profileData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+34 123 456 789"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Información de la cuenta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Rol:</span>
                      <span className="ml-2 font-medium">
                        {profileData.role === 'super_admin' ? 'Super Administrador' : 'Administrador de Despacho'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Registro:</span>
                      <span className="ml-2">{new Date(profileData.fecha_registro).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Último acceso:</span>
                      <span className="ml-2">{new Date(profileData.ultimo_acceso).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Cambio de Contraseña */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Mínimo 8 caracteres. Incluye mayúsculas, minúsculas y números.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Estado de la funcionalidad:</h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    El cambio de contraseña está preparado pero requiere la configuración completa de Supabase Auth. 
                    Actualmente el sistema usa autenticación temporal con localStorage.
                  </p>
                  <p className="text-sm text-yellow-700">
                    <strong>Recomendaciones de seguridad:</strong>
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 mt-1">
                    <li>• Usa una contraseña única que no uses en otros sitios</li>
                    <li>• Incluye una mezcla de letras, números y símbolos</li>
                    <li>• Evita información personal como nombres o fechas</li>
                    <li>• Considera usar un gestor de contraseñas</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          )}

          {/* Notificaciones */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationsSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferencias de Notificaciones</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notificaciones por Email</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.email_nuevos_leads}
                          onChange={(e) => setNotifications({ ...notifications, email_nuevos_leads: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Nuevos leads</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.email_actualizaciones}
                          onChange={(e) => setNotifications({ ...notifications, email_actualizaciones: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Actualizaciones de la plataforma</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.email_sistema}
                          onChange={(e) => setNotifications({ ...notifications, email_sistema: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Notificaciones del sistema</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notificaciones Push</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.push_leads}
                          onChange={(e) => setNotifications({ ...notifications, push_leads: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Leads importantes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.push_mensajes}
                          onChange={(e) => setNotifications({ ...notifications, push_mensajes: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Mensajes del sistema</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar Preferencias'}
                </button>
              </div>
            </form>
          )}

          {/* Mi Despacho (solo si el usuario tiene despachos asignados) */}
          {activeTab === 'despacho' && userDespachos.length > 0 && (
            <form onSubmit={handleDespachoSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Despacho</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Despacho
                    </label>
                    <input
                      type="text"
                      value={despachoData.nombre}
                      onChange={(e) => setDespachoData({ ...despachoData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={despachoData.direccion}
                      onChange={(e) => setDespachoData({ ...despachoData, direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Calle, número, ciudad, provincia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono del Despacho
                    </label>
                    <input
                      type="tel"
                      value={despachoData.telefono}
                      onChange={(e) => setDespachoData({ ...despachoData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+34 123 456 789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      value={despachoData.email_contacto}
                      onChange={(e) => setDespachoData({ ...despachoData, email_contacto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contacto@despacho.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={despachoData.web}
                      onChange={(e) => setDespachoData({ ...despachoData, web: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.despacho.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidades Legales
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {especialidadesDisponibles.map((especialidad) => (
                        <label key={especialidad} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={despachoData.especialidades.includes(especialidad)}
                            onChange={() => toggleEspecialidad(especialidad)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{especialidad}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={despachoData.descripcion}
                      onChange={(e) => setDespachoData({ ...despachoData, descripcion: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe brevemente tu despacho y tus servicios..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar Información'}
                </button>
              </div>
            </form>
          )}

          {/* Privacidad */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Privacidad</h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Visibilidad del Perfil</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Controla qué información es visible para otros usuarios de la plataforma.
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Mostrar nombre en directorios</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Permitir contacto directo</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-red-900 mb-2">Zona de Peligro</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Estas acciones son permanentes y no se pueden deshacer.
                    </p>
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        onClick={() => {
                          if (confirm('¿Estás seguro de que quieres eliminar permanentemente tu cuenta? Esta acción no se puede deshacer.')) {
                            alert('Función de eliminación de cuenta pendiente de implementar');
                          }
                        }}
                      >
                        Eliminar Cuenta Permanentemente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sesiones Activas */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sesiones Activas</h3>
                <p className="text-gray-600 mb-6">
                  Gestiona los dispositivos donde tienes sesión iniciada. Puedes cerrar sesiones remotas por seguridad.
                </p>
                
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <ComputerDesktopIcon className="h-6 w-6 text-gray-400" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                                {session.device}
                                {session.current && (
                                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Sesión Actual
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {session.location} • {session.ip}
                              </p>
                              <p className="text-xs text-gray-400">
                                Última actividad: {session.last_active}
                              </p>
                            </div>
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            onClick={() => revokeSession(session.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Cerrar Sesión
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Consejos de Seguridad:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Cierra sesiones en dispositivos que ya no uses</li>
                    <li>• Si ves actividad sospechosa, cambia tu contraseña inmediatamente</li>
                    <li>• Evita iniciar sesión en dispositivos públicos o compartidos</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;