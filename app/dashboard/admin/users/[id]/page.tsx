"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { UserService } from "@/lib/userService";
import { User, UserDespacho, UserRole, UserStatus } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";

const userService = new UserService();

// Utilidad para decodificar entidades HTML
function decodeHtml(html: string): string {
  if (!html) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// Utilidad para formatear el rol
function formatRole(rol: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    super_admin: "Super Admin",
    despacho_admin: "Admin Despacho",
    usuario: "Usuario",
  };
  return roleMap[rol] || rol;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userDespachos, setUserDespachos] = useState<UserDespacho[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    rol: "usuario" as UserRole,
    estado: "activo" as UserStatus,
    activo: true,
    emailVerificado: false,
    notasAdmin: "",
  });

  useEffect(() => {
    if (!authLoading && currentUser?.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    if (params?.id && typeof params.id === "string") {
      loadUserData(params.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id, authLoading, currentUser?.id]);

  const loadUserData = async (userId: string) => {
    try {
      setError(null);

      const userData = await userService.getUserById(userId);
      if (!userData) {
        setError("Usuario no encontrado");
        return;
      }

      setUser(userData);
      setFormData({
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        email: userData.email,
        telefono: userData.telefono || "",
        rol: userData.rol,
        estado: userData.estado,
        activo: userData.activo,
        emailVerificado: userData.emailVerificado,
        notasAdmin: userData.notasAdmin || "",
      });

      // Cargar despachos asignados
      const despachos = await userService.getUserDespachos(userId);
      setUserDespachos(despachos);
    } catch (error) {
      console.error("Error loading user:", error);
      setError("Error al cargar los datos del usuario");
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
        notasAdmin: formData.notasAdmin,
      });

      setSuccessMessage("Usuario actualizado exitosamente");

      // Redirigir después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        router.push("/dashboard/admin/users");
      }, 2000);
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/admin/users");
  };

  const handleDesasignarDespacho = (despachoId: string) => {
    if (!user) return;

    toast("¿Estás seguro de desasignar este despacho?", {
      action: {
        label: "Desasignar",
        onClick: async () => {
          try {
            await userService.unassignDespachoFromUser(user.id, despachoId);

            // Recargar datos del usuario (para actualizar rol si cambió) y despachos
            await loadUserData(user.id);

            toast.success("Despacho desasignado exitosamente");
          } catch (error) {
            console.error("Error al desasignar despacho:", error);
            toast.error("Error al desasignar el despacho");
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    });
  };

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/dashboard/admin/users")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Volver a Usuarios
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Breadcrumb y botón volver */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button
            onClick={() => router.push("/dashboard/admin/users")}
            className="hover:text-gray-700"
          >
            Usuarios
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {user.nombre} {user.apellidos}
          </span>
        </nav>
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          ← Volver
        </button>
      </div>

      {/* Mensaje de Éxito */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                ✅ {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header con info del usuario */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.nombre} {user.apellidos}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      formData.activo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {formData.activo ? "Activo" : "Inactivo"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {formatRole(formData.rol)}
                  </span>
                  {formData.emailVerificado && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Email verificado
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              {userDespachos.length > 0 ? (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Despacho asignado</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {decodeHtml(
                      userDespachos[0]?.despachos?.nombre || "Despacho"
                    )}
                  </p>
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/despachos/ver-despachos?modo=asignar&userId=${user.id}&returnTo=/dashboard/admin/users/${user.id}`
                      )
                    }
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Cambiar despacho
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/despachos/ver-despachos?modo=asignar&userId=${user.id}&returnTo=/dashboard/admin/users/${user.id}`
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Buscar Despacho
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Información Básica
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre del usuario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) =>
                      handleInputChange("apellidos", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Apellidos del usuario"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  El email no se puede modificar por seguridad
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) =>
                    handleInputChange("telefono", e.target.value)
                  }
                  placeholder="+34 600 123 456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Configuración de cuenta */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Configuración de Cuenta
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => handleInputChange("rol", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="usuario">Usuario</option>
                    <option value="despacho_admin">Admin Despacho</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) =>
                      handleInputChange("estado", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) =>
                      handleInputChange("activo", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Cuenta activa
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emailVerificado}
                    onChange={(e) =>
                      handleInputChange("emailVerificado", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Email verificado
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Notas del administrador */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Notas Internas
              </h2>
            </div>
            <div className="p-6">
              <textarea
                value={formData.notasAdmin}
                onChange={(e) =>
                  handleInputChange("notasAdmin", e.target.value)
                }
                rows={5}
                placeholder="Añade notas internas sobre este usuario (solo visible para administradores)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Despachos Asignados */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Despachos Asignados
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Despachos que este usuario puede gestionar
              </p>
            </div>
            <div className="p-6">
              {userDespachos.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="h-12 w-12 text-gray-400 mx-auto mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <p className="text-gray-500 mb-4">
                    Este usuario no tiene despachos asignados.
                  </p>
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/despachos/ver-despachos?modo=asignar&userId=${user.id}&returnTo=/dashboard/admin/users/${user.id}`
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Buscar Despacho
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userDespachos.map((despacho) => (
                    <div
                      key={despacho.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {decodeHtml(
                              despacho.despachos?.nombre || "Despacho"
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {despacho.despachos?.slug || ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex gap-2">
                          {despacho.permisos?.leer && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              Leer
                            </span>
                          )}
                          {despacho.permisos?.escribir && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              Escribir
                            </span>
                          )}
                          {despacho.permisos?.eliminar && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              Eliminar
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleDesasignarDespacho(despacho.despachoId)
                          }
                          className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Desasignar
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/despachos/ver-despachos?modo=asignar&userId=${user.id}&returnTo=/dashboard/admin/users/${user.id}`
                      )
                    }
                    className="w-full mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Buscar Otro Despacho
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas del Usuario */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Estadísticas
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Despachos asignados:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {userDespachos.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Fecha de registro:
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {user.fechaRegistro
                    ? new Date(user.fechaRegistro).toLocaleDateString("es-ES")
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Último acceso:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.ultimoAcceso
                    ? new Date(user.ultimoAcceso).toLocaleDateString("es-ES")
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
