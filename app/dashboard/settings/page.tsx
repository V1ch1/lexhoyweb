'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { UserService } from '@/lib/userService';
import { AuthService } from '@/lib/authService';
import { supabase } from '@/lib/supabase';
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ProfileTab from '@/components/settings/ProfileTab';
import PasswordTab from '@/components/settings/PasswordTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import MisDespachosTab from '@/components/settings/MisDespachosTab';
import PrivacyTab from '@/components/settings/PrivacyTab';
import SessionsTab from '@/components/settings/SessionsTab';

// Types
type SettingsTab = 'profile' | 'password' | 'notifications' | 'mis-despachos' | 'privacy' | 'sessions';

interface Despacho {
  id: string;
  nombre: string;
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  web?: string;
  descripcion?: string;
  num_sedes?: number;
  estado?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'despacho_admin' | 'usuario';
  nombre: string;
  apellidos: string;
  telefono: string;
  fecha_registro: string;
  ultimo_acceso: string;
  despacho_nombre?: string;
}

interface Tab {
  id: SettingsTab;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
}

// Service instance
const userService = new UserService();

export default function SettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    role: 'usuario',
    nombre: '',
    apellidos: '',
    telefono: '',
    fecha_registro: new Date().toISOString(),
    ultimo_acceso: new Date().toISOString(),
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Usar los datos básicos del usuario del auth context
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          // Inicializar otros campos requeridos
          nombre: user.name?.split(' ')[0] || '',
          apellidos: user.name?.split(' ').slice(1).join(' ') || '',
          telefono: '',
          fecha_registro: new Date().toISOString(),
          ultimo_acceso: new Date().toISOString()
        };
        
        setProfile(userData);
        
        // Opcional: Cargar datos adicionales del perfil si es necesario
        try {
          const profileData = await userService.getUserProfile(user.id);
          setProfile(prev => ({
            ...prev,
            ...profileData
          }));
        } catch (profileError) {
          console.error('Error al cargar datos adicionales del perfil:', profileError);
          // Continuar con los datos básicos si falla la carga del perfil
        }
      } catch (error) {
        console.error('Error en loadUserData:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar los datos del usuario'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // Tab configuration
  const tabs: Tab[] = [
    {
      id: 'profile',
      name: 'Perfil',
      icon: UserIcon,
      visible: true
    },
    {
      id: 'password',
      name: 'Contraseña',
      icon: KeyIcon,
      visible: true
    },
    {
      id: 'notifications',
      name: 'Notificaciones',
      icon: BellIcon,
      visible: true
    },
    {
      id: 'mis-despachos',
      name: 'Mis Despachos',
      icon: BuildingOfficeIcon,
      visible: true
    },
    {
      id: 'privacy',
      name: 'Privacidad',
      icon: ShieldCheckIcon,
      visible: true
    },
    {
      id: 'sessions',
      name: 'Sesiones',
      icon: ComputerDesktopIcon,
      visible: true
    }
  ];

  // Handle tab change
  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId);
  };

  // Handle password change
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Verificar la contraseña actual intentando iniciar sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Si la contraseña actual es correcta, actualizar a la nueva contraseña
      const { error: updateError } = await AuthService.updatePassword(newPassword);
      
      if (updateError) {
        throw new Error(updateError);
      }
      
      setMessage({
        type: 'success',
        text: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al cambiar la contraseña. Por favor, verifica tu contraseña actual e inténtalo de nuevo.'
      });
      throw error; // Para que el componente PasswordTab pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  // State for Mis Despachos tab
  const [userDespachos, setUserDespachos] = useState<Despacho[]>([]);
  
  // Load user's despachos
  useEffect(() => {
    const loadUserDespachos = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Aquí deberías cargar los despachos del usuario desde tu API o base de datos
        // Esto es un ejemplo, ajusta según tu implementación
        const response = await fetch(`/api/users/${user.id}/despachos`);
        const data = await response.json();
        if (response.ok) {
          setUserDespachos(data);
        } else {
          throw new Error(data.message || 'Error al cargar los despachos');
        }
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

    if (activeTab === 'mis-despachos') {
      loadUserDespachos();
    }
  }, [user, activeTab]);

  // Handle profile update
  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Actualizar el perfil en la base de datos
      const updatedProfile = await userService.updateUserProfile(user.id, {
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        telefono: data.telefono || ''
      });
      
      // Actualizar el estado local
      setProfile(updatedProfile);
      
      setMessage({
        type: 'success',
        text: 'Perfil actualizado correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };



  // Handle despacho deletion
  const handleDeleteDespacho = async (despachoId: string) => {
    try {
      setLoading(true);
      // Add despacho deletion logic here
      setUserDespachos(prev => prev.filter(d => d.id !== despachoId));
      setMessage({
        type: 'success',
        text: 'Despacho eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar el despacho:', error);
      setMessage({
        type: 'error',
        text: 'Error al eliminar el despacho. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab 
            profileData={profile} 
            onUpdate={handleUpdateProfile} 
            loading={isLoading} 
          />
        );
      case 'password':
        return (
          <PasswordTab
            loading={isLoading}
            onChangePassword={handleChangePassword}
          />
        );
      case 'notifications':
        return <NotificationsTab loading={loading} notifications={{}} onUpdate={() => {}} onSubmit={() => {}} />;
      case 'mis-despachos':
        return (
          <MisDespachosTab 
            userDespachos={userDespachos} 
            onDeleteDespacho={handleDeleteDespacho} 
          />
        );
      case 'privacy':
        return <PrivacyTab loading={loading} />;
      case 'sessions':
        return <SessionsTab loading={loading} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Por favor, inicia sesión para acceder a la configuración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tu perfil, seguridad y preferencias de la cuenta.
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 inline-block mr-2 -mt-1" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
