'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';

export default function DiagnosticPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [diagnosticResults, setDiagnosticResults] = useState<{test: string; result: string; status: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const results = [];

    try {
      // 1. Verificar usuario actual
      results.push({
        test: 'Usuario actual',
        result: user ? `${user.email} - Rol: ${user.role}` : 'No autenticado',
        status: user ? 'OK' : 'ERROR'
      });

      // 2. Verificar conexión a Supabase
      const { data: authUser } = await supabase.auth.getUser();
      results.push({
        test: 'Conexión Supabase Auth',
        result: authUser.user ? `ID: ${authUser.user.id}` : 'No conectado',
        status: authUser.user ? 'OK' : 'ERROR'
      });

      // 3. Verificar lectura de usuarios
      const { data: usersRead, error: readError } = await supabase
        .from('users')
        .select('id, email, rol')
        .limit(5);

      results.push({
        test: 'Lectura de usuarios',
        result: readError ? `Error: ${readError.message}` : `${usersRead?.length || 0} usuarios leídos`,
        status: readError ? 'ERROR' : 'OK'
      });

      // 4. Intentar actualización de prueba (sin cambios reales)
      if (usersRead && usersRead.length > 0) {
        const testUserId = usersRead[0].id;
        const { error: updateError } = await supabase
          .from('users')
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq('id', testUserId)
          .select();

        results.push({
          test: 'Prueba de actualización',
          result: updateError ? `Error: ${updateError.message}` : 'Actualización exitosa',
          status: updateError ? 'ERROR' : 'OK'
        });
      }

    } catch (error) {
      results.push({
        test: 'Error general',
        result: error instanceof Error ? error.message : 'Error desconocido',
        status: 'ERROR'
      });
    }

    setDiagnosticResults(results);
    setLoading(false);
  };

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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Diagnóstico del Sistema</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-6">
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

        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded mb-6 disabled:opacity-50"
        >
          {loading ? 'Ejecutando diagnóstico...' : 'Ejecutar Diagnóstico de Permisos'}
        </button>

        {diagnosticResults.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">Resultados:</h2>
            {diagnosticResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded border-l-4 ${
                  result.status === 'OK' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{result.test}</h3>
                    <p className="text-sm text-gray-600 mt-1">{result.result}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'OK'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-8">
          <h3 className="font-medium text-yellow-800">Instrucciones para corregir problema de roles:</h3>
          <ol className="mt-2 text-sm text-yellow-700 space-y-1">
            <li>1. Ve a la consola de Supabase (supabase.com)</li>
            <li>2. Navega a SQL Editor</li>
            <li>3. Ejecuta el contenido del archivo: <code>lib/supabase-fix-policies.sql</code></li>
            <li>4. Vuelve a probar el cambio de roles</li>
          </ol>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
          >
            Ir a Home
          </button>
          
          <button 
            onClick={() => router.push('/admin/users')}
            className="bg-purple-500 text-white px-4 py-2 rounded mr-4"
          >
            Ir a Gestión de Usuarios
          </button>
        </div>
      </div>
    </div>
  );
}