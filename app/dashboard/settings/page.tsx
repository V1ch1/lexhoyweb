'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { UserService } from '@/lib/userService';
import { AuthSimpleService } from '@/lib/auth/services/auth-simple.service';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import ProfileTab from '@/components/settings/ProfileTab';
import PasswordTab from '@/components/settings/PasswordTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import MisDespachosTab from '@/components/settings/MisDespachosTab';
import PrivacyTab from '@/components/settings/PrivacyTab';
import SessionsTab from '@/components/settings/SessionsTab';

// Types
type SettingsSection = 'overview' | 'profile' | 'password' | 'notifications' | 'mis-despachos' | 'privacy' | 'sessions';

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

interface SettingsCard {
  id: SettingsSection;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  visible: boolean;
}

// Service instance
const userService = new UserService();

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview');
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
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          nombre: user.name?.split(' ')[0] || '',
          apellidos: user.name?.split(' ').slice(1).join(' ') || '',
          telefono: '',
          fecha_registro: new Date().toISOString(),
          ultimo_acceso: new Date().toISOString()
        };
        
        setProfile(userData);
        
        try {
          const profileData = await userService.getUserProfile(user.id);
          setProfile(prev => ({
            ...prev,
            ...profileData
          }));
        } catch (profileError) {
          console.error('Error al cargar datos adicionales del perfil:', profileError);
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

  // Settings cards configuration
  const settingsCards: SettingsCard[] = [
    {
      id: 'profile',
      name: 'Perfil',
      description: 'Actualiza tu información personal',
      icon: UserIcon,
      color: 'blue',
      visible: true
    },
    {
      id: 'password',
      name: 'Contraseña',
      description: 'Cambia tu contraseña de acceso',
      icon: KeyIcon,
      color: 'purple',
      visible: true
    },
    {
      id: 'notifications',
      name: 'Notificaciones',
      description: 'Gestiona tus preferencias de notificaciones',
      icon: BellIcon,
      color: 'yellow',
      visible: true
    },
    {
      id: 'mis-despachos',
      name: 'Mis Despachos',
      description: 'Administra tus despachos asignados',
      icon: BuildingOfficeIcon,
      color: 'green',
      visible: true
    },
    {
      id: 'privacy',
      name: 'Privacidad',
      description: 'Controla tu privacidad y datos',
      icon: ShieldCheckIcon,
      color: 'red',
      visible: true
    },
    {
      id: 'sessions',
      name: 'Sesiones',
      description: 'Gestiona tus sesiones activas',
      icon: ComputerDesktopIcon,
      color: 'orange',
      visible: true
    }
  ];

  // Handle password change
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      const { error: updateError } = await AuthSimpleService.updatePassword(newPassword);
      
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // State for Mis Despachos
  const [userDespachos, setUserDespachos] = useState<Despacho[]>([]);
  
  // Load user's despachos
  useEffect(() => {
    const loadUserDespachos = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
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

    if (activeSection === 'mis-despachos') {
      loadUserDespachos();
    }
  }, [user, activeSection]);

  // Handle profile update
  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const updatedProfile = await userService.updateUserProfile(user.id, {
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        telefono: data.telefono || ''
      });
      
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

  // Render section content
  const renderSectionContent = () => {
    if (loading && activeSection !== 'overview') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (activeSection) {
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

  if (isLoading && activeSection === 'overview') {
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

  // Settings Card Component
  const SettingsCardComponent = ({ 
    card, 
    onClick 
  }: { 
    card: SettingsCard; 
    onClick: () => void;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      green: "bg-green-50 text-green-600 hover:bg-green-100",
      purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
      yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
      red: "bg-red-50 text-red-600 hover:bg-red-100",
    };

    return (
      <button
        onClick={onClick}
        className={`${colorClasses[card.color as keyof typeof colorClasses]} w-full p-6 rounded-xl transition-all duration-200 hover:shadow-md text-left group`}
      >
        <card.icon className="h-8 w-8 mb-3" />
        <h3 className="text-lg font-semibold mb-1">{card.name}</h3>
        <p className="text-sm opacity-80">{card.description}</p>
        <ArrowRightIcon className="h-5 w-5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {activeSection === 'overview' ? 'Configuración' : 
           settingsCards.find(c => c.id === activeSection)?.name || 'Configuración'}
        </h1>
        <p className="text-lg text-gray-600">
          {activeSection === 'overview' 
            ? 'Gestiona tu perfil, seguridad y preferencias de la cuenta'
            : settingsCards.find(c => c.id === activeSection)?.description || ''}
        </p>
        
        {/* Breadcrumb */}
        {activeSection !== 'overview' && (
          <button
            onClick={() => setActiveSection('overview')}
            className="mt-3 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a configuración
          </button>
        )}
      </div>

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

      {activeSection === 'overview' ? (
        <>
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mr-4">
                {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded">
                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'despacho_admin' ? 'Despacho Admin' : 'Usuario'}
                </span>
              </div>
            </div>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsCards.filter(card => card.visible).map((card) => (
              <SettingsCardComponent
                key={card.id}
                card={card}
                onClick={() => setActiveSection(card.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {renderSectionContent()}
          </div>
        </div>
      )}
    </div>
  );
}
