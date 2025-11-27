"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token inválido o faltante");
      setIsVerifying(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      // Pequeño delay artificial para mejorar la UX (evitar parpadeo)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 3000);
      } else {
        setError(data.error || "Error al verificar el email");
      }
    } catch (err) {
      setError("Error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verificando Email...
              </h2>
              <p className="text-gray-600">
                Por favor espera mientras verificamos tu email.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Email Verificado!
              </h2>
              <p className="text-gray-600 mb-6">
                Tu email ha sido verificado exitosamente. Ya puedes iniciar sesión.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Serás redirigido al login en unos segundos...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Ir al Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error al Verificar Email
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              El enlace puede haber expirado o ya fue utilizado.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Ir al Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Crear Nueva Cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

