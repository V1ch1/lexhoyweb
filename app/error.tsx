"use client";
import React from "react";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Ha ocurrido un error</h1>
      <p className="text-lg text-gray-700 mb-2">{error.message || "Algo salió mal."}</p>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
        onClick={() => window.location.reload()}
      >
        Recargar página
      </button>
    </div>
  );
}
