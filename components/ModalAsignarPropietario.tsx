"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  despacho_id?: string;
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
    despacho_id?: string;
  } | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchUser(e.target.value);
    setSelectedUser(null);
  };

  useEffect(() => {
    if (!show || !searchUser) {
      setUserResults([]);
      return;
    }
    setUserLoading(true);
    setUserError(null);
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, nombre, apellidos, despacho_id")
        .or(`email.ilike.%${searchUser}%,nombre.ilike.%${searchUser}%`)
        .limit(10);
      if (error) {
        setUserError("Error al buscar usuarios");
        setUserResults([]);
      } else {
        setUserResults(data || []);
      }
      setUserLoading(false);
    };
    fetchUsers();
  }, [searchUser, show]);

  const handleAsignar = async () => {
    if (!selectedUser || !despachoId) return;

    setUserLoading(true);
    setUserError(null);

    try {
      const { error } = await supabase
        .from("users")
        .update({ despacho_id: despachoId })
        .eq("id", selectedUser.id);

      if (error) throw error;

      onAsignar();
      onClose();
      setSelectedUser(null);
      setSearchUser("");
      setUserResults([]);
    } catch (error) {
      console.error('Error al asignar propietario:', error);
      setUserError("Error al asignar propietario");
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
                    u.despacho_id
                      ? "bg-gray-100 cursor-not-allowed"
                      : "cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  } 
                    ${
                      selectedUser?.id === u.id
                        ? "bg-blue-50 border-blue-300"
                        : ""
                    }`}
                  onClick={() => !u.despacho_id && setSelectedUser(u)}
                >
                  <div className="font-semibold text-gray-900 text-base">
                    {u.nombre} {u.apellidos}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{u.email}</div>
                  {u.despacho_id && (
                    <div className="text-sm text-red-600 font-medium mt-1">
                      Ya administra un despacho
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
          <div className="mb-2 p-2 border rounded bg-gray-50">
            <div>
              <b>Seleccionado:</b> {selectedUser.nombre}{" "}
              {selectedUser.apellidos}
            </div>
            <div>
              <b>Email:</b> {selectedUser.email}
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg flex-1 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            onClick={handleAsignar}
            disabled={
              !selectedUser || userLoading || !!selectedUser?.despacho_id
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
