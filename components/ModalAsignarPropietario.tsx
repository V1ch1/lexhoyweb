"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  yaAdministraEsteDespacho?: boolean;
}

const ModalAsignarPropietario = ({
  despachoId,
  show,
  onClose,
  onAsignar,
}: {
  despachoId: string | null;
  show: boolean;
  onClose: () => void;
  onAsignar: () => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchUser, setSearchUser] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [_userError, setUserError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    nombre?: string;
    apellidos?: string;
    yaAdministraEsteDespacho?: boolean;
  } | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchUser(e.target.value);
    setSelectedUser(null);
  };

  useEffect(() => {
    if (!show || !searchUser || searchUser.length < 2) {
      setUserResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUserLoading(true);
      setUserError(null);

      // Validar que despachoId exista
      if (!despachoId) {
        console.error("❌ despachoId es null o undefined");
        setUserError("Error: ID de despacho no válido");
        setUserResults([]);
        setUserLoading(false);
        return;
      }

      console.log("✅ Buscando usuarios para despacho:", despachoId);

      try {
        // Buscar usuarios - solo aquellos con UUID válido (de auth)
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, email, nombre, apellidos")
          .or(`email.ilike.%${searchUser}%,nombre.ilike.%${searchUser}%`)
          // Filtrar solo usuarios con UUID válido (36 caracteres con guiones)
          .not("id", "is", null)
          .limit(10);

        if (usersError) throw usersError;

        // Filtrar usuarios que tengan UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const validUsers = (users || []).filter(user => {
          // Verificar que el ID sea un UUID válido
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(user.id);
        });

        // Para cada usuario válido, verificar si ya administra ESTE despacho
        const usersWithDespacho = await Promise.all(
          validUsers.map(async (user) => {
            // 1. Verificar asignación manual ACTIVA en user_despachos
            const { data: userDespachos } = await supabase
              .from("user_despachos")
              .select("despacho_id")
              .eq("user_id", user.id)
              .eq("despacho_id", despachoId) // Usar como UUID string
              .eq("activo", true) // ⚠️ IMPORTANTE: Solo asignaciones activas
              .maybeSingle();

            // 2. Verificar si es owner_email del despacho
            const { data: despacho } = await supabase
              .from("despachos")
              .select("owner_email")
              .eq("id", despachoId) // Usar como UUID string
              .eq("owner_email", user.email)
              .maybeSingle();

            return {
              ...user,
              yaAdministraEsteDespacho: !!userDespachos || !!despacho,
            };
          })
        );

        setUserResults(usersWithDespacho);
      } catch (error) {
        console.error("Error al buscar usuarios:", error);
        setUserError("Error al buscar usuarios");
        setUserResults([]);
      } finally {
        setUserLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchUser, show, despachoId]);

  const handleAsignar = async () => {
    if (!selectedUser || !despachoId) return;

    if (selectedUser.yaAdministraEsteDespacho) {
      setUserError("Este usuario ya administra este despacho");
      return;
    }

    // Validar que el user_id sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedUser.id)) {
      setUserError("Este usuario tiene un ID inválido. Por favor, contacta con soporte.");
      console.error("❌ ID de usuario no es UUID válido:", selectedUser.id);
      return;
    }

    console.log("✅ Asignando despacho:", despachoId, "a usuario:", selectedUser.id);

    setUserLoading(true);
    setUserError(null);

    try {
      // Verificar si existe una asignación desactivada
      const { data: existingAssignment } = await supabase
        .from("user_despachos")
        .select("id, activo")
        .eq("user_id", selectedUser.id)
        .eq("despacho_id", despachoId) // Usar como UUID string
        .maybeSingle();

      if (existingAssignment) {
        // Reactivar asignación existente
        const { error: updateError } = await supabase
          .from("user_despachos")
          .update({ activo: true })
          .eq("id", existingAssignment.id);

        if (updateError) {
          console.error("❌ Error al reactivar asignación:", updateError);
          throw new Error(
            `Error al reactivar asignación: ${updateError.message}`
          );
        }
      } else {
        // Crear nueva asignación en user_despachos
        const { error: insertError } = await supabase
          .from("user_despachos")
          .insert({
            user_id: selectedUser.id,
            despacho_id: despachoId, // Usar como UUID string
            // No incluir rol ni created_at - se asignarán por defecto en la BD
          });

        if (insertError) {
          console.error("❌ Error al crear relación:", insertError);
          throw new Error(`Error al crear relación: ${insertError.message}`);
        }
      }

      // Actualizar owner_email en despachos
      const { error: updateError } = await supabase
        .from("despachos")
        .update({
          owner_email: selectedUser.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", despachoId); // Usar como UUID string

      if (updateError) {
        console.error("❌ Error al actualizar owner_email:", updateError);
        throw new Error(
          `Error al actualizar owner_email: ${updateError.message}`
        );
      }

      // Enviar email de notificación al usuario asignado
      try {
        const emailResponse = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: selectedUser.email,
            subject: "🎉 Te han asignado un despacho en LexHoy",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">¡Enhorabuena!</h2>
                <p>Hola ${selectedUser.nombre} ${selectedUser.apellidos},</p>
                <p>Te informamos que un administrador te ha asignado como propietario de un despacho en LexHoy.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Ya puedes gestionar tu despacho:</strong></p>
                  <ul style="margin-top: 10px;">
                    <li>Editar información del despacho</li>
                    <li>Gestionar sedes</li>
                    <li>Recibir y gestionar leads</li>
                    <li>Actualizar datos de contacto</li>
                  </ul>
                </div>
                <p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://lexhoy.com"}/dashboard/despachos" 
                     style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                    Ir a Mis Despachos
                  </a>
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Si tienes alguna pregunta, no dudes en contactarnos.
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  Saludos,<br>
                  El equipo de LexHoy
                </p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error("⚠️ Error al enviar email de notificación");
        } else {
        }
      } catch (emailError) {
        console.error("⚠️ Error al enviar email:", emailError);
        // No bloqueamos el flujo si falla el email
      }

      onAsignar();
      onClose();
      setSelectedUser(null);
      setSearchUser("");
      setUserResults([]);
    } catch (error) {
      console.error("❌ Error al asignar propietario:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setUserError(`Error al asignar propietario: ${errorMessage}`);
    } finally {
      setUserLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Asignar propietario
        </h3>
        <input
          ref={inputRef}
          type="text"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar por email o nombre"
          value={searchUser}
          onChange={handleSearchChange}
          disabled={userLoading}
        />
        {userLoading && (
          <div className="text-blue-600 font-medium mb-3">
            Buscando usuarios...
          </div>
        )}
        {_userError && (
          <div className="text-red-500 text-sm mb-4">{_userError}</div>
        )}
        <div className="mb-2">
          {userResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {userResults.map((u) => (
                <li
                  key={u.id}
                  className={`p-3 rounded-lg mb-2 ${
                    u.yaAdministraEsteDespacho
                      ? "bg-gray-100 cursor-not-allowed"
                      : "cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  } 
                    ${
                      selectedUser?.id === u.id
                        ? "bg-blue-50 border-blue-300"
                        : ""
                    }`}
                  onClick={() =>
                    !u.yaAdministraEsteDespacho && setSelectedUser(u)
                  }
                >
                  <div className="font-semibold text-gray-900 text-base">
                    {u.nombre} {u.apellidos}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{u.email}</div>
                  {u.yaAdministraEsteDespacho && (
                    <div className="text-sm text-red-600 font-medium mt-1">
                      Ya administra este despacho
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : searchUser && !userLoading ? (
            <div className="text-gray-600 py-4 text-center bg-gray-50 rounded-lg">
              No se encontraron usuarios que coincidan con la búsqueda
            </div>
          ) : null}
        </div>
        {selectedUser && (
          <div className="mb-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
            <div className="text-sm font-semibold text-blue-900 mb-2">
              ✓ Usuario Seleccionado
            </div>
            <div className="text-base font-medium text-gray-900">
              {selectedUser.nombre} {selectedUser.apellidos}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              {selectedUser.email}
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg flex-1 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            onClick={handleAsignar}
            disabled={
              !selectedUser ||
              userLoading ||
              !!selectedUser?.yaAdministraEsteDespacho
            }
          >
            Asignar propietario
          </button>
          <button
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium px-5 py-3 rounded-lg flex-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            onClick={() => {
              onClose();
              setSelectedUser(null);
              setSearchUser("");
              setUserResults([]);
            }}
            disabled={userLoading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarPropietario;
