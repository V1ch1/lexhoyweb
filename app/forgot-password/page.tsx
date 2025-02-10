"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error al solicitar restablecimiento.");
        return;
      }

      setMessage(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
      );
    } catch {
      setError("Error de conexión con el servidor.");
    }
  };

  return (
    <section className="h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Recuperar Contraseña</h2>
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
            className="border p-3 rounded-md w-full"
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600"
          >
            Enviar enlace
          </button>
          {message && (
            <p className="text-green-500 text-sm text-center mt-2">{message}</p>
          )}
          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
        </form>
      </div>
    </section>
  );
}
