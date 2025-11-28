import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color?: "blue" | "green" | "purple" | "orange" | "yellow" | "red";
  badge?: number;
}

export const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  href,
  color = "blue",
  badge,
}: QuickActionCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <Link
      href={href}
      className={`${colorClasses[color]} block relative w-full p-6 rounded-xl transition-all duration-200 hover:shadow-md text-left group`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {badge}
        </span>
      )}
      <Icon className="h-8 w-8 mb-3" />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
      <ArrowRightIcon className="h-5 w-5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
};
