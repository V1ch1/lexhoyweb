import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // TODO: Verificar autenticación y permisos de super admin aquí
  // Por ahora, comentamos la verificación hasta implementar auth completa
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}