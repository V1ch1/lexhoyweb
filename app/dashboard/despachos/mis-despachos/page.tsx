'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import MisDespachosTab from '@/components/settings/MisDespachosTab';

interface Despacho {
  id: string;
  nombre: string;
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  web?: string;
  descripcion?: string;
  num_sedes?: number;
  estado?: string;
  created_at: string;
}

export default function MisDespachosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userDespachos, setUserDespachos] = useState<Despacho[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Load user's despachos
  useEffect(() => {
    const loadUserDespachos = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/users/${user.id}/despachos`);
        const data = await response.json();
        if (response.ok) {
          setUserDespachos(data);
        } else {
          throw new Error(data.message || 'Error al cargar los despachos');
        }
      } catch (error) {
        console.error('Error al cargar los despachos:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar los despachos. Por favor, inténtalo de nuevo.'
        });
      } finally {
        // Loading complete
      }
    };

    loadUserDespachos();
  }, [user]);

  // Handle despacho deletion (desasignar usuario, no eliminar despacho)
  const handleDeleteDespacho = async (despachoId: string) => {
    try {

      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setMessage({
          type: 'error',
          text: 'No estás autenticado'
        });
        return;
      }

      // Llamar al endpoint para desasignar usuario
      const response = await fetch(`/api/user/despachos/${despachoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Respuesta no es JSON:', await response.text());
        throw new Error('Error del servidor. Por favor, recarga la página e intenta de nuevo.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al desasignarte del despacho');
      }

      // Actualizar estado local
      setUserDespachos(prev => prev.filter(d => d.id !== despachoId));
      
      setMessage({
        type: 'success',
        text: 'Te has desasignado del despacho correctamente. El despacho sigue existiendo y puede ser asignado a otros usuarios.'
      });

      // Recargar datos después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error al desasignar del despacho:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al desasignarte del despacho. Por favor, inténtalo de nuevo.'
      });
    } finally {
      // Loading complete
    }
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/despachos')}
          className="mb-3 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Despachos
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Mis Despachos
        </h1>
        <p className="text-lg text-gray-600">
          Administra los despachos a los que tienes acceso
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <svg className="h-5 w-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <MisDespachosTab 
            userDespachos={userDespachos} 
            onDeleteDespacho={handleDeleteDespacho} 
          />
        </div>
      </div>
    </div>
  );
}
