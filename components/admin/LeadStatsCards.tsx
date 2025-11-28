"use client";

import { useEffect, useState } from "react";
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface LeadStats {
  totalLeads: number;
  pendientes: number;
  procesadosSinAprobar: number;
  enSubasta: number;
  vendidosTotal: number;
  vendidosMes: number;
  descartados: number;
  ingresosTotal: number;
  ingresosMes: number;
  precioPromedio: number;
}

export default function LeadStatsCards() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/leads/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total de Leads",
      value: stats.totalLeads,
      icon: ClipboardDocumentListIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pendientes de Aprobar",
      value: stats.pendientes + stats.procesadosSinAprobar,
      icon: ClockIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "En Subasta",
      value: stats.enSubasta,
      icon: ChartBarIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Vendidos (Total)",
      value: stats.vendidosTotal,
      icon: CheckCircleIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Vendidos (Este Mes)",
      value: stats.vendidosMes,
      icon: CheckCircleIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Ingresos Totales",
      value: `€${stats.ingresosTotal.toFixed(2)}`,
      icon: CurrencyEuroIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Ingresos Este Mes",
      value: `€${stats.ingresosMes.toFixed(2)}`,
      icon: CurrencyEuroIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Descartados",
      value: stats.descartados,
      icon: XCircleIcon,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`${card.bgColor} p-3 rounded-lg`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
