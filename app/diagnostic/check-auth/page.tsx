"use client";

import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/lib/authContext";
import { useEffect, useState } from "react";

export default function CheckAuthPage() {
  const { user: clerkUser } = useUser();
  const { user: contextUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">Diagnóstico de Autenticación</h1>

        {/* Clerk User */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            1. Datos de Clerk (window.Clerk.user)
          </h2>
          {clerkUser ? (
            <div className="space-y-2 font-mono text-sm">
              <div>
                <strong>Clerk ID:</strong>{" "}
                <span className="bg-yellow-100 px-2 py-1 rounded">
                  {clerkUser.id}
                </span>
              </div>
              <div>
                <strong>Email:</strong> {clerkUser.emailAddresses[0]?.emailAddress}
              </div>
              <div>
                <strong>Nombre:</strong> {clerkUser.firstName} {clerkUser.lastName}
              </div>
            </div>
          ) : (
            <p className="text-red-500">No hay usuario en Clerk</p>
          )}
        </div>

        {/* Context User (from Supabase) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            2. Datos del Contexto (useAuth → Supabase)
          </h2>
          {contextUser ? (
            <div className="space-y-2 font-mono text-sm">
              <div>
                <strong>ID en Supabase:</strong>{" "}
                <span className="bg-yellow-100 px-2 py-1 rounded">
                  {contextUser.id}
                </span>
              </div>
              <div>
                <strong>Email:</strong> {contextUser.email}
              </div>
              <div>
                <strong>Nombre:</strong> {contextUser.name || contextUser.nombre}
              </div>
              <div>
                <strong>rol (Supabase):</strong>{" "}
                <span className="bg-blue-100 px-2 py-1 rounded">
                  {contextUser.rol || "undefined"}
                </span>
              </div>
              <div>
                <strong>role (normalizado):</strong>{" "}
                <span className="bg-green-100 px-2 py-1 rounded font-bold">
                  {contextUser.role || "undefined"}
                </span>
              </div>
              <div>
                <strong>plan:</strong> {contextUser.plan}
              </div>
              <div>
                <strong>activo:</strong> {contextUser.activo ? "Sí" : "No"}
              </div>
            </div>
          ) : (
            <p className="text-red-500">No hay usuario en el contexto (Supabase)</p>
          )}
        </div>

        {/* Comparación */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">
            3. Diagnóstico
          </h2>
          <div className="space-y-3">
            {clerkUser && contextUser ? (
              <>
                {clerkUser.id === contextUser.id ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded">
                    <p className="text-green-700 font-semibold">
                      ✅ Los IDs coinciden correctamente
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-4 rounded">
                    <p className="text-red-700 font-semibold">
                      ❌ ERROR: Los IDs NO coinciden
                    </p>
                    <p className="text-sm mt-2">
                      Clerk ID: <code>{clerkUser.id}</code>
                    </p>
                    <p className="text-sm">
                      Supabase ID: <code>{contextUser.id}</code>
                    </p>
                    <p className="text-sm mt-2 text-red-600 font-bold">
                      SOLUCIÓN: Elimina el usuario en Supabase y regístrate de nuevo
                    </p>
                  </div>
                )}

                {contextUser.role === "super_admin" ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded">
                    <p className="text-green-700 font-semibold">
                      ✅ Role normalizado correctamente a super_admin
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                    <p className="text-yellow-700 font-semibold">
                      ⚠️ Role actual: {contextUser.role || "undefined"}
                    </p>
                    <p className="text-sm mt-2">
                      rol (Supabase): {contextUser.rol || "undefined"}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-red-700 font-semibold">
                  ❌ Falta información de Clerk o Supabase
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SQL para copiar */}
        {clerkUser && contextUser && clerkUser.id !== contextUser.id && (
          <div className="bg-gray-800 text-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              4. SQL para corregir (Ejecutar en Supabase)
            </h2>
            <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-sm">
              {`-- 1. Eliminar usuario antiguo
DELETE FROM users WHERE email = '${clerkUser.emailAddresses[0]?.emailAddress}';

-- 2. Insertar usuario con Clerk ID correcto
INSERT INTO users (id, email, nombre, apellidos, rol, plan, activo, fecha_registro, clerk_id)
VALUES (
  '${clerkUser.id}',
  '${clerkUser.emailAddresses[0]?.emailAddress}',
  '${clerkUser.firstName || ""}',
  '${clerkUser.lastName || ""}',
  'super_admin',
  'premium',
  true,
  NOW(),
  '${clerkUser.id}'
);`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
