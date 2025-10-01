import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  despachoId: string | null;
  show: boolean;
  onClose: () => void;
  onAsignar: () => void;
}

const ModalAsignarPropietario: React.FC<Props> = ({ despachoId, show, onClose, onAsignar }) => {
  const [searchUser, setSearchUser] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
        .select("id, email, nombre, apellidos, despacho_nombre")
        .or(`email.ilike.%${searchUser}%,nombre.ilike.%${searchUser}%,despacho_nombre.ilike.%${searchUser}%`)
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
    const { error } = await supabase
      .from("despachos")
      .update({ owner_email: selectedUser.email })
      .eq("id", despachoId);
    if (error) {
      setUserError("Error al asignar propietario");
    } else {
      onAsignar();
      onClose();
      setSelectedUser(null);
      setSearchUser("");
      setUserResults([]);
    }
    setUserLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Asignar propietario</h3>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full mb-2"
          placeholder="Buscar por email o nombre de despacho"
          value={searchUser}
          onChange={e => setSearchUser(e.target.value)}
          disabled={userLoading}
        />
        {userLoading && <div className="text-blue-500 mb-2">Buscando...</div>}
        {userError && <div className="text-red-500 mb-2">{userError}</div>}
        <div className="mb-2">
          {userResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {userResults.map(u => (
                <li key={u.id} className={`py-2 px-2 cursor-pointer rounded hover:bg-blue-50 ${selectedUser?.id === u.id ? 'bg-blue-100' : ''}`}
                    onClick={() => setSelectedUser(u)}>
                  <div className="font-semibold text-blue-700">{u.nombre} {u.apellidos}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  {u.despacho_nombre && <div className="text-xs text-gray-400">Despacho: {u.despacho_nombre}</div>}
                </li>
              ))}
            </ul>
          ) : searchUser && !userLoading ? (
            <div className="text-gray-400 text-sm">No se encontraron usuarios</div>
          ) : null}
        </div>
        {selectedUser && (
          <div className="mb-2 p-2 border rounded bg-gray-50">
            <div><b>Seleccionado:</b> {selectedUser.nombre} {selectedUser.apellidos}</div>
            <div><b>Email:</b> {selectedUser.email}</div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded flex-1"
            onClick={handleAsignar}
            disabled={!selectedUser || userLoading}
          >
            Asignar propietario
          </button>
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded flex-1"
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
