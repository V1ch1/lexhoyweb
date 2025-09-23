"use client";
// Utilidad para decodificar entidades HTML
function decodeHtml(html: string) {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}
import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';

interface Despacho {
  id: number;
  title: { rendered: string };
  meta?: {
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email_contacto?: string;
    [key: string]: any;
  };
}

export default function SolicitarDespacho() {
  const [nombre, setNombre] = useState('');
  const [results, setResults] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudId, setSolicitudId] = useState<number | null>(null);
  const [solicitados, setSolicitados] = useState<number[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setSuccess(null);
  const query = nombre;
    try {
      const res = await fetch(`/api/search-despachos?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Error al buscar despachos');
      const data = await res.json();
      setResults(data);
    } catch {
      setError('Error al buscar despachos');
    } finally {
      setLoading(false);
    }
  };

  // Usar el hook de autenticación correctamente
  const { user } = useAuth();
  const handleSolicitar = async (despachoId: number) => {
    setSolicitudId(despachoId);
    setError(null);
    setSuccess(null);
    try {
      if (!user?.id) throw new Error('Usuario no autenticado');
      const userId = user.id;
      const userEmail = user.email || '';
      const userName = user.name || '';
      // Buscar el despacho en results
      const despacho = results.find(d => d.id === despachoId);
      const despachoNombre = decodeHtml(despacho?.title?.rendered || '');
      let despachoLocalidad = '';
      let despachoProvincia = '';
      if (despacho?.meta) {
        despachoLocalidad = decodeHtml(despacho.meta.localidad || '');
        despachoProvincia = decodeHtml(despacho.meta.provincia || '');
        if ((!despachoLocalidad || !despachoProvincia) && Array.isArray(despacho.meta._despacho_sedes) && despacho.meta._despacho_sedes.length > 0) {
          const sede = despacho.meta._despacho_sedes[0];
          despachoLocalidad = decodeHtml(sede.localidad || despachoLocalidad);
          despachoProvincia = decodeHtml(sede.provincia || despachoProvincia);
        }
      }
      const res = await fetch('/api/solicitar-despacho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          despachoId,
          userEmail,
          userName,
          despachoNombre,
          despachoLocalidad,
          despachoProvincia
        }),
      });
      if (!res.ok) throw new Error('Error al solicitar vinculación');
      setSolicitados(prev => [...prev, despachoId]);
      setSuccess('Solicitud enviada correctamente');
    } catch {
      setError('Error al solicitar vinculación');
    } finally {
      setSolicitudId(null);
    }
  };

  return (
  <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Buscar y solicitar vinculación de despacho</h2>
      <form onSubmit={handleSearch} className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del despacho</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: MB Advocats"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
  <button type="submit" className="bg-primary text-white px-6 py-2 rounded shadow hover:bg-primary-dark transition self-end">Buscar</button>
      </form>
      {loading && <div className="flex items-center gap-2 text-blue-600"><span className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full"></span> Buscando...</div>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
  {success && <p className="text-green-600 mb-4">{success}</p>}
  <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Localidad</th>
            <th className="px-4 py-2">Provincia</th>
            <th className="px-4 py-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {results.map(despacho => {
            let localidad = decodeHtml(despacho.meta?.localidad || '');
            let provincia = decodeHtml(despacho.meta?.provincia || '');
            if ((!localidad || !provincia) && Array.isArray(despacho.meta?._despacho_sedes) && despacho.meta._despacho_sedes.length > 0) {
              const sede = despacho.meta._despacho_sedes[0];
              localidad = decodeHtml(sede.localidad || localidad);
              provincia = decodeHtml(sede.provincia || provincia);
            }
            // Si el despacho ya ha sido solicitado, mostrar botón diferente
            const solicitado = solicitados.includes(despacho.id);
            return (
              <tr key={despacho.id} className="border-b">
                <td className="px-4 py-2 font-semibold text-gray-900 w-1/3">{decodeHtml(despacho.title.rendered)}</td>
                <td className="px-4 py-2 w-1/4">{localidad}</td>
                <td className="px-4 py-2 w-1/4">{provincia}</td>
                <td className="px-4 py-2 w-1/6">
                  {solicitado ? (
                    <button
                      className="bg-gray-400 text-white px-4 py-2 rounded shadow cursor-not-allowed"
                      disabled
                    >
                      Solicitado
                    </button>
                  ) : (
                    <button
                      className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark transition"
                      onClick={() => handleSolicitar(despacho.id)}
                    >
                      Solicitar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(!loading && results.length === 0 && nombre) && (
        <p className="text-gray-500 mt-6">No se encontraron despachos con ese nombre.</p>
      )}
    </div>
  );
}
