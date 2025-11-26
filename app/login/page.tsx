/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, Suspense } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { AuthSimpleService } from "@/lib/auth/services/auth-simple.service";
import { useAuth } from "@/lib/authContext";
import { toast } from 'sonner';
import { signIn } from "next-auth/react";

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
      const result = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        console.error("❌ Error en login:", result.error);
        setError("Credenciales inválidas");
        toast.error("Credenciales inválidas");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success('¡Bienvenido!');
        
        // Redirigir al dashboard o a la página de origen
        const redirectTo = searchParams.get("redirectTo") || "/dashboard";
        router.push(redirectTo);
        router.refresh(); // Asegurar que el estado de sesión se actualice
      } else {
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continúa con</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700 font-medium">Continuar con Google</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
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
