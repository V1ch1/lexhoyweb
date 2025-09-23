import { BellIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function NotificationBell({ count }: { count: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative focus:outline-none"
        onClick={() => setOpen(!open)}
        aria-label="Notificaciones"
      >
        <BellIcon className="h-7 w-7 text-gray-300 hover:text-white transition" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50">
          <div className="p-4 border-b font-semibold text-gray-700">Solicitudes pendientes</div>
          <div className="p-4 text-sm text-gray-600">
            <Link href="/admin/solicitudes-despachos" className="text-blue-600 hover:underline">
              Ver todas las solicitudes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
