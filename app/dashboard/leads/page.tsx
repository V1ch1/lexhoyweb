'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LeadsPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Verificar permisos
  useEffect(() => {
    if (!isLoading && (!user || user.role === 'usuario')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos
  if (!user || user.role === 'usuario') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-800 mb-2">🔒 Acceso Restringido</h2>
        <p className="text-red-600">
          Solo los administradores de despacho y super administradores pueden acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600 mt-2">
          Gestiona y da seguimiento a los leads de tus despachos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Estadísticas de Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl text-blue-600 mr-3">📞</div>
            <div>
              <p className="text-sm text-gray-600">Nuevos</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl text-yellow-600 mr-3">⏳</div>
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl text-green-600 mr-3">✅</div>
            <div>
              <p className="text-sm text-gray-600">Convertidos</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl text-purple-600 mr-3">💰</div>
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">-€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              + Nuevo Lead
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              📊 Generar Reporte
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
              📧 Campaña Email
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Filtros</h3>
          <div className="space-y-3">
            <select className="w-full border border-gray-300 rounded px-3 py-2">
              <option>Todos los estados</option>
              <option>Nuevos</option>
              <option>Contactados</option>
              <option>Cerrados</option>
            </select>
            <select className="w-full border border-gray-300 rounded px-3 py-2">
              <option>Todas las especialidades</option>
              <option>Civil</option>
              <option>Penal</option>
              <option>Laboral</option>
            </select>
            <button className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              Aplicar Filtros
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Tu Rendimiento</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Leads este mes:</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tasa conversión:</span>
              <span className="font-semibold text-green-600">-%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo respuesta:</span>
              <span className="font-semibold">- min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de leads */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Últimos Leads</h2>
            <div className="flex space-x-2">
              <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200">
                📋 Exportar
              </button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                🔄 Actualizar
              </button>
            </div>
          </div>
          
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium mb-2">Gestión de Leads</h3>
            <p className="mb-4">Pronto podrás gestionar todos tus leads desde aquí.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700">Captura</h4>
                <p className="text-sm text-gray-600">Formularios web automáticos</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700">Seguimiento</h4>
                <p className="text-sm text-gray-600">CRM integrado</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700">Conversión</h4>
                <p className="text-sm text-gray-600">Métricas en tiempo real</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;