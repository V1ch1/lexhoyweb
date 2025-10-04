"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { AuthService } from "@/lib/authService";

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

  const [error, setError] = useState<{message: string; type?: 'error' | 'warning' | 'info'} | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [emailExists, setEmailExists] = useState<boolean>(false);

  // Tipamos 'e' como React.FormEvent<HTMLFormElement>
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setEmailExists(false);
    setIsLoading(true);

    // Validaciones del formulario
    if (form.password !== form.confirmPassword) {
      setError({
        message: "Las contraseñas no coinciden",
        type: 'error'
      });
      setIsLoading(false);
      return;
    }

    if (!form.acceptTerms) {
      setError({
        message: "Debes aceptar la política de privacidad",
        type: 'error'
      });
      setIsLoading(false);
      return;
    }

    try {
      // Separar nombre y apellidos del fullName
      const nameParts = form.fullName.trim().split(" ");
      const nombre = nameParts[0] || "";
      const apellidos = nameParts.slice(1).join(" ") || "";

      // Usar AuthService para registro real con Supabase
      const authResult = await AuthService.signUp(form.email, form.password, {
        nombre,
        apellidos,
      });

      if (authResult.error) {
        const isEmailExists = authResult.error.toLowerCase().includes('ya existe');
        setError({
          message: isEmailExists 
            ? 'Ya existe una cuenta con este correo electrónico.'
            : authResult.error,
          type: isEmailExists ? 'warning' : 'error'
        });
        setEmailExists(isEmailExists);
        setIsLoading(false);
        return;
      }

      // Si llegamos aquí, el registro fue exitoso
      setSuccess(true);

      // Limpiar el formulario
      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      });
      // No redirigir automáticamente, mostrar mensaje de confirmación por email
    } catch (error) {
      console.error("Error en registro:", error);

      if (error instanceof Error) {
        if (error.message.includes("Timeout")) {
          setError({
            message: "El registro está tardando demasiado. Por favor, verifica tu conexión y vuelve a intentarlo.",
            type: 'error'
          });
        } else {
          setError({
            message: `Error de conexión: ${error.message}`,
            type: 'error'
          });
        }
      } else {
        setError({
          message: "Error desconocido al procesar la solicitud",
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Tipar el evento 'e' correctamente en handleChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  return (
    <section className="h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-text text-center">
          Crear Cuenta
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div 
              className={`p-3 rounded-md ${
                error?.type === 'warning' 
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className="font-medium">
                {error?.type === 'warning' ? 'Atención' : 'Error'}
              </p>
              <p>{error?.message || 'Ocurrió un error inesperado'}</p>
              {emailExists && (
                <div className="mt-2">
                  <Link 
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    ¿Ya tienes una cuenta? Inicia sesión aquí
                  </Link>
                  <p className="text-sm mt-1">
                    ¿Olvidaste tu contraseña?{' '}
                    <Link 
                      href="/forgot-password" 
                      className="text-primary hover:underline"
                    >
                      Restablecer contraseña
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Nombre Completo"
              value={form.fullName}
              onChange={handleChange}
              required
              className={`border p-3 rounded-md w-full ${
                error?.type === 'error' ? 'border-red-300' : 'border-gray-300'
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
              required
              className={`border p-3 rounded-md w-full ${
                emailExists || (error?.type === 'error' && error?.message?.includes('email')) 
                  ? 'border-yellow-500 bg-yellow-50' 
                  : 'border-gray-300'
              }`}
            />
            {emailExists && (
              <p className="mt-1 text-sm text-yellow-600">
                Este correo ya está registrado. ¿Quieres <Link href="/login" className="text-primary hover:underline">iniciar sesión</Link>?
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
              isLoading ? 'opacity-75' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registrando...
              </>
            ) : (
              "Registrarse"
            )}
          </button>
          <p className="mt-2 text-gray-600 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login aquí
            </Link>
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-red-800 font-medium">Error de registro</h3>
              </div>
              <p className="text-red-700 text-sm mt-2">{error}</p>
              {error.includes("ya está registrado") && (
                <div className="mt-3">
                  <Link
                    href="/login"
                    className="inline-block bg-primary text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Ir al Login
                  </Link>
                </div>
              )}
              {error.includes("debes esperar") && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 text-xs">
                    <strong>💡 Consejo:</strong> Mientras esperas, puedes
                    intentar hacer login si ya tienes una cuenta, o cambiar a un
                    email diferente.
                  </p>
                </div>
              )}
              {error.includes("límite de emails") && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-xs">
                    <strong>🔒 Protección contra spam:</strong> Supabase limita
                    los emails para prevenir spam. Puedes:
                  </p>
                  <ul className="text-blue-700 text-xs mt-1 ml-4 list-disc">
                    <li>Esperar 1 hora y volver a intentar</li>
                    <li>Intentar con un email diferente</li>
                    <li>Verificar si ya tienes una cuenta y hacer login</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          {success && (
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
                  ¡Registro exitoso!
                </h3>
              </div>
              <p className="text-green-700 text-sm mt-2">
                Te hemos enviado un email de confirmación. Por favor, revisa tu
                bandeja de entrada y haz clic en el enlace para activar tu
                cuenta.
              </p>
              <p className="text-green-600 text-xs mt-2">
                <strong>Nota:</strong> Revisa también la carpeta de spam si no
                ves el email.
              </p>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
