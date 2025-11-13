"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Types
type DespachosSection = 'overview' | 'ver-despachos' | 'mis-despachos' | 'crear' | 'mis-solicitudes' | 'admin';

interface DespachosCard {
  id: DespachosSection;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  visible: boolean;
  path: string;
}

export default function DespachosPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Verificar si el usuario es super admin
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Debug: mostrar información del usuario
  // Despachos cards configuration
  const despachosCards: DespachosCard[] = [
    {
      id: 'ver-despachos',
      name: 'Buscar Despachos',
      description: 'Busca tu despacho y solicita la propiedad',
      icon: MagnifyingGlassIcon,
      color: 'green',
      visible: true,
      path: '/dashboard/despachos/ver-despachos'
    },
    {
      id: 'crear',
      name: 'Dar de Alta Despacho',
      description: 'Crea un nuevo despacho desde cero',
      icon: PlusCircleIcon,
      color: 'orange',
      visible: true,
      path: '/dashboard/despachos/crear'
    },
    {
      id: 'mis-despachos',
      name: 'Mis Despachos',
      description: 'Administra los despachos a los que tienes acceso',
      icon: BuildingOfficeIcon,
      color: 'blue',
      visible: true,
      path: '/dashboard/despachos/mis-despachos'
    },
    {
      id: 'mis-solicitudes',
      name: 'Mis Solicitudes',
      description: 'Revisa el estado de tus solicitudes de acceso',
      icon: DocumentTextIcon,
      color: 'yellow',
      visible: true,
      path: '/dashboard/despachos/mis-solicitudes'
    },
    {
      id: 'admin',
      name: 'Administración',
      description: 'Panel de administración para super admins - Gestión completa de despachos',
      icon: ShieldCheckIcon,
      color: 'red',
      visible: isSuperAdmin,
      path: '/dashboard/despachos/admin'
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Por favor, inicia sesión para acceder a los despachos.</p>
        </div>
      </div>
    );
  }

  // Despachos Card Component
  const DespachosCardComponent = ({ 
    card, 
    onClick 
  }: { 
    card: DespachosCard; 
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
          Gestión de Despachos
        </h1>
        <p className="text-lg text-gray-600">
          Administra, importa y crea despachos jurídicos
        </p>
      </div>

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

      {/* Despachos Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {despachosCards.filter(card => card.visible).map((card) => (
          <DespachosCardComponent
            key={card.id}
            card={card}
            onClick={() => router.push(card.path)}
          />
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-gray-700 mb-3">
              Gestiona tus despachos de forma sencilla. Puedes importar despachos existentes desde Lexhoy o crear nuevos desde cero.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><strong>Mis Despachos:</strong> Accede a los despachos que ya tienes asignados</li>
              <li><strong>Despachos Disponibles:</strong> Explora todos los despachos disponibles en la plataforma</li>
              <li><strong>Importar:</strong> Busca e importa tu despacho desde el directorio de Lexhoy</li>
              <li><strong>Crear:</strong> Da de alta un nuevo despacho con toda su información</li>
              <li><strong>Mis Solicitudes:</strong> Revisa el estado de tus solicitudes de acceso a despachos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
