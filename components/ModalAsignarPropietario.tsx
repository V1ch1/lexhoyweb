"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  despacho_id?: string;
}

const ModalAsignarPropietario = ({ despachoId, show, onClose, onAsignar }: {
  despachoId: string | null;
  show: boolean;
  onClose: () => void;
  onAsignar: () => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchUser, setSearchUser] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input cuando se muestra el modal
  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  // Función para buscar usuarios con debounce
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    setUserLoading(true);
    setUserError(null);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, nombre, apellidos, despacho_id")
        .or(`email.ilike.%${query}%,nombre.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      
      // Usar requestAnimationFrame para asegurar que el foco se mantenga
      requestAnimationFrame(() => {
        setUserResults(data || []);
        // Volver a enfocar el input después de actualizar los resultados
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    } catch (error) {
      setUserError("Error al buscar usuarios");
      setUserResults([]);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Manejar cambios en el input con debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchUser(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Solo buscar si hay al menos 2 caracteres para reducir actualizaciones innecesarias
    if (value.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        searchUsers(value);
      }, 300);
    } else {
      setUserResults([]);
    }
  };

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
        <h3 className="text-xl font-bold text-gray-900 mb-4">Asignar propietario</h3>
        <input
          type="text"
          ref={inputRef}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar por email o nombre"
          value={searchUser}
          onChange={handleSearchChange}
          disabled={userLoading}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
        {userLoading && <div className="text-blue-600 font-medium mb-3">Buscando usuarios...</div>}
        {userError && <div className="text-red-600 font-medium bg-red-50 px-3 py-2 rounded-md mb-3">{userError}</div>}
        <div className="mb-2">
          {userResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {userResults.map(u => (
                <li 
                  key={u.id} 
                  className={`p-3 rounded-lg mb-2 ${u.despacho_id 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : 'cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200'} 
                    ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-300' : ''}`}
                  onClick={() => !u.despacho_id && setSelectedUser(u)}
                >
                  <div className="font-semibold text-gray-900 text-base">{u.nombre} {u.apellidos}</div>
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
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Seleccionado:</div>
            <div className="text-lg font-semibold text-gray-900">{selectedUser.nombre} {selectedUser.apellidos}</div>
            <div className="text-sm text-gray-600">{selectedUser.email}</div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg flex-1 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            onClick={handleAsignar}
            disabled={!selectedUser || userLoading || !!selectedUser?.despacho_id}
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
