"use client";

import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/authContext";

export default function MarketingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Obtener rol del usuario desde el contexto
  const userRole = user?.role || null;

  const allMarketingOptions = [
    {
      title: "SEO",
      subtitle: "Revisa las entradas de SEO",
      description:
        "Gestiona y participa en las entradas de blog relacionadas con SEO para mejorar tu visibilidad online",
      icon: MagnifyingGlassIcon,
      href: "/dashboard/marketing/seo",
      color: "blue",
      superAdminOnly: false,
    },
    {
      title: "Entradas en Proyecto",
      subtitle: "Contenido en desarrollo",
      description:
        "Revisa y participa en las entradas de blog que están actualmente en desarrollo",
      icon: DocumentTextIcon,
      href: "/dashboard/marketing/entradas-proyecto",
      color: "yellow",
      superAdminOnly: false,
    },
    {
      title: "Entradas LexHoy Publicadas",
      subtitle: "Revisa las entradas de LexHoy publicadas",
      description:
        "Explora las entradas de blog ya publicadas en LexHoy y participa en las que te interesen",
      icon: CheckCircleIcon,
      href: "/dashboard/marketing/entradas-publicadas",
      color: "green",
      superAdminOnly: false,
    },
    {
      title: "Gestión de Entradas",
      subtitle: "Administración (Solo Super Admin)",
      description:
        "Crea, edita, publica y gestiona las entradas en proyecto. Panel de administración completo.",
      icon: Cog6ToothIcon,
      href: "/dashboard/marketing/gestion-entradas",
      color: "purple",
      superAdminOnly: true, // Solo super_admin
    },
  ];

  // Filtrar opciones según el rol del usuario
  const marketingOptions = allMarketingOptions.filter(
    (option) => !option.superAdminOnly || userRole === "super_admin"
  );

  // Debug
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
      },
      yellow: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "text-yellow-600",
        button: "bg-yellow-600 hover:bg-yellow-700",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "text-green-600",
        button: "bg-green-600 hover:bg-green-700",
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        icon: "text-purple-600",
        button: "bg-purple-600 hover:bg-purple-700",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing</h1>
        <p className="text-gray-600">
          Gestiona tu participación en el contenido de marketing de LexHoy
        </p>
      </div>

      {/* Tarjetas Normales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {marketingOptions.filter(opt => !opt.superAdminOnly).map((option) => {
          const colors = getColorClasses(option.color);
          const Icon = option.icon;

          return (
            <div
              key={option.href}
              className={`${colors.bg} rounded-xl shadow-sm border-2 ${colors.border} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start mb-4">
                <div
                  className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                >
                  <Icon className={`h-8 w-8 ${colors.icon}`} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {option.title}
              </h2>
              <p className="text-sm font-medium text-gray-600 mb-3">
                {option.subtitle}
              </p>
              <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                {option.description}
              </p>

              <button
                onClick={() => router.push(option.href)}
                className={`w-full ${colors.button} text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
              >
                Ver entradas
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Sección de Administración (Solo Super Admin) */}
      {userRole === "super_admin" && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Administración
            </h2>
            <p className="text-gray-600">
              Solo visible para Administradores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketingOptions.filter(opt => opt.superAdminOnly).map((option) => {
              const colors = getColorClasses(option.color);
              const Icon = option.icon;

              return (
                <div
                  key={option.href}
                  className={`${colors.bg} rounded-xl shadow-sm border-2 ${colors.border} p-6 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start mb-4">
                    <div
                      className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                    >
                      <Icon className={`h-8 w-8 ${colors.icon}`} />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {option.title}
                  </h2>
                  <p className="text-sm font-medium text-gray-600 mb-3">
                    {option.subtitle}
                  </p>
                  <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                    {option.description}
                  </p>

                  <button
                    onClick={() => router.push(option.href)}
                    className={`w-full ${colors.button} text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                  >
                    Administrar
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
