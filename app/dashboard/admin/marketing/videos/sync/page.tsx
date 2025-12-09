"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface SyncResult {
  success: boolean;
  message?: string;
  results?: {
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
  error?: string;
}

export default function InstagramSyncPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  if (user?.role !== "super_admin") {
    router.push("/dashboard");
    return null;
  }

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/instagram/sync", {
        method: "POST",
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Error al conectar con el servidor",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          📱 Sincronizar con Instagram
        </h1>
        <p className="text-lg text-gray-600">
          Importa automáticamente los vídeos de @lexhoynoticias
        </p>
      </div>

      {/* Sync Button */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Sincronización Manual
            </h2>
            <p className="text-sm text-gray-600">
              Importa los últimos 50 vídeos de Instagram
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              syncing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            }`}
          >
            <ArrowPathIcon className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Ahora"}
          </button>
        </div>

        {/* Configuration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Cuenta:</strong> @lexhoynoticias
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Nota:</strong> Asegúrate de haber configurado las variables de entorno
            INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID
          </p>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div
          className={`rounded-xl shadow-sm p-6 border ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={`text-lg font-semibold mb-2 ${
                  result.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.success ? "Sincronización Exitosa" : "Error en Sincronización"}
              </h3>

              {result.message && (
                <p
                  className={`mb-4 ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.message}
                </p>
              )}

              {result.results && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">
                      {result.results.total}
                    </p>
                    <p className="text-sm text-gray-600">Total procesados</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-2xl font-bold text-green-600">
                      {result.results.imported}
                    </p>
                    <p className="text-sm text-gray-600">Nuevos importados</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">
                      {result.results.updated}
                    </p>
                    <p className="text-sm text-gray-600">Actualizados</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-2xl font-bold text-gray-600">
                      {result.results.skipped}
                    </p>
                    <p className="text-sm text-gray-600">Omitidos</p>
                  </div>
                </div>
              )}

              {result.results?.errors && result.results.errors.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">Errores:</p>
                  <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                    {result.results.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.error && (
                <p className="text-red-800 bg-white rounded-lg p-3 border border-red-200">
                  {result.error}
                </p>
              )}

              {result.success && (
                <button
                  onClick={() => router.push("/dashboard/marketing/videos-instagram")}
                  className="mt-4 text-green-700 hover:text-green-800 font-medium"
                >
                  Ver galería de vídeos →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Configuración Requerida
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Crea una App en Facebook Developers</li>
          <li>Añade el producto "Instagram Graph API"</li>
          <li>Obtén un Access Token de larga duración</li>
          <li>Obtén tu Instagram User ID</li>
          <li>
            Añade las variables de entorno:
            <ul className="list-disc list-inside ml-6 mt-2 text-sm">
              <li>INSTAGRAM_ACCESS_TOKEN</li>
              <li>INSTAGRAM_USER_ID</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
}
