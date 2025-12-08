"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface LineChartCardProps {
  title: string;
  data: Array<{ date: string; count?: number; amount?: number }>;
  dataKey: string;
  color?: string;
  format?: "number" | "currency";
}

export default function LineChartCard({
  title,
  data,
  dataKey,
  color = "#3b82f6",
  format = "number",
}: LineChartCardProps) {
  const formatValue = (value: number) => {
    if (format === "currency") {
      return `${value.toLocaleString("es-ES")}€`;
    }
    return value.toLocaleString("es-ES");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => format === "currency" ? `${value}€` : value}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), title]}
            labelFormatter={formatDate}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
