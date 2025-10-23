import { Skeleton } from "@/components/ui/skeleton";

// Componente para el skeleton de la tarjeta de estadística
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-12 w-12 rounded-lg" />
    </div>
  </div>
);

// Componente para el skeleton de la tarjeta de acción
export const ActionCardSkeleton = () => (
  <div className="bg-gray-50 p-6 rounded-xl">
    <Skeleton className="h-8 w-8 mb-3 rounded-full" />
    <Skeleton className="h-5 w-32 mb-2" />
    <Skeleton className="h-4 w-40" />
    <div className="mt-3">
      <Skeleton className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100" />
    </div>
  </div>
);

// Componente para el skeleton de la tabla de leads
export const LeadsTableSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="overflow-hidden">
    <div className="grid grid-cols-12 gap-4 mb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 items-center">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para el header del dashboard
export const DashboardHeaderSkeleton = () => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-10 w-32" />
  </div>
);

// Skeleton para la sección de estadísticas
export const StatsSectionSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton para la sección de acciones rápidas
export const QuickActionsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <ActionCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton para la sección de despachos recientes
export const RecentDespachosSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {['Nombre', 'Localidad', 'Miembros', 'Estado', 'Acciones'].map((header) => (
              <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[1, 2, 3].map((row) => (
            <tr key={row}>
              <td className="px-4 py-4 whitespace-nowrap">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Skeleton className="h-8 w-8 rounded-md" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Skeleton completo del dashboard
export const DashboardSkeleton = () => (
  <div className="space-y-8">
    <DashboardHeaderSkeleton />
    <StatsSectionSkeleton />
    <QuickActionsSkeleton />
    <RecentDespachosSkeleton />
  </div>
);

const dashboardSkeletons = {
  StatCardSkeleton,
  ActionCardSkeleton,
  LeadsTableSkeleton,
  DashboardHeaderSkeleton,
  StatsSectionSkeleton,
  QuickActionsSkeleton,
  RecentDespachosSkeleton,
  DashboardSkeleton,
};

export default dashboardSkeletons;
