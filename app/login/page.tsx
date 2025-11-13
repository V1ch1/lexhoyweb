/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, Suspense } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { AuthSimpleService } from "@/lib/auth/services/auth-simple.service";
import { useAuth } from "@/lib/authContext";
import { toast } from 'sonner';

// Tipado de la variable "form" y "error"
interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginPageContent() {
  const router = useRouter(); // Used for navigation after login
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const isConfirmed = searchParams.get("confirmed") === "true";
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Tipado del evento de cambio
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: type === "checkbox" ? checked : value }));
  };

  // Tipado del evento de submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { user, error } = await AuthSimpleService.login(
        form.email.trim(),
        form.password
      );

      if (error) {
        console.error("❌ Error en login:", error);
        setError(error);
        toast.error(error);
        setIsLoading(false);
        return;
      }

      if (user) {
        // Actualizar el estado de autenticación
        const loginSuccess = login({
          id: user.id,
          email: user.email || '',
          name: user.name || user.email?.split('@')[0] || 'Usuario',
          role: (user.role as "super_admin" | "despacho_admin" | "usuario") || 'usuario'
        });

        if (!loginSuccess) {
          console.error("❌ Error: login() retornó false");
          setError("Error al procesar la autenticación");
          toast.error("Error al procesar la autenticación");
          setIsLoading(false);
          return;
        }

        toast.success('¡Bienvenido!');
        
        // Redirigir al dashboard o a la página de origen
        const redirectTo = searchParams.get("redirectTo") || "/dashboard";
        // Usar window.location.href para asegurar la recarga completa de la página
        // Sin setTimeout para redirección inmediata
        window.location.href = redirectTo;
      } else {
        console.error("❌ No se recibió usuario del servicio de login");
        setError("No se pudo completar el inicio de sesión");
        toast.error("No se pudo completar el inicio de sesión");
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error al iniciar sesión";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error en inicio de sesión:', err);
      setIsLoading(false);
    }
  };

  return (
    <section className="h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-text text-center">
          Iniciar Sesión
        </h2>

        {isConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
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
              <h3 className="text-green-800 font-medium">
                ¡Cuenta confirmada!
              </h3>
            </div>
            <p className="text-green-700 text-sm mt-2">
              Tu email ha sido verificado exitosamente. Ahora puedes iniciar sesión.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Correo electrónico"
            required
            autoComplete="username"
            className="border p-3 rounded-md w-full"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Contraseña"
              required
              autoComplete="current-password"
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
            disabled={isLoading}
            className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>

          {/* Usamos el valor del error solo si tiene contenido */}
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

const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
