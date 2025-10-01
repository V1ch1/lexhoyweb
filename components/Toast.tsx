"use client";

import { useEffect } from "react";
import type { ToastProps } from "@/lib/types";

export default function Toast({
  type,
  message,
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = {
    success: "bg-green-100 text-green-800 border-green-300",
    error: "bg-red-100 text-red-800 border-red-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow-lg border ${colors[type]} animate-fade-in`}
    >
      <span className="font-semibold mr-2 capitalize">
        {type === "success" ? "✔" : type === "error" ? "✖" : "!"}
      </span>
      {message}
      <button
        className="ml-4 text-xs text-gray-500 hover:text-gray-700"
        onClick={onClose}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </div>
  );
}

// Animación fade-in
// Añade en tu CSS global:
// @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
// .animate-fade-in { animation: fade-in 0.3s ease; }
