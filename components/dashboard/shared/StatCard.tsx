"use client";

import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: "blue" | "green" | "purple" | "orange" | "yellow";
  loading?: boolean;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  loading = false,
}: StatCardProps) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 font-playfair">
            {loading ? "..." : value}
          </p>
          {trend && (
            <p className="text-sm text-green-600 mt-2 flex items-center">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div
          className={`${colorClasses[color]} p-3 rounded-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};
