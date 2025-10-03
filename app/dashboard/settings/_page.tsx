'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { UserService } from '@/lib/userService';
import { AuthService } from '@/lib/authService';
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ProfileTab from '@/components/settings/ProfileTab';
import PasswordTab from '@/components/settings/PasswordTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import MisDespachosTab from '@/components/settings/MisDespachosTab';
import PrivacyTab from '@/components/settings/PrivacyTab';
import SessionsTab from '@/components/settings/SessionsTab';

// Types
type SettingsTab = 'profile' | 'password' | 'notifications' | 'mis-despachos' | 'privacy' | 'sessions';

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

// Service instances
const userService = new UserService();
const authService = new AuthService();

// Helper function to safely access user data
const safeUser = (user: any): UserProfile => ({
  id: user?.id || "",
  email: user?.email || "",
  name: user?.name || "",
  role: (user?.role as 'super_admin' | 'despacho_admin' | 'usuario') || "usuario",
  nombre: user?.nombre || "",
  apellidos: user?.apellidos || "",
  telefono: user?.telefono || "",
  fecha_registro: user?.fecha_registro || new Date().toISOString(),
  ultimo_acceso: user?.ultimo_acceso || new Date().toISOString(),
  despacho_nombre: user?.despacho_nombre || ""
});

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
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
        const userData = await userService.getUserProfile(user.id);
        setProfile({
          ...safeUser(userData),
          ...userData
        });
      } catch (error) {
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
        return <ProfileTab profile={profile} onUpdate={setProfile} loading={loading} />;
      case 'password':
        return <PasswordTab loading={loading} />;
      case 'notifications':
        return <NotificationsTab loading={loading} />;
      case 'mis-despachos':
        return <MisDespachosTab loading={loading} />;
      case 'privacy':
        return <PrivacyTab loading={loading} />;
      case 'sessions':
        return <SessionsTab loading={loading} />;
      default:
        return null;
    }
  };

  if (authLoading) {
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">
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
      <div className="bg-white rounded-lg shadow mb-6">
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
