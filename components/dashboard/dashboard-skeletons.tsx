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
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <Skeleton className="h-5 w-48" />
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para el header del dashboard
export const DashboardHeaderSkeleton = () => (
  <div className="mb-8">
    <Skeleton className="h-10 w-64 mb-2" />
    <Skeleton className="h-5 w-96" />
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
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {[1, 2, 3].map((i) => (
      <ActionCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton para la sección de despachos recientes
export const RecentDespachosSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
    <div className="p-6 border-b border-gray-200">
      <Skeleton className="h-6 w-48" />
    </div>
    <div className="p-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton completo del dashboard
export const DashboardSkeleton = () => (
  <div className="p-6 w-full">
    <DashboardHeaderSkeleton />
    <StatsSectionSkeleton />
    <QuickActionsSkeleton />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <LeadsTableSkeleton />
      <RecentDespachosSkeleton />
    </div>
  </div>
);
