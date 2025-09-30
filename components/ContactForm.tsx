"use client";

import { useState } from "react";

interface FormData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  despacho: string;
  asunto: string;
  mensaje: string;
  aceptaPrivacidad: boolean;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    despacho: "",
    asunto: "",
    mensaje: "",
    aceptaPrivacidad: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Crear el enlace mailto con todos los datos
      const subject = `Consulta desde Lexhoy Portal - ${formData.asunto}`;
      const body = `
Nombre: ${formData.nombre} ${formData.apellidos}
Email: ${formData.email}
Teléfono: ${formData.telefono}
Despacho: ${formData.despacho}
Asunto: ${formData.asunto}

Mensaje:
${formData.mensaje}

---
Enviado desde el formulario de contacto de Lexhoy Portal
      `.trim();

      const mailtoLink = `mailto:contacto@lexhoy.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      // Abrir cliente de correo
      window.location.href = mailtoLink;

      setSubmitStatus("success");

      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        setFormData({
          nombre: "",
          apellidos: "",
          email: "",
          telefono: "",
          despacho: "",
          asunto: "",
          mensaje: "",
          aceptaPrivacidad: false,
        });
        setSubmitStatus("idle");
      }, 3000);
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 font-bigShouldersText mb-6">
        Envíanos un Mensaje
      </h2>

      {submitStatus === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-workSans">
            ✅ ¡Formulario completado! Se ha abierto tu cliente de correo con
            todos los datos. Si no se abrió automáticamente, puedes copiar la
            información y enviarla a: <strong>contacto@lexhoy.com</strong>
          </p>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-workSans">
            ❌ Hubo un problema al procesar el formulario. Por favor, contacta
            directamente a: <strong>contacto@lexhoy.com</strong>o llama al{" "}
            <strong>649 528 552</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700 font-workSans mb-2"
            >
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-workSans"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label
              htmlFor="apellidos"
              className="block text-sm font-medium text-gray-700 font-workSans mb-2"
            >
              Apellidos *
            </label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              required
              value={formData.apellidos}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-workSans"
              placeholder="Tus apellidos"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 font-workSans mb-2"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-workSans"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="despacho"
            className="block text-sm font-medium text-gray-700 font-workSans mb-2"
          >
            Nombre del Despacho
          </label>
          <input
            type="text"
            id="despacho"
            name="despacho"
            value={formData.despacho}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-workSans"
            placeholder="Nombre de tu despacho"
          />
        </div>

        <div>
          <label
            htmlFor="telefono"
            className="block text-sm font-medium text-gray-700 font-workSans mb-2"
          >
            Teléfono
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-workSans"
            placeholder="+34 600 000 000"
          />
        </div>

        <div>
          <label
            htmlFor="asunto"
            className="block text-sm font-medium text-gray-700 font-workSans mb-2"
          >
            Asunto *
          </label>
          <select
            id="asunto"
            name="asunto"
            required
            value={formData.asunto}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-workSans"
          >
            <option value="">Selecciona un asunto</option>
            <option value="informacion-general">Información General</option>
            <option value="registro-despacho">Registro de Despacho</option>
            <option value="gestion-perfil">Gestión de Perfil</option>
            <option value="gestion-leads">Gestión de Leads</option>
            <option value="soporte-tecnico">Soporte Técnico</option>
            <option value="facturacion">Facturación</option>
            <option value="partnerships">Partnerships</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="mensaje"
            className="block text-sm font-medium text-gray-700 font-workSans mb-2"
          >
            Mensaje *
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows={6}
            required
            value={formData.mensaje}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-workSans resize-vertical"
            placeholder="Cuéntanos cómo podemos ayudarte..."
          ></textarea>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="acepto-politica"
            name="aceptaPrivacidad"
            required
            checked={formData.aceptaPrivacidad}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label
            htmlFor="acepto-politica"
            className="text-sm text-gray-600 font-workSans"
          >
            Acepto la{" "}
            <a
              href="/politica-privacidad"
              className="text-primary hover:underline"
            >
              política de privacidad
            </a>{" "}
            y el{" "}
            <a
              href="/terminos-servicio"
              className="text-primary hover:underline"
            >
              tratamiento de mis datos
            </a>{" "}
            personales *
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-workSans font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? "Preparando mensaje..."
            : "Preparar Email de Contacto"}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-500 font-workSans">
            También puedes contactarnos directamente en:{" "}
            <a
              href="mailto:contacto@lexhoy.com"
              className="text-primary hover:underline"
              onClick={() => {
                // Copiar email al portapapeles como fallback
                navigator.clipboard?.writeText("contacto@lexhoy.com");
              }}
            >
              contacto@lexhoy.com
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
