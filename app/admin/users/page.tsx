'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserService } from '@/lib/userService';
import { User, UserDespacho, SolicitudRegistro, UserRole, UserStatus } from '@/lib/types';
import { useAuth } from '@/lib/authContext';

const userService = new UserService();

export default function AdminUsersPage() {
  const { user, logout, isLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'users' | 'solicitudes' | 'create'>('users');
  const [userDespachos, setUserDespachos] = useState<Record<string, UserDespacho[]>>({});
  const [currentUser, setCurrentUser] = useState<{email: string, name: string} | null>(null);

  // Estado para crear usuario
  const [newUser, setNewUser] = useState({
    email: '',
    nombre: '',
    apellidos: '',
    telefono: '',
    rol: 'despacho_admin' as UserRole
  });

  const checkPermissionsAndLoadData = useCallback(async () => {
    try {
      // Usar el contexto de autenticación
      if (!user) return;
      
      setCurrentUser({ email: user.email, name: user.name });
      const isSuperAdmin = user.role === 'super_admin';
      setIsSuperAdmin(isSuperAdmin);

      if (isSuperAdmin) {
        await loadUsers();
        await loadSolicitudes();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, [user]);

  useEffect(() => {
    checkPermissionsAndLoadData();
  }, [checkPermissionsAndLoadData]);

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);

      // Cargar despachos para cada usuario
      const despachoPromises = allUsers.map(async (user) => {
        const despachos = await userService.getUserDespachos(user.id);
        return { userId: user.id, despachos };
      });

      const results = await Promise.all(despachoPromises);
      const despachoMap: Record<string, UserDespacho[]> = {};
      results.forEach(({ userId, despachos }) => {
        despachoMap[userId] = despachos;
      });
      setUserDespachos(despachoMap);

    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSolicitudes = async () => {
    try {
      const allSolicitudes = await userService.getAllSolicitudes();
      setSolicitudes(allSolicitudes);
    } catch (error) {
      console.error('Error loading solicitudes:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.createUser(newUser);
      setNewUser({ email: '', nombre: '', apellidos: '', telefono: '', rol: 'despacho_admin' });
      await loadUsers();
      setSelectedTab('users');
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const currentUser = await userService.getCurrentUserWithDespachos();
      if (currentUser) {
        await userService.approveUser(userId, currentUser.user.id);
        await loadUsers();
      }
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleApproveSolicitud = async (solicitudId: string) => {
    try {
      const currentUser = await userService.getCurrentUserWithDespachos();
      if (currentUser) {
        await userService.approveSolicitud(solicitudId, currentUser.user.id);
        await loadSolicitudes();
        await loadUsers();
      }
    } catch (error) {
      console.error('Error approving solicitud:', error);
    }
  };

  const handleRejectSolicitud = async (solicitudId: string, notas: string) => {
    try {
      const currentUser = await userService.getCurrentUserWithDespachos();
      if (currentUser) {
        await userService.rejectSolicitud(solicitudId, currentUser.user.id, notas);
        await loadSolicitudes();
      }
    } catch (error) {
      console.error('Error rejecting solicitud:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">
            Solo los super administradores pueden acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: UserStatus }) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-gray-100 text-gray-800',
      suspendido: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      despacho_admin: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      super_admin: 'Super Admin',
      despacho_admin: 'Admin Despacho'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Administración de Usuarios
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{currentUser.name}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span>{currentUser.email}</span>
                </div>
              )}
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'users', label: 'Usuarios', count: users.length },
              { key: 'solicitudes', label: 'Solicitudes', count: solicitudes.filter(s => s.estado === 'pendiente').length },
              { key: 'create', label: 'Crear Usuario', count: null }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as 'users' | 'solicitudes' | 'create')}
                className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    selectedTab === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de Usuarios */}
        {selectedTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Usuarios Registrados ({users.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Despachos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.nombre} {user.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.telefono && (
                            <div className="text-sm text-gray-500">{user.telefono}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.rol} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.estado} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userDespachos[user.id]?.length || 0} asignados
                        </div>
                        {userDespachos[user.id]?.map((ud, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            Despacho: {ud.despachoId}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.fechaRegistro).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.estado === 'pendiente' && (
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Aprobar
                          </button>
                        )}
                        <button className="text-blue-600 hover:text-blue-900">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contenido de Solicitudes */}
        {selectedTab === 'solicitudes' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Solicitudes de Registro ({solicitudes.filter(s => s.estado === 'pendiente').length} pendientes)
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {solicitudes.map((solicitud) => (
                <div key={solicitud.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">
                        {solicitud.nombre} {solicitud.apellidos}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {solicitud.email} • {solicitud.telefono}
                      </p>
                      {solicitud.empresa && (
                        <p className="text-sm text-gray-600">Empresa: {solicitud.empresa}</p>
                      )}
                      
                      {solicitud.datosDespacho && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Datos del Despacho:</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Nombre:</strong> {(solicitud.datosDespacho as Record<string, unknown>).nombre as string}</p>
                            <p><strong>Especialidades:</strong> {((solicitud.datosDespacho as Record<string, unknown>).especialidades as string[])?.join(', ')}</p>
                            <p><strong>Ubicación:</strong> {(solicitud.datosDespacho as Record<string, unknown>).ciudad as string}, {(solicitud.datosDespacho as Record<string, unknown>).provincia as string}</p>
                          </div>
                        </div>
                      )}

                      {solicitud.mensaje && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600"><strong>Mensaje:</strong> {solicitud.mensaje}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col items-end space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        solicitud.estado === 'pendiente' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : solicitud.estado === 'aprobado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {solicitud.estado}
                      </span>
                      
                      <p className="text-xs text-gray-500">
                        {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES')}
                      </p>

                      {solicitud.estado === 'pendiente' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveSolicitud(solicitud.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectSolicitud(solicitud.id, 'Rechazado por el administrador')}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenido de Crear Usuario */}
        {selectedTab === 'create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Crear Nuevo Usuario</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={newUser.telefono}
                    onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.nombre}
                    onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.apellidos}
                    onChange={(e) => setNewUser({ ...newUser, apellidos: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={newUser.rol}
                    onChange={(e) => setNewUser({ ...newUser, rol: e.target.value as UserRole })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="despacho_admin">Admin Despacho</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setNewUser({ email: '', nombre: '', apellidos: '', telefono: '', rol: 'despacho_admin' })}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}