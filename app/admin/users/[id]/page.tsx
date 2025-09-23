'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UserService } from '@/lib/userService';
import { User, UserDespacho, UserRole, UserStatus } from '@/lib/types';
import { useAuth } from '@/lib/authContext';

const userService = new UserService();

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userDespachos, setUserDespachos] = useState<UserDespacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    rol: 'usuario' as UserRole,
    estado: 'activo' as UserStatus,
    activo: true,
    emailVerificado: false,
    notasAdmin: ''
  });

  useEffect(() => {
    if (!authLoading && currentUser?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    if (params?.id && typeof params.id === 'string') {
      loadUserData(params.id);
    }
  }, [params?.id, authLoading, currentUser, router]);

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const userData = await userService.getUserById(userId);
      if (!userData) {
        setError('Usuario no encontrado');
        return;
      }

      setUser(userData);
      setFormData({
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        email: userData.email,
        telefono: userData.telefono || '',
        rol: userData.rol,
        estado: userData.estado,
        activo: userData.activo,
        emailVerificado: userData.emailVerificado,
        notasAdmin: userData.notasAdmin || ''
      });

      // Cargar despachos asignados
      const despachos = await userService.getUserDespachos(userId);
      setUserDespachos(despachos);

    } catch (error) {
      console.error('Error loading user:', error);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await userService.updateUser(user.id, {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        rol: formData.rol,
        estado: formData.estado,
        activo: formData.activo,
        emailVerificado: formData.emailVerificado,
        notasAdmin: formData.notasAdmin
      });

      setSuccessMessage('Usuario actualizado exitosamente');
      
      // Redirigir después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);

    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  const handleDesasignarDespacho = async (despachoId: string) => {
    if (!user) return;
    
    if (!confirm('¿Estás seguro de que quieres desasignar este despacho del usuario?')) {
      return;
    }

    try {
      await userService.desasignarDespacho(user.id, despachoId);
      
      // Actualizar la lista local de despachos
      setUserDespachos(prev => 
        prev.map(d => 
          d.despachoId === despachoId 
            ? { ...d, activo: false }
            : d
        )
      );
      
      setSuccessMessage('Despacho desasignado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error al desasignar despacho:', error);
      setError('Error al desasignar el despacho');
    }
  };

  const handleAsignarDespacho = async () => {
    if (!user) return;
    
    // TODO: Implementar lógica de asignación con selector de despacho
    console.log('Asignar despacho - función pendiente de implementar');
    alert('Función en desarrollo - próximamente disponible');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver a Usuarios
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Editar Usuario
                </h1>
                <p className="text-gray-600">
                  {user.nombre} {user.apellidos} ({user.email})
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de Éxito */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  ✅ {successMessage}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Redirigiendo en unos segundos...
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Básica */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                    title="El email no se puede cambiar"
                  />
                  <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="Ej: +34 600 123 456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del Administrador
                  </label>
                  <textarea
                    value={formData.notasAdmin}
                    onChange={(e) => handleInputChange('notasAdmin', e.target.value)}
                    rows={4}
                    placeholder="Notas internas sobre este usuario..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuración del Sistema */}
          <div className="space-y-6">
            {/* Rol y Estado */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol del Usuario
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => handleInputChange('rol', e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="usuario">Usuario</option>
                    <option value="despacho_admin">Despacho Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value as UserStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => handleInputChange('activo', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Cuenta activa</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.emailVerificado}
                      onChange={(e) => handleInputChange('emailVerificado', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email verificado</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Información de Registro */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Información de Registro</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Registrado:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(user.fechaRegistro).toLocaleString('es-ES')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Último acceso:</span>
                  <span className="ml-2 text-gray-900">
                    {user.ultimoAcceso 
                      ? new Date(user.ultimoAcceso).toLocaleString('es-ES')
                      : 'Nunca'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">
                    {user.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Gestión de Despachos */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Despachos</h2>
              </div>
              <div className="p-6">
                {/* Despachos Asignados */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Despachos Asignados</h3>
                  {userDespachos.length > 0 ? (
                    <div className="space-y-3">
                      {userDespachos.map((despacho, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                Despacho ID: {despacho.despachoId}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Asignado: {new Date(despacho.fechaAsignacion).toLocaleDateString('es-ES')}
                              </p>
                              {despacho.asignadoPor && (
                                <p className="text-xs text-gray-500">
                                  Por: {despacho.asignadoPor}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                despacho.activo 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {despacho.activo ? 'Activo' : 'Inactivo'}
                              </span>
                              {despacho.activo && (
                                <button 
                                  className="text-red-600 hover:text-red-900 text-xs px-2 py-1 border border-red-300 rounded"
                                  onClick={() => handleDesasignarDespacho(despacho.despachoId)}
                                >
                                  Desasignar
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Permisos */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-2">Permisos:</p>
                            <div className="flex space-x-4 text-xs">
                              <span className={despacho.permisos?.leer ? 'text-green-600' : 'text-gray-400'}>
                                👁️ Leer
                              </span>
                              <span className={despacho.permisos?.escribir ? 'text-green-600' : 'text-gray-400'}>
                                ✏️ Escribir
                              </span>
                              <span className={despacho.permisos?.eliminar ? 'text-green-600' : 'text-gray-400'}>
                                🗑️ Eliminar
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">No tiene despachos asignados</p>
                      <p className="text-xs text-gray-400">Puedes asignar un despacho manualmente a continuación</p>
                    </div>
                  )}
                </div>

                {/* Asignar Nuevo Despacho */}
                <div className="border-t pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Asignar Nuevo Despacho</h3>
                  <div className="flex space-x-3">
                    <select 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccionar despacho...</option>
                      <option value="despacho-1">Despacho García & Asociados</option>
                      <option value="despacho-2">Bufete Martínez</option>
                      <option value="despacho-3">López Abogados</option>
                    </select>
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      onClick={() => handleAsignarDespacho()}
                    >
                      Asignar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Esta asignación será inmediata y el usuario tendrá acceso al despacho seleccionado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}