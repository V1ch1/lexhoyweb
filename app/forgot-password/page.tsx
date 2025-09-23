"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam."
      );
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Recuperar Contraseña
        </h2>
        <p className="text-sm text-gray-600 text-center mt-2">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu
          contraseña.
        </p>
        
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="border border-gray-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Enviando..." : "Enviar enlace"}
          </button>
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md text-sm">
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
          >
            ← Volver al login
          </Link>
        </div>
      </div>
    </section>
  );
}
