import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded-md", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="ml-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Skeleton className="h-4 w-16" />
      </td>
    </tr>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
