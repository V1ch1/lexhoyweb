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
import Toast from "@/components/Toast";
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const userService = new UserService();

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistro[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "users" | "solicitudes" | "create"
  >("users");
  const [userDespachos, setUserDespachos] = useState<
    Record<string, UserDespacho[]>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "all">("all");

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

  // Estado para toast
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

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
      setSolicitudes(
        allSolicitudes.map((s) => ({
          id: s.id as string,
          user_id: s.user_id as string | undefined,
          user_email: s.user_email as string | undefined,
          user_name: s.user_name as string | undefined,
          despacho_id: s.despacho_id as string | undefined,
          despacho_nombre: s.despacho_nombre as string | undefined,
          despacho_localidad: s.despacho_localidad as string | undefined,
          despacho_provincia: s.despacho_provincia as string | undefined,
          estado: s.estado as "pendiente" | "aprobado" | "rechazado",
          fechaSolicitud: s.fecha_solicitud
            ? new Date(s.fecha_solicitud as string)
            : new Date(0),
          fechaRespuesta: s.fecha_respuesta
            ? new Date(s.fecha_respuesta as string)
            : undefined,
          respondidoPor: s.respondidoPor as string | undefined,
          notasRespuesta: s.notasRespuesta as string | undefined,
          userCreadoId: s.userCreadoId as string | undefined,
          despachoCreadoId: s.despachoCreadoId as string | undefined,
          email: s.email as string | undefined,
          nombre: s.nombre as string | undefined,
          apellidos: s.apellidos as string | undefined,
          telefono: s.telefono as string | undefined,
          empresa: s.empresa as string | undefined,
          mensaje: s.mensaje as string | undefined,
          datosDespacho: s.datosDespacho as SolicitudRegistro["datosDespacho"],
        }))
      );
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

  const handleApproveSolicitud = async (solicitudId: string, notas?: string) => {
    try {
      // Obtener el token de autenticación desde Supabase
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setToast({
          type: "error",
          message: "No hay sesión activa.",
        });
        return;
      }

      // Llamar al endpoint API
      const response = await fetch("/api/aprobar-solicitud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          solicitudId,
          notas: notas || "Solicitud aprobada",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al aprobar solicitud");
      }

      await loadSolicitudes();
      await loadUsers();
      setToast({
        type: "success",
        message: "Solicitud aprobada y despacho asignado correctamente.",
      });
    } catch (error) {
      console.error("Error approving solicitud de despacho:", error);
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Error al aprobar la solicitud de despacho.",
      });
    }
  };

  const handleRejectSolicitud = async (solicitudId: string, notas: string) => {
    try {
      // Obtener el token de autenticación desde Supabase
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setToast({
          type: "error",
          message: "No hay sesión activa.",
        });
        return;
      }

      // Llamar al endpoint API
      const response = await fetch("/api/rechazar-solicitud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          solicitudId,
          notas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al rechazar solicitud");
      }

      await loadSolicitudes();
      setToast({ type: "info", message: "Solicitud rechazada correctamente." });
    } catch (error) {
      console.error("Error rejecting solicitud de despacho:", error);
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Error al rechazar la solicitud de despacho.",
      });
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

  // Filtrar usuarios
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchTerm === "" ||
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.rol === filterRole;
    const matchesStatus = filterStatus === "all" || u.estado === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          duration={3500}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Administra usuarios, roles y solicitudes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {users.length} usuarios totales
          </span>
        </div>
      </div>

      {/* Tabs modernos y compactos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            {
              key: "users",
              label: "Usuarios",
              icon: UserGroupIcon,
              count: users.length,
            },
            {
              key: "solicitudes",
              label: "Solicitudes",
              icon: ClipboardDocumentListIcon,
              count: solicitudes.filter((s) => s.estado === "pendiente").length,
            },
            {
              key: "create",
              label: "Crear Usuario",
              icon: UserPlusIcon,
              count: null,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setSelectedTab(tab.key as "users" | "solicitudes" | "create")
              }
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                selectedTab === tab.key
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selectedTab === tab.key
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido de Usuarios */}
        {selectedTab === "users" && (
          <div className="p-6 space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={filterRole}
                    onChange={(e) =>
                      setFilterRole(e.target.value as UserRole | "all")
                    }
                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">Todos los roles</option>
                    <option value="usuario">Usuario</option>
                    <option value="despacho_admin">Admin Despacho</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as UserStatus | "all")
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Grid de tarjetas de usuarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base">
                        {user.nombre} {user.apellidos}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.telefono && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{user.telefono}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <RoleBadge role={user.rol} />
                      <StatusBadge status={user.estado} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{userDespachos[user.id]?.length || 0} despachos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {new Date(user.fechaRegistro).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <select
                      value={user.rol}
                      onChange={(e) =>
                        handleChangeUserRole(user.id, e.target.value as UserRole)
                      }
                      className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="usuario">Usuario</option>
                      <option value="despacho_admin">Admin Despacho</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <button
                      onClick={() => handleShowUserDetails(user)}
                      className="px-4 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No se encontraron usuarios</p>
                <p className="text-sm text-gray-500 mt-1">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contenido de Solicitudes */}
        {selectedTab === "solicitudes" && (
          <div className="p-6 space-y-4">
            {/* Filtros de solicitudes */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filtrar por estado:</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                  Pendientes ({solicitudes.filter((s) => s.estado === "pendiente").length})
                </button>
                <button className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                  Todas ({solicitudes.length})
                </button>
              </div>
            </div>

            {/* Grid de solicitudes */}
            <div className="grid grid-cols-1 gap-4">
              {solicitudes
                .filter((s) => s.estado === "pendiente")
                .map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {solicitud.user_name || "Sin nombre"}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                              solicitud.estado === "pendiente"
                                ? "bg-yellow-100 text-yellow-800"
                                : solicitud.estado === "aprobado"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {solicitud.estado === "pendiente" && (
                              <ClockIcon className="h-3 w-3" />
                            )}
                            {solicitud.estado === "aprobado" && (
                              <CheckCircleIcon className="h-3 w-3" />
                            )}
                            {solicitud.estado === "rechazado" && (
                              <XCircleIcon className="h-3 w-3" />
                            )}
                            {solicitud.estado}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 text-sm text-gray-600">
                          {solicitud.user_email && (
                            <div className="flex items-center gap-2">
                              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                              <span>{solicitud.user_email}</span>
                            </div>
                          )}
                          {solicitud.telefono && (
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-gray-400" />
                              <span>{solicitud.telefono}</span>
                            </div>
                          )}
                          {solicitud.empresa && (
                            <div className="flex items-center gap-2">
                              <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                              <span>{solicitud.empresa}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {solicitud.fechaSolicitud
                              ? typeof solicitud.fechaSolicitud === "string"
                                ? !isNaN(Date.parse(solicitud.fechaSolicitud))
                                  ? new Date(
                                      solicitud.fechaSolicitud
                                    ).toLocaleDateString("es-ES")
                                  : "Fecha no disponible"
                                : solicitud.fechaSolicitud instanceof Date
                                ? solicitud.fechaSolicitud.toLocaleDateString("es-ES")
                                : "Fecha no disponible"
                              : "Fecha no disponible"}
                          </span>
                        </div>
                        {solicitud.estado === "pendiente" && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleApproveSolicitud(solicitud.id)}
                              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Aprobar
                            </button>
                            <button
                              onClick={() =>
                                handleRejectSolicitud(
                                  solicitud.id,
                                  "Rechazado por el administrador"
                                )
                              }
                              className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              <XCircleIcon className="h-4 w-4" />
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información adicional colapsable */}
                    {(solicitud.despacho_nombre || solicitud.datosDespacho || solicitud.mensaje) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {solicitud.despacho_nombre && (
                          <div className="flex items-start gap-2 text-sm">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-700">Despacho: </span>
                              <span className="text-gray-600">{solicitud.despacho_nombre}</span>
                            </div>
                          </div>
                        )}
                        
                        {solicitud.datosDespacho && (
                          <div className="bg-blue-50 rounded-lg p-3 text-sm">
                            <h5 className="font-medium text-blue-900 mb-2">
                              Datos del Despacho
                            </h5>
                            <div className="space-y-1 text-blue-800">
                              {(() => {
                                const datos = solicitud.datosDespacho as Record<string, unknown>;
                                return (
                                  <>
                                    <p>
                                      <strong>Nombre:</strong>{" "}
                                      {String(datos.nombre || "")}
                                    </p>
                                    {datos.especialidades && (
                                      <p>
                                        <strong>Especialidades:</strong>{" "}
                                        {(datos.especialidades as string[])?.join(", ")}
                                      </p>
                                    )}
                                    <p>
                                      <strong>Ubicación:</strong>{" "}
                                      {String(datos.ciudad || "")}, {String(datos.provincia || "")}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {solicitud.mensaje && (
                          <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <p className="font-medium text-gray-700 mb-1">Mensaje:</p>
                            <p className="text-gray-600">{solicitud.mensaje}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {solicitudes.filter((s) => s.estado === "pendiente").length === 0 && (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No hay solicitudes pendientes</p>
                <p className="text-sm text-gray-500 mt-1">
                  Todas las solicitudes han sido procesadas
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contenido de Crear Usuario */}
        {selectedTab === "create" && (
          <div className="p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Información importante */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Información importante
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Se creará automáticamente la cuenta de autenticación</li>
                      <li>• Se generará una contraseña temporal para compartir</li>
                      <li>• El usuario debe cambiarla en su primer inicio de sesión</li>
                      <li>• Los usuarios normales requieren asignación a un despacho</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleCreateUser} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
                <h3 className="text-lg font-semibold text-gray-900 pb-3 border-b border-gray-200">
                  Datos del Nuevo Usuario
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        placeholder="usuario@ejemplo.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.nombre}
                      onChange={(e) =>
                        setNewUser({ ...newUser, nombre: e.target.value })
                      }
                      placeholder="Juan"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.apellidos}
                      onChange={(e) =>
                        setNewUser({ ...newUser, apellidos: e.target.value })
                      }
                      placeholder="Pérez García"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Teléfono
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={newUser.telefono}
                        onChange={(e) =>
                          setNewUser({ ...newUser, telefono: e.target.value })
                        }
                        placeholder="+34 600 000 000"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rol <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newUser.rol}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          rol: e.target.value as UserRole,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="usuario">Usuario</option>
                      <option value="despacho_admin">Admin Despacho</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Limpiar formulario
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Crear Usuario
                  </button>
                </div>
              </form>
            </div>
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

