'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function DiagnosticPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Diagnostic Page Loaded');
    console.log('👤 User:', user);
    console.log('⏳ Loading:', isLoading);
    console.log('🌍 Window location:', window.location.href);
    console.log('📍 Router pathname:', window.location.pathname);
  }, [user, isLoading]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Diagnóstico de Navegación</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <strong>URL actual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
          </div>
          <div>
            <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? 'true' : 'false'}
          </div>
          <div>
            <strong>localStorage:</strong> {typeof window !== 'undefined' ? localStorage.getItem('lexhoy_user') : 'N/A'}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
          >
            Ir a Home (router.push)
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-green-500 text-white px-4 py-2 rounded mr-4"
          >
            Ir a Home (window.location)
          </button>

          <button 
            onClick={() => {
              console.log('🔍 Intentando navegar a home...');
              console.log('👤 User antes de navegar:', user);
              router.push('/');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Debug + router.push(&apos;/&apos;)
          </button>
        </div>
      </div>
    </div>
  );
}