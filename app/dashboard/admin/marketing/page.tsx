"use client";

import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/authContext";

export default function AdminMarketingPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirigir si no es super_admin
  if (user && user.role !== "super_admin") {
    router.push("/dashboard");
    return null;
  }

  const marketingOptions = [
    {
      title: "Gestión de Entradas",
      subtitle: "Panel de administración completo",
      description:
        "Crea, edita, publica y gestiona todas las entradas de blog. Panel de administración completo con control total sobre el contenido.",
      icon: Cog6ToothIcon,
      href: "/dashboard/marketing/gestion-entradas",
      color: "purple",
      featured: true,
    },
    {
      title: "SEO",
      subtitle: "Optimización para motores de búsqueda",
      description:
        "Gestiona y optimiza las entradas de blog relacionadas con SEO para mejorar la visibilidad online de LexHoy.",
      icon: MagnifyingGlassIcon,
      href: "/dashboard/marketing/seo",
      color: "blue",
    },
    {
      title: "Entradas en Proyecto",
      subtitle: "Contenido en desarrollo",
      description:
        "Revisa y gestiona las entradas de blog que están actualmente en desarrollo antes de su publicación.",
      icon: DocumentTextIcon,
      href: "/dashboard/marketing/entradas-proyecto",
      color: "yellow",
    },
    {
      title: "Entradas Publicadas",
      subtitle: "Contenido ya publicado",
      description:
        "Explora y gestiona las entradas de blog ya publicadas en LexHoy. Edita o actualiza contenido existente.",
      icon: CheckCircleIcon,
      href: "/dashboard/marketing/entradas-publicadas",
      color: "green",
    },
    {
      title: "Crear Nueva Entrada",
      subtitle: "Añadir contenido nuevo",
      description:
        "Crea una nueva entrada de blog desde cero con el editor completo de contenido.",
      icon: PlusCircleIcon,
      href: "/dashboard/marketing/gestion-entradas/crear",
      color: "indigo",
    },
    {
      title: "🎬 Vídeos Instagram",
      subtitle: "Galería de contenido visual",
      description:
        "Explora nuestra galería de vídeos legales publicados en Instagram. Contenido educativo y profesional.",
      icon: ChartBarIcon,
      href: "/dashboard/marketing/videos-instagram",
      color: "purple",
    },
    {
      title: "🔄 Sincronizar Instagram",
      subtitle: "Importar vídeos automáticamente",
      description:
        "Sincroniza automáticamente los vídeos de @lexhoynoticias desde Instagram a la galería.",
      icon: PlusCircleIcon,
      href: "/dashboard/admin/marketing/videos/sync",
      color: "indigo",
    },
  ];

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
      indigo: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        icon: "text-indigo-600",
        button: "bg-indigo-600 hover:bg-indigo-700",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        icon: "text-orange-600",
        button: "bg-orange-600 hover:bg-orange-700",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Gestión de Marketing
        </h1>
        <p className="text-lg text-gray-600">
          Panel de administración completo para gestionar todo el contenido de marketing de LexHoy
        </p>
      </div>

      {/* Tarjeta destacada - Gestión de Entradas */}
      <div className="mb-8">
        {marketingOptions
          .filter((opt) => opt.featured)
          .map((option) => {
            const colors = getColorClasses(option.color);
            const Icon = option.icon;

            return (
              <div
                key={option.href}
                className={`${colors.bg} rounded-xl shadow-lg border-2 ${colors.border} p-8 hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div
                        className={`p-4 rounded-lg ${colors.bg} border-2 ${colors.border} mr-4`}
                      >
                        <Icon className={`h-10 w-10 ${colors.icon}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {option.title}
                        </h2>
                        <p className="text-sm font-medium text-gray-600">
                          {option.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-6 text-base leading-relaxed">
                      {option.description}
                    </p>

                    <button
                      onClick={() => router.push(option.href)}
                      className={`${colors.button} text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2`}
                    >
                      Acceder al panel
                      <svg
                        className="h-5 w-5"
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
                </div>
              </div>
            );
          })}
      </div>

      {/* Otras opciones */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketingOptions
          .filter((opt) => !opt.featured)
          .map((option) => {
            const colors = getColorClasses(option.color);
            const Icon = option.icon;

            return (
              <div
                key={option.href}
                className={`${colors.bg} rounded-xl shadow-sm border-2 ${colors.border} p-6 hover:shadow-md transition-shadow relative`}
              >
                {option.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                      Próximamente
                    </span>
                  </div>
                )}

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
                  onClick={() => !option.comingSoon && router.push(option.href)}
                  disabled={option.comingSoon}
                  className={`w-full ${
                    option.comingSoon
                      ? "bg-gray-400 cursor-not-allowed"
                      : colors.button
                  } text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                >
                  {option.comingSoon ? "Próximamente" : "Acceder"}
                  {!option.comingSoon && (
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
                  )}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
