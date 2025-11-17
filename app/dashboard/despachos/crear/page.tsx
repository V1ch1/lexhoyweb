"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { SedeFormData } from "@/types/despachos";
import { supabase } from "@/lib/supabase";
import { ImageOptimizer } from "@/lib/imageOptimizer";

const AREAS_PRACTICA = [
  "Administrativo",
  "Bancario",
  "Civil",
  "Comercial",
  "Concursal",
  "Consumo",
  "Empresarial",
  "Familia",
  "Fiscal",
  "Inmobiliario",
  "Laboral",
  "Medio Ambiente",
  "Mercantil",
  "Penal",
  "Propiedad Intelectual",
  "Protección de Datos",
  "Salud",
  "Seguros",
  "Sucesiones",
  "Tráfico",
  "Urbanismo",
  "Vivienda",
];

export default function CrearDespachoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
  });
  const [sedes, setSedes] = useState<SedeFormData[]>([
    {
      nombre: "Sede Principal",
      descripcion: "",
      calle: "",
      numero: "",
      piso: "",
      localidad: "",
      provincia: "",
      codigo_postal: "",
      pais: "España",
      telefono: "",
      email_contacto: "",
      persona_contacto: "",
      web: "",
      numero_colegiado: "",
      colegio: "",
      experiencia: "",
      areas_practica: [],
      especialidades: "",
      servicios_especificos: "",
      ano_fundacion: "",
      tamano_despacho: "",
      horarios: {
        lunes: "",
        martes: "",
        miercoles: "",
        jueves: "",
        viernes: "",
        sabado: "",
        domingo: "",
      },
      redes_sociales: {
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
      },
      foto_perfil: "",
      observaciones: "",
      es_principal: true,
    },
  ]);
  const [sedeActiva, setSedeActiva] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSedeChange = (
    index: number,
    field: keyof SedeFormData,
    value: string | boolean | string[]
  ) => {
    const newSedes = [...sedes];
    newSedes[index] = {
      ...newSedes[index],
      [field]: value,
    };
    setSedes(newSedes);
  };

  const handleSedeRedSocialChange = (
    index: number,
    red: "facebook" | "twitter" | "linkedin" | "instagram",
    value: string
  ) => {
    const newSedes = [...sedes];
    newSedes[index] = {
      ...newSedes[index],
      redes_sociales: {
        ...newSedes[index].redes_sociales,
        [red]: value,
      },
    };
    setSedes(newSedes);
  };

  const toggleSedeAreaPractica = (sedeIndex: number, area: string) => {
    const newSedes = [...sedes];
    const currentAreas = newSedes[sedeIndex].areas_practica;
    newSedes[sedeIndex] = {
      ...newSedes[sedeIndex],
      areas_practica: currentAreas.includes(area)
        ? currentAreas.filter((a) => a !== area)
        : [...currentAreas, area],
    };
    setSedes(newSedes);
  };

  const agregarSede = () => {
    setSedes([
      ...sedes,
      {
        nombre: `Sede ${sedes.length + 1}`,
        descripcion: "",
        calle: "",
        numero: "",
        piso: "",
        localidad: "",
        provincia: "",
        codigo_postal: "",
        pais: "España",
        telefono: "",
        email_contacto: "",
        persona_contacto: "",
        web: "",
        numero_colegiado: "",
        colegio: "",
        experiencia: "",
        areas_practica: [],
        especialidades: "",
        servicios_especificos: "",
        ano_fundacion: "",
        tamano_despacho: "",
        horarios: {
          lunes: "",
          martes: "",
          miercoles: "",
          jueves: "",
          viernes: "",
          sabado: "",
          domingo: "",
        },
        redes_sociales: {
          facebook: "",
          twitter: "",
          linkedin: "",
          instagram: "",
        },
        foto_perfil: "",
        observaciones: "",
        es_principal: false,
      },
    ]);
    setSedeActiva(sedes.length);
  };

  const eliminarSede = (index: number) => {
    if (sedes.length > 1 && !sedes[index].es_principal) {
      setSedes(sedes.filter((_, i) => i !== index));
      setSedeActiva(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar sede principal
    const sedePrincipal = sedes[0];
    if (
      !sedePrincipal.localidad ||
      !sedePrincipal.provincia ||
      !sedePrincipal.telefono ||
      !sedePrincipal.email_contacto
    ) {
      setError(
        "Por favor completa todos los campos requeridos de la sede principal"
      );
      setLoading(false);
      return;
    }

    try {
      // Obtener token de autenticación
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No hay sesión activa");
      }

      // Normalizar URLs de sedes
      const normalizedSedes = sedes.map((sede) => ({
        ...sede,
        web:
          sede.web && !sede.web.match(/^https?:\/\//i)
            ? `https://${sede.web}`
            : sede.web,
      }));

      const response = await fetch("/api/crear-despacho", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          sedes: normalizedSedes,
          user_id: user?.id,
          user_email: user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el despacho");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/despachos/mis-despachos");
      }, 2000);
    } catch (err) {
      console.error("Error al crear despacho:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear el despacho"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/despachos")}
          className="mb-3 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a Despachos
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Dar de Alta Nuevo Despacho
        </h1>
        <p className="text-lg text-gray-600">
          Crea un nuevo despacho con su sede principal
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg flex items-center bg-red-50 text-red-800">
          <svg
            className="h-5 w-5 mr-2 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg flex items-center bg-green-50 text-green-800">
          <svg
            className="h-5 w-5 mr-2 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>¡Despacho creado correctamente! Redirigiendo...</span>
        </div>
      )}

      {/* Alerta de Verificación */}
      <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-6 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              ⚠️ Importante: Verifica antes de crear
            </h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p className="font-semibold">
                Antes de dar de alta un nuevo despacho, asegúrate de que NO
                existe en nuestra base de datos de Lexhoy.com
              </p>
              <p>
                Si el despacho ya existe y lo creas de nuevo, se generará un{" "}
                <strong>duplicado</strong> que causará problemas de gestión.
              </p>
              <div className="mt-4 bg-white bg-opacity-50 rounded-md p-3 border border-yellow-300">
                <p className="font-semibold text-yellow-900 mb-2">
                  📋 Pasos recomendados:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-yellow-800">
                  <li>
                    Primero, busca el despacho en{" "}
                    <strong>&quot;Despachos Disponibles&quot;</strong>
                  </li>
                  <li>
                    Si no lo encuentras, intenta{" "}
                    <strong>&quot;Importar de Lexhoy&quot;</strong>
                  </li>
                  <li>
                    Solo si no existe en ningún sitio, procede a crearlo aquí
                  </li>
                </ol>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard/despachos/ver-despachos")
                  }
                  className="inline-flex items-center px-4 py-2 border border-yellow-600 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Buscar en Despachos
                </button>
                {/* <button
                  type="button"
                  onClick={() => router.push('/dashboard/despachos/importar-lexhoy')}
                  className="inline-flex items-center px-4 py-2 border border-yellow-600 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Importar de Lexhoy
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Despacho */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg
              className="h-6 w-6 mr-2 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                clipRule="evenodd"
              />
            </svg>
            Información del Despacho
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Despacho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Bufete García & Asociados"
              />
            </div>
          </div>
        </div>

        {/* Sedes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg
                className="h-6 w-6 mr-2 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              Sedes ({sedes.length})
            </h2>
            <button
              type="button"
              onClick={agregarSede}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg
                className="h-5 w-5 mr-1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Agregar Sede
            </button>
          </div>

          {/* Tabs de Sedes */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              {sedes.map((sede, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSedeActiva(index)}
                  className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${
                    sedeActiva === index
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {sede.nombre}
                  {sede.es_principal && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Principal
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Formulario de la Sede Activa */}
          {sedes.map((sede, index) => (
            <div
              key={index}
              className={index === sedeActiva ? "block" : "hidden"}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Sede <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sede.nombre}
                    onChange={(e) =>
                      handleSedeChange(index, "nombre", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Sede Principal, Sede Barcelona..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calle
                  </label>
                  <input
                    type="text"
                    value={sede.calle}
                    onChange={(e) =>
                      handleSedeChange(index, "calle", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Calle Gran Vía"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={sede.numero}
                      onChange={(e) =>
                        handleSedeChange(index, "numero", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Piso
                    </label>
                    <input
                      type="text"
                      value={sede.piso}
                      onChange={(e) =>
                        handleSedeChange(index, "piso", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3º A"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sede.localidad}
                    onChange={(e) =>
                      handleSedeChange(index, "localidad", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Madrid"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sede.provincia}
                    onChange={(e) =>
                      handleSedeChange(index, "provincia", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Madrid"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={sede.codigo_postal}
                    onChange={(e) =>
                      handleSedeChange(index, "codigo_postal", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="28001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={sede.telefono}
                    onChange={(e) =>
                      handleSedeChange(index, "telefono", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+34 912 345 678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={sede.email_contacto}
                    onChange={(e) =>
                      handleSedeChange(index, "email_contacto", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contacto@despacho.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={sede.persona_contacto}
                    onChange={(e) =>
                      handleSedeChange(
                        index,
                        "persona_contacto",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Juan García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="text"
                    value={sede.web}
                    onChange={(e) =>
                      handleSedeChange(index, "web", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="www.despacho.com o https://www.despacho.com"
                  />
                </div>

                {/* Información Profesional */}
                <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ⚖️ Información Profesional
                  </h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nº Colegiado
                  </label>
                  <input
                    type="text"
                    value={sede.numero_colegiado}
                    onChange={(e) =>
                      handleSedeChange(
                        index,
                        "numero_colegiado",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colegio
                  </label>
                  <input
                    type="text"
                    value={sede.colegio}
                    onChange={(e) =>
                      handleSedeChange(index, "colegio", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ilustre Colegio de Abogados de Madrid"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experiencia
                  </label>
                  <textarea
                    rows={3}
                    value={sede.experiencia}
                    onChange={(e) =>
                      handleSedeChange(index, "experiencia", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe la experiencia profesional..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidades
                  </label>
                  <textarea
                    rows={2}
                    value={sede.especialidades}
                    onChange={(e) =>
                      handleSedeChange(index, "especialidades", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Especialidades específicas de esta sede..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicios Específicos
                  </label>
                  <textarea
                    rows={2}
                    value={sede.servicios_especificos}
                    onChange={(e) =>
                      handleSedeChange(
                        index,
                        "servicios_especificos",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Servicios específicos que ofrece esta sede..."
                  />
                </div>

                {/* Áreas de Práctica por Sede */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Áreas de Práctica de esta Sede
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {AREAS_PRACTICA.map((area) => (
                      <label
                        key={area}
                        className="flex items-center space-x-2 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={sede.areas_practica.includes(area)}
                          onChange={() => toggleSedeAreaPractica(index, area)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Información Adicional
                  </h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año de Fundación
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={sede.ano_fundacion}
                    onChange={(e) =>
                      handleSedeChange(index, "ano_fundacion", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2020"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño del Despacho
                  </label>
                  <select
                    value={sede.tamano_despacho}
                    onChange={(e) =>
                      handleSedeChange(index, "tamano_despacho", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Pequeño (1-5)">Pequeño (1-5)</option>
                    <option value="Mediano (6-20)">Mediano (6-20)</option>
                    <option value="Grande (21+)">Grande (21+)</option>
                  </select>
                </div>

                {/* Redes Sociales */}
                <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🌐 Redes Sociales
                  </h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={sede.redes_sociales.facebook}
                    onChange={(e) =>
                      handleSedeRedSocialChange(
                        index,
                        "facebook",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="facebook.com/... o https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter / X
                  </label>
                  <input
                    type="text"
                    value={sede.redes_sociales.twitter}
                    onChange={(e) =>
                      handleSedeRedSocialChange(
                        index,
                        "twitter",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="twitter.com/... o https://twitter.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={sede.redes_sociales.linkedin}
                    onChange={(e) =>
                      handleSedeRedSocialChange(
                        index,
                        "linkedin",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="linkedin.com/... o https://linkedin.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={sede.redes_sociales.instagram}
                    onChange={(e) =>
                      handleSedeRedSocialChange(
                        index,
                        "instagram",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="instagram.com/... o https://instagram.com/..."
                  />
                </div>

                {/* Horarios de Atención */}
                <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🕐 Horarios de Atención
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "lunes",
                      "martes",
                      "miercoles",
                      "jueves",
                      "viernes",
                      "sabado",
                      "domingo",
                    ].map((dia) => (
                      <div key={dia}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {dia}
                        </label>
                        <input
                          type="text"
                          value={
                            sede.horarios[dia as keyof typeof sede.horarios]
                          }
                          onChange={(e) => {
                            const newSedes = [...sedes];
                            newSedes[index] = {
                              ...newSedes[index],
                              horarios: {
                                ...newSedes[index].horarios,
                                [dia]: e.target.value,
                              },
                            };
                            setSedes(newSedes);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: 9:00 - 18:00"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Foto de Perfil */}
                <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🖼️ Foto de Perfil
                  </h3>
                  <div className="space-y-4">
                    {/* Preview de la foto */}
                    {sede.foto_perfil && (
                      <div className="flex items-center space-x-4">
                        <Image
                          src={sede.foto_perfil}
                          alt="Preview"
                          width={96}
                          height={96}
                          className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/150?text=Error";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleSedeChange(index, "foto_perfil", "")
                          }
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          🗑️ Eliminar foto
                        </button>
                      </div>
                    )}

                    {/* Input para subir archivo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📁 Subir Foto
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                          <svg
                            className="h-5 w-5 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Seleccionar archivo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // Validar imagen
                                  const validation = ImageOptimizer.validateImage(file);
                                  if (!validation.valid) {
                                    alert(validation.error);
                                    return;
                                  }

                                  // Subir a Supabase y obtener URL
                                  const { url } = await ImageOptimizer.uploadToSupabase(file, {
                                    path: 'perfiles',
                                    bucket: 'despachos-fotos'
                                  });

                                  // Usar la URL pública de Supabase
                                  handleSedeChange(index, "foto_perfil", url);

                                  alert('✅ Imagen subida correctamente');

                                } catch (error) {
                                  console.error('Error al subir imagen:', error);
                                  alert(`❌ Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
                                }
                              }
                            }}
                          />
                        </label>
                        <span className="text-sm text-gray-500">
                          JPG, PNG, GIF, WebP (máx. 5MB) - Se optimizará automáticamente a WebP
                        </span>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">o</span>
                      </div>
                    </div>

                    {/* Input para URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🔗 Pegar URL de la Foto
                      </label>
                      <input
                        type="text"
                        value={
                          sede.foto_perfil.startsWith("data:")
                            ? ""
                            : sede.foto_perfil
                        }
                        onChange={(e) =>
                          handleSedeChange(index, "foto_perfil", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ejemplo.com/foto.jpg o https://ejemplo.com/foto.jpg"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        También puedes pegar la URL directamente. Si no se
                        especifica, se usará la foto predefinida del sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🔍 Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={sede.observaciones}
                    onChange={(e) =>
                      handleSedeChange(index, "observaciones", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales sobre esta sede..."
                  />
                </div>
              </div>
              {!sede.es_principal && sedes.length > 1 && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => eliminarSede(index)}
                    className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    <svg
                      className="h-5 w-5 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Eliminar Sede
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Success Message Bottom */}
        {success && (
          <div className="mb-6 p-4 rounded-lg flex items-center bg-green-50 text-green-800 border border-green-200">
            <svg
              className="h-5 w-5 mr-2 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">¡Despacho creado correctamente! Redirigiendo...</span>
          </div>
        )}

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/despachos")}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center min-w-[140px] justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Creando...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Crear Despacho
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
