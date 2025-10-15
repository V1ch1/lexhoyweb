export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);
