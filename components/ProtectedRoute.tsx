'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'despacho_admin' | 'usuario';
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario, redirigir al login
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Si se requiere un rol específico, verificar
      if (requiredRole && user.role !== requiredRole && user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isLoading, router, requiredRole, redirectTo]);

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, no mostrar contenido
  if (!user) {
    return null;
  }

  // Si se requiere un rol específico y no lo tiene, no mostrar contenido
  if (requiredRole && user.role !== requiredRole && user.role !== 'super_admin') {
    return null;
  }

  return <>{children}</>;
}