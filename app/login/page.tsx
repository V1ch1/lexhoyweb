"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { AuthService } from "@/lib/authService";
import { useAuth } from "@/lib/authContext";

// Tipado de la variable "form" y "error"
interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const isConfirmed = searchParams.get('confirmed') === 'true';

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Tipo de error como string
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Tipado del evento de cambio
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // Tipado del evento de submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Limpiar error antes de hacer la petición
    setIsLoading(true);

    try {
      console.log('Intentando login con email:', form.email);
      
      // Usar AuthService para autenticación real con Supabase
      const authResult = await AuthService.signIn(form.email, form.password);
      
      if (authResult.error) {
        console.log('Error de autenticación:', authResult.error);
        
        // Mensaje más claro para email no confirmado
        if (authResult.error.includes('Email not confirmed')) {
          setError(
            'Tu cuenta aún no ha sido confirmada. Por favor, revisa tu email y haz clic en el enlace de confirmación. Si no has recibido el email, revisa la carpeta de spam.'
          );
        } else {
          setError(authResult.error);
        }
        return;
      }

      if (!authResult.user) {
        console.log('Usuario no encontrado');
        setError("Error de autenticación");
        return;
      }

      console.log('Login exitoso con Supabase Auth');
      
      // Usar el contexto de autenticación
      const userData = {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role as 'super_admin' | 'despacho_admin'
      };
      
      login(userData);

      // Redirigir según el rol
      if (authResult.user.role === 'super_admin') {
        console.log('Redirigiendo a admin/users');
        router.push('/admin/users');
      } else {
        console.log('Redirigiendo a dashboard');
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Error en login:', error);
      
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError("Error de conexión con el servidor");
      }
    } finally {
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
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-green-800 font-medium">¡Cuenta confirmada!</h3>
            </div>
            <p className="text-green-700 text-sm mt-2">
              Tu email ha sido verificado exitosamente. Ahora puedes iniciar sesión con tu cuenta.
            </p>
          </div>
        )}
        
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
            disabled={isLoading}
            className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : (
              'Iniciar Sesión'
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
