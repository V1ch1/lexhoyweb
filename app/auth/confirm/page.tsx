"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmUser = async () => {
      try {
        // Obtener todos los parámetros posibles
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const error = searchParams.get("error");
        const error_description = searchParams.get("error_description");
        const confirmationUrl = window.location.href;

        // Si hay un error en los parámetros, mostrarlo
        if (error) {
          console.error("❌ Error en URL:", error, error_description);
          setStatus("error");
          setMessage(`Error: ${error_description || error}`);
          return;
        }

        // Intentar diferentes métodos de confirmación
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "recovery" | "email_change",
          });

          if (error) {
            console.error("Error con verifyOtp:", error);
            setStatus("error");
            setMessage("Error al confirmar la cuenta: " + error.message);
          } else {
            await handleSuccessfulConfirmation();
          }
        }
        // Intentar con el hash de la URL (formato legacy)
        else if (window.location.hash) {
          try {
            // Parsear el hash como parámetros
            const hashParams = new URLSearchParams(
              window.location.hash.substring(1)
            );
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              });

              if (error) {
                console.error("Error setting session:", error);
                setStatus("error");
                setMessage("Error al confirmar la cuenta: " + error.message);
              } else {
                await handleSuccessfulConfirmation();
              }
            } else {
              throw new Error("No access token in hash");
            }
          } catch (hashError) {
            console.error("Error parsing hash:", hashError);
            setStatus("error");
            setMessage("Enlace de confirmación inválido");
          }
        } else {
          setStatus("error");
          setMessage(
            "Enlace de confirmación inválido. Faltan parámetros requeridos."
          );
        }
      } catch (error) {
        console.error("Confirmation error:", error);
        setStatus("error");
        setMessage("Error al procesar la confirmación");
      }
    };

    const handleSuccessfulConfirmation = async () => {
      setStatus("success");
      setMessage("¡Cuenta confirmada exitosamente!");

      // Después de confirmar, crear el registro en nuestra base de datos
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Verificar si el usuario ya existe en nuestra tabla
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single();

          if (!existingUser) {
            // Crear el registro en nuestra tabla users
            const userData = user.user_metadata;
            await supabase.from("users").insert({
              id: user.id,
              email: user.email,
              nombre: userData.nombre || user.email?.split("@")[0] || "Usuario",
              apellidos: userData.apellidos || "",
              telefono: userData.telefono || null,
              rol: "usuario",
              estado: "activo",
              activo: true,
              email_verificado: true,
              fecha_registro: new Date().toISOString(),
              plan: "basico",
            });

            } else {
            // Si el usuario ya existe, actualizar su estado a activo
            await supabase
              .from("users")
              .update({
                estado: "activo",
                activo: true,
                email_verificado: true,
              })
              .eq("id", user.id);

            }
        }
      } catch (dbError) {
        console.error("Error creating user in database:", dbError);
        // No mostramos error al usuario, la confirmación fue exitosa
      }

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push("/login?confirmed=true");
      }, 3000);
    };

    confirmUser();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Confirmando cuenta...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras confirmamos tu cuenta.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="rounded-full bg-green-100 p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Cuenta Confirmada!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Serás redirigido al login en unos segundos...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="rounded-full bg-red-100 p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error de Confirmación
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>💡 Soluciones:</strong>
                <br />
                • Verifica que el enlace esté completo
                <br />
                • Intenta copiar y pegar la URL completa
                <br />
                • El enlace puede haber expirado (24h)
                <br />• Revisa si ya confirmaste tu cuenta
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/register"
                className="block w-full bg-primary text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
              >
                Volver a Registrarse
              </Link>
              <Link
                href="/login"
                className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Intentar Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando confirmación...</p>
          </div>
        </div>
      }
    >
      <ConfirmPageContent />
    </Suspense>
  );
}
