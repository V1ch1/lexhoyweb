"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export default function LoginPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Credenciales incorrectas");
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (error) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <section className="h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-text text-center">
          Iniciar Sesión
        </h2>
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              className="border p-3 rounded-md w-full pr-10"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-3 right-3 cursor-pointer"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-600" />
              )}
            </span>
          </div>
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
          <button
            type="submit"
            className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600"
          >
            Iniciar Sesión
          </button>
          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
        </form>
        <p className="text-center text-sm text-gray-600 mt-2">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

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
