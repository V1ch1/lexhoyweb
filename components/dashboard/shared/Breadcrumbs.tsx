"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export const Breadcrumbs = () => {
  const pathname = usePathname();

  // Generar breadcrumbs basados en la ruta actual
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split("/").filter((path) => path);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Mapeo de rutas a nombres legibles
    const routeNames: Record<string, string> = {
      dashboard: "Dashboard",
      admin: "Administración",
      despachos: "Despachos",
      leads: "Leads",
      marketing: "Marketing",
      settings: "Configuración",
      users: "Usuarios",
      "mis-despachos": "Mis Despachos",
      notificaciones: "Notificaciones",
      "listado-leads": "Gestión de Leads",
      solicitudes: "Solicitudes",
      list: "Lista",
      create: "Crear",
    };

    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
      
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // No mostrar breadcrumbs en la página principal del dashboard
  if (pathname === "/dashboard" || pathname === "/dashboard/admin") {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <HomeIcon className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={breadcrumb.href} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 mx-2 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900">{breadcrumb.label}</span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="hover:text-gray-900 transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
