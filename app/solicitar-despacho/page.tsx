
"use client";
// Función segura para obtener el JWT
function getJWT() {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('supabase_jwt') || '';
  }
  return '';
}
import React, { useState } from 'react';


interface Despacho {
  id: number;
  title: { rendered: string };
  meta?: {
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email_contacto?: string;
    object_id?: string;
    _despacho_sedes?: Array<{
      localidad?: string;
      provincia?: string;
    }>;
  };
}


export default function SolicitarDespacho() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [solicitados, setSolicitados] = useState<number[]>([]);

  // Buscar despachos
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getJWT();
      const res = await fetch(`/api/search-despachos?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al buscar despachos');
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Error al buscar despachos');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar vinculación
  const handleSolicitar = async (despacho: Despacho) => {
    setError(null);
    setSuccess(null);
    try {
      // Obtener datos del despacho desde WordPress
      const despachoNombre = despacho.title?.rendered || '';
      let despachoLocalidad = despacho.meta?.localidad || '';
      let despachoProvincia = despacho.meta?.provincia || '';
      if ((!despachoLocalidad || !despachoProvincia) && Array.isArray(despacho.meta?._despacho_sedes) && despacho.meta?._despacho_sedes.length > 0) {
        const sede = despacho.meta._despacho_sedes[0];
        despachoLocalidad = sede.localidad || despachoLocalidad;
        despachoProvincia = sede.provincia || despachoProvincia;
      }
      const objectId = despacho.meta?.object_id || `lexhoy-${despacho.id}`;

      // Obtener el JWT de forma segura
      const token = getJWT();
      if (!token) throw new Error('No se pudo obtener el token de sesión');

      // Simular datos de usuario (puedes adaptar esto si tienes contexto de usuario)
      const userId = window.localStorage.getItem('supabase_user_id') || '';
      const userEmail = window.localStorage.getItem('supabase_user_email') || '';
      const userName = window.localStorage.getItem('supabase_user_name') || '';
      if (!userId || !userEmail || !userName) throw new Error('No se encontró información de usuario');

      // Guardar la solicitud en Supabase usando el objectId como despachoId
      const res = await fetch('/api/solicitar-despacho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          despachoId: objectId,
          userEmail,
          userName,
          despachoNombre,
          despachoLocalidad,
          despachoProvincia
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al solicitar vinculación');
      setSolicitados(prev => [...prev, despacho.id]);
      setSuccess('Solicitud enviada correctamente');
    } catch (err: any) {
      setError(err.message || 'Error al solicitar vinculación');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Buscar despacho</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nombre, localidad, etc."
          className="border rounded px-2 py-1 flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Buscar</button>
      </form>
      {loading && <p>Buscando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
      <ul>
        {results.map(despacho => (
          <li key={despacho.id} className="border-b py-2 flex justify-between items-center">
            <span>{despacho.title.rendered}</span>
            <button
              className={`bg-green-600 text-white px-2 py-1 rounded ${solicitados.includes(despacho.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={solicitados.includes(despacho.id)}
              onClick={() => handleSolicitar(despacho)}
            >
              {solicitados.includes(despacho.id) ? 'Solicitado' : 'Solicitar vinculación'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
