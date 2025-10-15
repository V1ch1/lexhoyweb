export const LeadsTableSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <div className="h-5 bg-gray-200 rounded w-48"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  </div>
);
