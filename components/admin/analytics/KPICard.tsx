"use client";

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "purple" | "orange" | "red" | "pink";
  trend?: number; // Porcentaje de cambio
  format?: "number" | "currency" | "percentage";
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-500",
    text: "text-blue-600",
    trend: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-500",
    text: "text-green-600",
    trend: "text-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-500",
    text: "text-purple-600",
    trend: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-500",
    text: "text-orange-600",
    trend: "text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-500",
    text: "text-red-600",
    trend: "text-red-600",
  },
  pink: {
    bg: "bg-pink-50",
    icon: "bg-pink-500",
    text: "text-pink-600",
    trend: "text-pink-600",
  },
};

export default function KPICard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  format = "number",
}: KPICardProps) {
  const colors = colorClasses[color];

  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;
    
    switch (format) {
      case "currency":
        return `${val.toLocaleString("es-ES")}€`;
      case "percentage":
        return `${val}%`;
      default:
        return val.toLocaleString("es-ES");
    }
  };

  const trendIsPositive = trend !== undefined && trend > 0;
  const trendIsNegative = trend !== undefined && trend < 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`${colors.icon} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className={`text-3xl font-bold ${colors.text}`}>
            {formatValue(value)}
          </p>
          
          {trend !== undefined && (
            <div className="flex items-center mt-2 text-sm">
              {trendIsPositive && (
                <>
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+{trend}%</span>
                </>
              )}
              {trendIsNegative && (
                <>
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">{trend}%</span>
                </>
              )}
              {!trendIsPositive && !trendIsNegative && (
                <span className="text-gray-500 font-medium">0%</span>
              )}
              <span className="text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
