"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL; // ✅ Leer la URL del backend desde las variables de entorno
  const router = useRouter(); // ✅ Para redirigir después del login

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Limpiar errores antes de enviar

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en el login");
      }

      localStorage.setItem("token", data.token); // ✅ Guardar el token en localStorage
      alert("Inicio de sesión exitoso");
      router.push("/dashboard"); // ✅ Redirigir al usuario a su dashboard
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <section className="h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-text font-bigShouldersText text-center">
          Iniciar Sesión
        </h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Correo Electrónico"
            value={form.email}
            onChange={handleChange}
            required
            className="border p-3 rounded-md w-full"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
            className="border p-3 rounded-md w-full"
          />

          {/* ✅ Checkbox de "Mantener sesión iniciada" */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
              className="w-5 h-5 cursor-pointer"
            />
            <label className="text-gray-600 text-sm">
              Mantener sesión iniciada
            </label>
          </div>

          {/* Botón de Inicio de Sesión */}
          <button
            type="submit"
            className="bg-primary text-white px-4 py-3 rounded-lg font-workSans hover:bg-red-600"
          >
            Iniciar Sesión
          </button>
        </form>
        {/* Enlace a Registro */}
        <p className="mt-4 text-gray-600 text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </section>
  );
}
