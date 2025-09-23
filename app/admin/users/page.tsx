"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";
import {
  User,
  UserDespacho,
  SolicitudRegistro,
  UserRole,
  UserStatus,
} from "@/lib/types";
import { useAuth } from "@/lib/authContext";

const userService = new UserService();

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "users" | "solicitudes" | "solicitudes-despachos" | "create"
  >("users");
  const [userDespachos, setUserDespachos] = useState<
    Record<string, UserDespacho[]>
  >({});

  // Estado para modal de detalles
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(
    null
  );
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(false);

  // Estado para crear usuario
  const [newUser, setNewUser] = useState({
    email: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    rol: "usuario" as UserRole,
  });

  const checkPermissionsAndLoadData = useCallback(async () => {
    try {
      // Usar el contexto de autenticación
      if (!user) return;

      const isSuperAdmin = user.role === "super_admin";
      setIsSuperAdmin(isSuperAdmin);

      if (isSuperAdmin) {
        await loadUsers();
        await loadSolicitudes();
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
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
      console.error("Error loading users:", error);
    }
  };

  const loadSolicitudes = async () => {
    try {
      const allSolicitudes = await userService.getAllSolicitudes();
      setSolicitudes(allSolicitudes);
    } catch (error) {
      console.error("Error loading solicitudes:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await userService.createUserWithAuth(newUser);

      alert(
        `✅ Usuario creado exitosamente!\n\n📧 Email: ${newUser.email}\n🔑 Contraseña temporal: ${result.temporaryPassword}\n\n⚠️ IMPORTANTE: Guarda esta contraseña y compártela de forma segura con el usuario. Debe cambiarla en su primer login.`
      );

      setNewUser({
        email: "",
        nombre: "",
        apellidos: "",
        telefono: "",
        rol: "usuario",
      });
      await loadUsers();
      setSelectedTab("users");
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`❌ Error al crear usuario: ${errorMessage}`);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      await loadUsers();
      console.log(`✅ Rol actualizado a: ${newRole}`);
    } catch (error) {
      console.error("Error changing user role:", error);
      alert("Error al cambiar el rol del usuario");
    }
  };

  const handleShowUserDetails = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUserDetails(null);
    setEditingUser(false);
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
      console.error("Error approving solicitud:", error);
    }
  };

  const handleRejectSolicitud = async (solicitudId: string, notas: string) => {
    try {
      const currentUser = await userService.getCurrentUserWithDespachos();
      if (currentUser) {
        await userService.rejectSolicitud(
          solicitudId,
          currentUser.user.id,
          notas
        );
        await loadSolicitudes();
      }
    } catch (error) {
      console.error("Error rejecting solicitud:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Verificando permisos...</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Reintentar
          </button>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            Solo los super administradores pueden acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: UserStatus }) => {
    const isActive = status === "activo";

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {isActive ? "Activo" : "Inactivo"}
      </span>
    );
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800",
      despacho_admin: "bg-blue-100 text-blue-800",
      usuario: "bg-gray-100 text-gray-800",
    };

    const labels = {
      super_admin: "Super Admin",
      despacho_admin: "Admin Despacho",
      usuario: "Usuario",
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}
      >
        {labels[role]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Título de la página */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Administración de Usuarios
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona usuarios, roles y permisos del sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: "users", label: "Usuarios", count: users.length },
              {
                key: "solicitudes",
                label: "Solicitudes",
                count: solicitudes.filter((s) => s.estado === "pendiente")
                  .length,
              },
              {
                key: "solicitudes-despachos",
                label: "Solicitudes Despachos",
                count: null,
              },
              { key: "create", label: "Crear Usuario", count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === "solicitudes-despachos") {
                    router.push("/admin/solicitudes-despachos");
                  } else {
                    setSelectedTab(
                      tab.key as
                        | "users"
                        | "solicitudes"
                        | "solicitudes-despachos"
                        | "create"
                    );
                  }
                }}
                className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      selectedTab === tab.key
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de Usuarios */}
        {selectedTab === "users" && (
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
                      Cambiar Rol
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
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.telefono && (
                            <div className="text-sm text-gray-500">
                              {user.telefono}
                            </div>
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
                        {new Date(user.fechaRegistro).toLocaleDateString(
                          "es-ES"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.rol}
                            onChange={(e) =>
                              handleChangeUserRole(
                                user.id,
                                e.target.value as UserRole
                              )
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="usuario">Usuario</option>
                            <option value="despacho_admin">
                              Despacho Admin
                            </option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <button
                            className="text-blue-600 hover:text-blue-900 text-sm"
                            onClick={() => handleShowUserDetails(user)}
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contenido de Solicitudes */}
        {selectedTab === "solicitudes" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Solicitudes de Registro (
                {solicitudes.filter((s) => s.estado === "pendiente").length}{" "}
                pendientes)
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
                        <p className="text-sm text-gray-600">
                          Empresa: {solicitud.empresa}
                        </p>
                      )}

                      {solicitud.datosDespacho && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">
                            Datos del Despacho:
                          </h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <strong>Nombre:</strong>{" "}
                              {
                                (
                                  solicitud.datosDespacho as Record<
                                    string,
                                    unknown
                                  >
                                ).nombre as string
                              }
                            </p>
                            <p>
                              <strong>Especialidades:</strong>{" "}
                              {(
                                (
                                  solicitud.datosDespacho as Record<
                                    string,
                                    unknown
                                  >
                                ).especialidades as string[]
                              )?.join(", ")}
                            </p>
                            <p>
                              <strong>Ubicación:</strong>{" "}
                              {
                                (
                                  solicitud.datosDespacho as Record<
                                    string,
                                    unknown
                                  >
                                ).ciudad as string
                              }
                              ,{" "}
                              {
                                (
                                  solicitud.datosDespacho as Record<
                                    string,
                                    unknown
                                  >
                                ).provincia as string
                              }
                            </p>
                          </div>
                        </div>
                      )}

                      {solicitud.mensaje && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            <strong>Mensaje:</strong> {solicitud.mensaje}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col items-end space-y-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          solicitud.estado === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : solicitud.estado === "aprobado"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {solicitud.estado}
                      </span>

                      <p className="text-xs text-gray-500">
                        {new Date(solicitud.fechaSolicitud).toLocaleDateString(
                          "es-ES"
                        )}
                      </p>

                      {solicitud.estado === "pendiente" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveSolicitud(solicitud.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() =>
                              handleRejectSolicitud(
                                solicitud.id,
                                "Rechazado por el administrador"
                              )
                            }
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
        {selectedTab === "create" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Crear Nuevo Usuario
            </h3>

            {/* Información importante */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Información sobre la creación de usuarios
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Se creará la cuenta de autenticación automáticamente
                      </li>
                      <li>
                        Se generará una contraseña temporal que debes compartir
                        con el usuario
                      </li>
                      <li>
                        El usuario debe cambiar la contraseña en su primer login
                      </li>
                      <li>
                        Los usuarios con rol &quot;Usuario&quot; necesitan ser
                        asignados a un despacho para acceder a funciones
                        avanzadas
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

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
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewUser({ ...newUser, telefono: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewUser({ ...newUser, nombre: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewUser({ ...newUser, apellidos: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={newUser.rol}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        rol: e.target.value as UserRole,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="usuario">Usuario</option>
                    <option value="despacho_admin">Admin Despacho</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() =>
                    setNewUser({
                      email: "",
                      nombre: "",
                      apellidos: "",
                      telefono: "",
                      rol: "usuario",
                    })
                  }
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

      {/* Modal de Detalles del Usuario */}
      {showUserModal && selectedUserDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles del Usuario
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {!editingUser ? (
                // Vista de solo lectura
                <div className="space-y-6">
                  {/* Información Básica */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Información Básica
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUserDetails.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nombre Completo
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUserDetails.nombre}{" "}
                          {selectedUserDetails.apellidos}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Teléfono
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUserDetails.telefono || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Plan
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUserDetails.plan}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información del Sistema */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Información del Sistema
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rol
                        </label>
                        <div className="mt-1">
                          <RoleBadge role={selectedUserDetails.rol} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Estado
                        </label>
                        <div className="mt-1">
                          <StatusBadge status={selectedUserDetails.estado} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Fecha de Registro
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(
                            selectedUserDetails.fechaRegistro
                          ).toLocaleString("es-ES")}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Último Acceso
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUserDetails.ultimoAcceso
                            ? new Date(
                                selectedUserDetails.ultimoAcceso
                              ).toLocaleString("es-ES")
                            : "Nunca"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email Verificado
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              selectedUserDetails.emailVerificado
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedUserDetails.emailVerificado
                              ? "Verificado"
                              : "No verificado"}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Cuenta Activa
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              selectedUserDetails.activo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedUserDetails.activo ? "Activa" : "Inactiva"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información de Despachos */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Despachos Asignados
                    </h4>
                    {userDespachos[selectedUserDetails.id]?.length ? (
                      <div className="space-y-2">
                        {userDespachos[selectedUserDetails.id].map(
                          (despacho, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded border"
                            >
                              <p className="text-sm font-medium">
                                ID: {despacho.despachoId}
                              </p>
                              <p className="text-xs text-gray-500">
                                Asignado:{" "}
                                {new Date(
                                  despacho.fechaAsignacion
                                ).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No tiene despachos asignados
                      </p>
                    )}
                  </div>

                  {/* Notas del Admin */}
                  {selectedUserDetails.notasAdmin && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Notas del Administrador
                      </h4>
                      <p className="text-sm text-gray-700">
                        {selectedUserDetails.notasAdmin}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Vista de edición (para futuras implementaciones)
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Modo de edición - En desarrollo
                  </p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditingUser(!editingUser)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={editingUser}
                >
                  {editingUser ? "Editando..." : "Editar Usuario"}
                </button>
              </div>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
