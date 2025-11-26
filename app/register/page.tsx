"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { signIn } from "next-auth/react";

// Definir la interfaz para el estado del formulario
interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  // Tipamos el estado 'form' usando la interfaz FormState
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [error, setError] = useState<{
    message: string;
    type?: "error" | "warning" | "info";
    code?: string;
  } | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [emailExists, setEmailExists] = useState<boolean>(false);

  const router = useRouter();

  // Tipamos 'e' como React.FormEvent<HTMLFormElement>
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setEmailExists(false);
    setIsLoading(true);

    try {
      // Validaciones del formulario
      if (form.password !== form.confirmPassword) {
        setError({
          message: "Las contraseñas no coinciden",
          type: "error",
        });
        return;
      }

      if (!form.acceptTerms) {
        setError({
          message: "Debes aceptar los términos y condiciones para continuar",
          type: "error",
        });
        return;
      }

      // Separar nombre y apellidos del fullName
      const nameParts = form.fullName.trim().split(" ");
      const nombre = nameParts[0] || "";
      const apellidos = nameParts.slice(1).join(" ") || "";

      // Llamar a la API de registro
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nombre,
          apellidos,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        if (result.exists) {
          setEmailExists(true);
          setError({
            message:
              "Ya existe una cuenta con este correo electrónico. ¿Quieres iniciar sesión?",
            type: "warning",
          });
        } else {
          setError({
            message: result.error || 'Error al crear la cuenta',
            type: "error",
          });
        }
        return;
      }

      // Si el registro fue exitoso, enviar email de verificación
      try {
        const [firstName] = form.fullName.split(' ');
        await fetch('/api/auth/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            userId: result.user.id,
            userName: firstName || form.email.split('@')[0],
          }),
        });
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // No fallar el registro si el email falla
      }

      // Mostrar mensaje de éxito con instrucciones de verificación
      // setSuccess(true); // Eliminado para evitar mensaje duplicado
      setError({
        message: '¡Cuenta creada exitosamente! Revisa tu email para verificar tu cuenta antes de iniciar sesión.',
        type: 'info',
      });
      
      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      });
    } catch (err) {
      console.error("Error en el registro:", err);
      setError({
        message:
          "Ocurrió un error al procesar tu registro. Por favor, inténtalo de nuevo más tarde.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tipar el evento 'e' correctamente en handleChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <section className="h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-text text-center">
          Crear Cuenta
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {isLoading && (
            <div className="bg-blue-50 text-blue-800 border border-blue-200 p-3 rounded-md">
              <p className="text-sm flex items-center">
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Procesando tu registro. Si hay alta demanda, esto puede tardar
                unos segundos...
              </p>
            </div>
          )}


          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Nombre Completo"
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
              required
              className={`border p-3 rounded-md w-full ${
                error?.type === "error" ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Correo Electrónico"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              className={`border p-3 rounded-md w-full ${
                emailExists ||
                (error?.type === "error" &&
                  error.message &&
                  error.message.toLowerCase().includes("email"))
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-gray-300"
              }`}
            />
            {emailExists && (
              <p className="mt-1 text-sm text-yellow-600">
                Este correo ya está registrado. ¿Quieres{" "}
                <Link href="/login" className="text-primary hover:underline">
                  iniciar sesión
                </Link>
                ?
              </p>
            )}
          </div>
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
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirmar Contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="border p-3 rounded-md w-full pr-10"
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-3 right-3 cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-600" />
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
              className="w-5 h-5 cursor-pointer"
              required
            />
            <label className="text-gray-600 text-sm">
              He leído y acepto la{" "}
              <Link
                href="/politica-privacidad"
                className="text-primary hover:underline"
              >
                política de privacidad
              </Link>
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-2 bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
              isLoading ? "opacity-75" : ""
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-sm">
                  Procesando tu registro
                  <span className="animate-pulse">...</span>
                </span>
              </>
            ) : (
              "Registrarse"
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O regístrate con</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
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

          <p className="mt-4 text-gray-600 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login aquí
            </Link>
          </p>
          {/* Feedback Message Block (Success, Error, Warning) */}
          {error && (
            <div
              className={`p-4 rounded-lg mt-4 border ${
                error?.type === "warning"
                  ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                  : error?.type === "info"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <div className="flex items-center mb-2">
                {error?.type === "info" ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <h3 className="font-medium">
                  {error?.type === "warning" 
                    ? "Atención" 
                    : error?.type === "info"
                    ? "¡Registro exitoso!"
                    : "Error de registro"}
                </h3>
              </div>
              
              <p className="text-sm">{error?.message}</p>

              {error?.type === "info" && (
                <p className="text-xs mt-2 opacity-80">
                  <strong>Nota:</strong> Revisa también la carpeta de spam si no ves el email.
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
