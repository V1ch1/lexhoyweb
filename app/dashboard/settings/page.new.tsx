'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { UserService } from '@/lib/userService';
import { AuthService } from '@/lib/authService';
import { UserDespacho } from '@/lib/types';
import { decodeHtml } from '@/lib/decodeHtml';
import ModalConfirmarEliminar from '@/components/ModalConfirmarEliminar';
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
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Tipos para las pestañas
type SettingsTab = 'profile' | 'password' | 'notifications' | 'despacho' | 'privacy' | 'sessions' | 'mis-despachos';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  role: "super_admin" | "despacho_admin" | "usuario";
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

// Importar el componente de Mis Despachos
import MisDespachosTab from '@/components/settings/MisDespachosTab';

// Función segura para obtener el JWT
function getJWT() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("supabase_jwt") || "";
  }
  return "";
}

const SettingsPage = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para los formularios
  const [profileData, setProfileData] = useState<UserProfile>({
    id: user?.id || "",
    email: user?.email || "",
    nombre: user?.name?.split(" ")[0] || "",
    apellidos: user?.name?.split(" ").slice(1).join(" ") || "",
    telefono: "",
    role: user?.role || "usuario",
    fecha_registro: new Date().toISOString(),
    ultimo_acceso: new Date().toISOString(),
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_nuevos_leads: true,
    email_actualizaciones: true,
    email_sistema: true,
    push_leads: true,
    push_mensajes: true,
  });

  const [userDespachos, setUserDespachos] = useState<UserDespacho[]>([]);
  const [userSolicitudes, setUserSolicitudes] = useState<any[]>([]);
  const [despachosInfo, setDespachosInfo] = useState<Record<string, { nombre: string; localidad: string; provincia: string }>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [solicitudToDelete, setSolicitudToDelete] = useState<string | null>(null);

  // Tabs de navegación
  const tabs = [
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'password', name: 'Seguridad', icon: KeyIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'mis-despachos', name: 'Mis Despachos', icon: BuildingOfficeIcon },
    { id: 'privacy', name: 'Privacidad', icon: ShieldCheckIcon },
    { id: 'sessions', name: 'Sesiones', icon: ComputerDesktopIcon },
  ];

  // Función para formatear fechas
  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userData = await userService.getUserById(user.id);
        
        if (userData) {
          setProfileData({
            id: userData.id,
            email: userData.email,
            nombre: userData.nombre || "",
            apellidos: userData.apellidos || "",
            telefono: userData.telefono || "",
            role: userData.role || "usuario",
            fecha_registro: userData.fecha_registro || new Date().toISOString(),
            ultimo_acceso: userData.ultimo_acceso || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar los datos del usuario. Por favor, recarga la página.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // Cargar despachos del usuario
  useEffect(() => {
    const loadUserDespachos = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const despachos = await userService.getUserDespachos(user.id);
        setUserDespachos(despachos.filter((d: any) => d.activo));
      } catch (error) {
        console.error('Error al cargar los despachos:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar los despachos. Por favor, inténtalo de nuevo.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserDespachos();
  }, [user]);

  // Cargar notificaciones guardadas
  useEffect(() => {
    if (!user) return;
    
    try {
      const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Error al cargar las notificaciones:', error);
    }
  }, [user]);

  // Manejadores de eventos
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      await userService.updateUser(user.id, {
        nombre: profileData.nombre,
        apellidos: profileData.apellidos,
        email: profileData.email,
        telefono: profileData.telefono,
      });
      
      setMessage({
        type: 'success',
        text: 'Perfil actualizado correctamente.'
      });
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({
        type: 'error',
        text: 'Las contraseñas no coinciden.'
      });
      return;
    }
    
    try {
      setLoading(true);
      await AuthService.updatePassword(passwordData.new_password);
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setMessage({
        type: 'success',
        text: 'Contraseña actualizada correctamente.'
      });
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar la contraseña. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      localStorage.setItem(
        `notifications_${user.id}`,
        JSON.stringify(notifications)
      );
      
      setMessage({
        type: 'success',
        text: 'Preferencias de notificaciones guardadas correctamente.'
      });
    } catch (error) {
      console.error('Error al guardar las preferencias de notificaciones:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar las preferencias de notificaciones.'
      });
    }
  };

  const handleCancelarSolicitud = async (solicitudId: string) => {
    if (!user || !confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = getJWT();
      const response = await fetch(`/api/cancelar-solicitud-despacho`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          solicitudId,
          userId: user.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al cancelar la solicitud');
      }
      
      // Actualizar la lista de solicitudes
      const updatedSolicitudes = userSolicitudes.filter(s => s.id !== solicitudId);
      setUserSolicitudes(updatedSolicitudes);
      
      setMessage({
        type: 'success',
        text: 'Solicitud cancelada correctamente.'
      });
    } catch (error) {
      console.error('Error al cancelar la solicitud:', error);
      setMessage({
        type: 'error',
        text: 'Error al cancelar la solicitud. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tu perfil, seguridad y preferencias de la cuenta.
        </p>
      </div>

      {/* Pestañas de navegación */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mensajes */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              )}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido de las pestañas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {activeTab === 'profile' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Perfil</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Actualiza tu información personal.
            </p>
            
            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="nombre"
                      value={profileData.nombre}
                      onChange={(e) =>
                        setProfileData({ ...profileData, nombre: e.target.value })
                      }
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700">
                    Apellidos
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="apellidos"
                      value={profileData.apellidos}
                      onChange={(e) =>
                        setProfileData({ ...profileData, apellidos: e.target.value })
                      }
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="telefono"
                      value={profileData.telefono}
                      onChange={(e) =>
                        setProfileData({ ...profileData, telefono: e.target.value })
                      }
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Seguridad</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Cambia tu contraseña.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    Contraseña actual
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="current-password"
                      name="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, current_password: e.target.value })
                      }
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? (
                          <EyeOffIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="new-password"
                      name="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, new_password: e.target.value })
                      }
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? (
                          <EyeOffIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmar nueva contraseña
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirm_password: e.target.value })
                      }
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Notificaciones</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configura cómo quieres recibir las notificaciones.
            </p>
            
            <form onSubmit={handleNotificationsSubmit} className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-nuevos-leads"
                      name="email-nuevos-leads"
                      type="checkbox"
                      checked={notifications.email_nuevos_leads}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          email_nuevos_leads: e.target.checked,
                        })
                      }
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-nuevos-leads" className="font-medium text-gray-700">
                      Recibir notificaciones por correo de nuevos leads
                    </label>
                    <p className="text-gray-500">Recibirás un correo electrónico cuando recibas un nuevo lead.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-actualizaciones"
                      name="email-actualizaciones"
                      type="checkbox"
                      checked={notifications.email_actualizaciones}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          email_actualizaciones: e.target.checked,
                        })
                      }
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-actualizaciones" className="font-medium text-gray-700">
                      Recibir actualizaciones por correo
                    </label>
                    <p className="text-gray-500">Recibirás noticias y actualizaciones sobre la plataforma.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-sistema"
                      name="email-sistema"
                      type="checkbox"
                      checked={notifications.email_sistema}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          email_sistema: e.target.checked,
                        })
                      }
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-sistema" className="font-medium text-gray-700">
                      Recibir notificaciones del sistema
                    </label>
                    <p className="text-gray-500">Recibirás notificaciones importantes sobre tu cuenta.</p>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar preferencias'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'mis-despachos' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Mis Despachos</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Gestiona tus despachos y solicitudes.
            </p>
            
            <div className="mt-6">
              <MisDespachosTab />
              
              {/* Lista de despachos */}
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Despachos asignados</h4>
                {userDespachos.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes despachos asignados</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Los despachos a los que tengas acceso aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {userDespachos.map((despacho) => (
                      <li key={despacho.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {despacho.despacho_nombre || 'Despacho sin nombre'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {despacho.rol}
                            </p>
                          </div>
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Activo
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Solicitudes pendientes */}
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Solicitudes pendientes</h4>
                {userSolicitudes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes pendientes</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Las solicitudes de acceso a despachos aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {userSolicitudes.map((solicitud) => (
                      <li key={solicitud.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {despachosInfo[solicitud.despacho_id]?.nombre || 'Despacho'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Solicitado el {formatFecha(solicitud.fecha_solicitud)}
                            </p>
                            <p className="text-sm text-yellow-600">
                              {solicitud.estado === 'pendiente' ? 'Pendiente de aprobación' : solicitud.estado}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCancelarSolicitud(solicitud.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Privacidad</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configura tus preferencias de privacidad.
            </p>
            
            <div className="mt-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Configuración de privacidad</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Controla cómo se comparte tu información.
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Perfil público</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          <input
                            id="public-profile"
                            name="public-profile"
                            type="checkbox"
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label htmlFor="public-profile" className="ml-2 block text-sm text-gray-700">
                            Hacer mi perfil visible para otros usuarios
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Si está activado, otros usuarios podrán encontrarte y ver tu perfil.
                        </p>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Compartir datos con terceros</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          <input
                            id="share-data"
                            name="share-data"
                            type="checkbox"
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label htmlFor="share-data" className="ml-2 block text-sm text-gray-700">
                            Permitir el uso de datos para mejorar la experiencia
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Nos ayuda a mejorar nuestros servicios analizando cómo se utiliza la plataforma.
                        </p>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Sesiones activas</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Gestiona las sesiones activas en tus dispositivos.
            </p>
            
            <div className="mt-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Sesiones activas</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Estas son las sesiones activas en tus dispositivos.
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Dispositivo actual</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Sesión actual</p>
                            <p className="text-gray-500">Chrome en Windows 10</p>
                            <p className="text-xs text-gray-500">Iniciada hace 2 horas</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activa
                          </span>
                        </div>
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Otras sesiones</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">
                                Safari en iPhone
                              </span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <button
                                type="button"
                                className="font-medium text-blue-600 hover:text-blue-500"
                              >
                                Cerrar sesión
                              </button>
                            </div>
                          </li>
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">
                                Firefox en MacOS
                              </span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <button
                                type="button"
                                className="font-medium text-blue-600 hover:text-blue-500"
                              >
                                Cerrar sesión
                              </button>
                            </div>
                          </li>
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="mt-6 bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Cerrar todas las demás sesiones</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Por seguridad, te recomendamos cerrar todas las demás sesiones en todos tus dispositivos.</p>
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                    >
                      Cerrar todas las demás sesiones
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
