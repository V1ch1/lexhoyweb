"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setCurrentOrigin(window.location.origin);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${currentOrigin}/reset-password`,
      });

      if (error) {
        throw new Error(
          "No se pudo enviar el correo de recuperación. Por favor, verifica el correo electrónico e inténtalo de nuevo."
        );
      }

      setMessage(
        "¡Correo enviado! Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam."
      );
      setEmail("");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar el correo";
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-text text-center">
          Recuperar Contraseña
        </h2>

        <p className="text-gray-600 text-center mt-2">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              "Enviar enlace de recuperación"
            )}
          </button>

          {message && (
            <div
              className={`p-3 rounded-md text-center text-sm ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            >
              {message}
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          <Link href="/login" className="text-primary hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </p>

        <p className="mt-4 text-gray-600 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
