"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export default function RegisterPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({
    passwordMatch: false,
    passwordStrength: false,
    acceptTerms: false,
  });

  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 🔹 Estado para mostrar/ocultar contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 🔹 Para confirmar contraseña

  const isValidPassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prevForm) => {
      const updatedForm = {
        ...prevForm,
        [name]: type === "checkbox" ? checked : value,
      };

      // Actualizar errores en tiempo real
      setErrors({
        passwordMatch: updatedForm.password !== updatedForm.confirmPassword, // ✅ Solo muestra error si NO coinciden
        passwordStrength: !isValidPassword(updatedForm.password),
        acceptTerms: !updatedForm.acceptTerms,
      });

      return updatedForm;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccess(false);

    // Validaciones previas
    if (form.password !== form.confirmPassword) {
      setErrors((prev) => ({ ...prev, passwordMatch: true }));
      return;
    }
    if (!isValidPassword(form.password)) {
      setErrors((prev) => ({ ...prev, passwordStrength: true }));
      return;
    }
    if (!form.acceptTerms) {
      setErrors((prev) => ({ ...prev, acceptTerms: true }));
      return;
    }

    console.log("Enviando datos a:", `${API_URL}/auth/register`);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Error desconocido en el registro");
        return;
      }

      setSuccess(true);
      alert("Registro exitoso, ahora puedes iniciar sesión");
      router.push("/login");
    } catch (error) {
      setApiError("Error de conexión con el servidor");
    }
  };

  return (
    <section className="h-screen flex justify-center items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-text font-bigShouldersText text-center">
          Crear Cuenta
        </h2>

        {apiError && (
          <p className="text-red-500 text-sm text-center">{apiError}</p>
        )}
        {success && (
          <p className="text-green-500 text-sm text-center">
            Registro exitoso, redirigiendo...
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="text"
            name="fullName"
            placeholder="Nombre Completo"
            value={form.fullName}
            onChange={handleChange}
            required
            className="border p-3 rounded-md w-full"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo Electrónico"
            value={form.email}
            onChange={handleChange}
            required
            className="border p-3 rounded-md w-full"
          />

          {/* 🔹 Input de contraseña con ojito */}
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.passwordStrength && (
            <p className="text-red-500 text-sm">
              La contraseña debe tener al menos 8 caracteres, una mayúscula, un
              número y un símbolo.
            </p>
          )}

          {/* 🔹 Input de confirmación de contraseña con ojito */}
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
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.passwordMatch && (
            <p className="text-red-500 text-sm">
              Las contraseñas no coinciden.
            </p>
          )}

          {/* ✅ Checkbox obligatorio */}
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
          {errors.acceptTerms && (
            <p className="text-red-500 text-sm">
              Debes aceptar la política de privacidad.
            </p>
          )}

          <button
            type="submit"
            className="bg-primary text-white px-4 py-3 rounded-lg font-workSans hover:bg-red-600"
          >
            Registrarse
          </button>
        </form>

        <p className="mt-4 text-gray-600 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  );
}
