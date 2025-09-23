
'use client';
import React, { useState } from 'react';

interface Despacho {
  id: number;
  title: { rendered: string };
  meta?: any;
}

export default function SolicitarDespacho() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Reemplaza con tu usuario y app password seguros
  const username = process.env.NEXT_PUBLIC_WP_USER || '';
  const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD || '';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search-despachos?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Error al buscar despachos');
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <ul>
        {results.map(despacho => (
          <li key={despacho.id} className="border-b py-2 flex justify-between items-center">
            <span>{despacho.title.rendered}</span>
            <button className="bg-green-600 text-white px-2 py-1 rounded">Solicitar vinculación</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
