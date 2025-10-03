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
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon
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

  // State for password tab
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Handle despacho deletion
  const handleDeleteDespacho = async (despachoId: string) => {
    try {
      setLoading(true);
      // Aquí deberías implementar la lógica para eliminar el despacho
      // Por ejemplo:
      // await userService.removeDespacho(user.id, despachoId);
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

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your password update logic here
    console.log('Updating password:', passwordData);
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
        return <ProfileTab profileData={profile} onUpdate={setProfile} loading={loading} />;
      case 'password':
        return (
          <PasswordTab
            passwordData={passwordData}
            onUpdate={(data) => setPasswordData(prev => ({ ...prev, ...data }))}
            onSubmit={handlePasswordSubmit}
            loading={loading}
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            onTogglePasswordVisibility={togglePasswordVisibility}
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
        return <PrivacyTab loading={loading} privacySettings={{}} onUpdate={() => {}} onSubmit={() => {}} />;
      case 'sessions':
        return <SessionsTab loading={loading} sessions={[]} onRevokeSession={() => Promise.resolve()} />;
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
