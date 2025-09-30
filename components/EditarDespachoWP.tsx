// Áreas de práctica predefinidas para los checkboxes (solo para uso interno, no se muestra en el render)
const AREAS_PRACTICA: string[] = [
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
import React, { useEffect, useState } from "react";

interface SedeWP {
  nombre?: string;
  descripcion?: string;
  web?: string;
  persona_contacto?: string;
  ano_fundacion?: string;
  tamano_despacho?: string;
  telefono?: string;
  email?: string;
  email_contacto?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  codigo_postal?: string;
  localidad?: string;
  provincia?: string;
  pais?: string;
  especialidades?: string;
  servicios_especificos?: string;
  areas_practica?: string[];
  horarios?: Record<string, string>;
  redes_sociales?: Record<string, string>;
  estado_verificacion?: string;
  estado_registro?: string;
  observaciones?: string;
  foto_perfil?: string;
  es_principal?: boolean;
  activa?: boolean;
}

interface DespachoWP {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  date: string;
  modified: string;
  meta: {
    object_id?: string;
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email_contacto?: string;
    areas_practica?: string[];
    _despacho_sedes?: SedeWP[];
    verificado?: boolean;
    activo?: boolean;
    web?: string;
    // ...otros campos personalizados
  };
}

interface Props {
  despachoId: number | string;
  wpUser: string;
  wpAppPassword: string;
  onSaved?: () => void;
}

const EditarDespachoWP: React.FC<Props> = ({
  despachoId,
  wpUser,
  wpAppPassword,
  onSaved,
}) => {
  // Tabs para sedes (debe ir antes de cualquier return o lógica condicional)
  const [sedeTab, setSedeTab] = useState(0);
  const [despacho, setDespacho] = useState<DespachoWP | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch despacho data from WP
  useEffect(() => {
    const fetchDespacho = async () => {
      setLoading(true);
      setError(null);
      try {
        const auth = btoa(`${wpUser}:${wpAppPassword}`);
        const res = await fetch(
          `https://lexhoy.com/wp-json/wp/v2/despacho/${despachoId}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("No se pudo cargar el despacho");
        const data = await res.json();
        setDespacho(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDespacho();
  }, [despachoId, wpUser, wpAppPassword]);

  // Handler para cambios en el formulario
  const handleChange = (field: string, value: any) => {
    if (!despacho) return;
    if (field.startsWith("meta.")) {
      const metaField = field.replace("meta.", "");
      setDespacho({
        ...despacho,
        meta: { ...despacho.meta, [metaField]: value },
      });
    } else {
      setDespacho({ ...despacho, [field]: value });
    }
  };

  // Guardar cambios en WP
  const handleSave = async () => {
    if (!despacho) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const auth = btoa(`${wpUser}:${wpAppPassword}`);
      const res = await fetch(
        `https://lexhoy.com/wp-json/wp/v2/despacho/${despachoId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: despacho.title.rendered,
            excerpt: despacho.excerpt.rendered,
            slug: despacho.slug,
            meta: despacho.meta,
            // ...otros campos estándar si es necesario
          }),
        }
      );
      if (!res.ok) throw new Error("Error al guardar en WordPress");
      setSuccess(true);
      if (onSaved) onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando despacho...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!despacho) return null;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Editar Despacho</h2>
      {success && (
        <div className="text-green-600 mb-2">¡Guardado correctamente!</div>
      )}
      {/* Los campos generales del despacho han sido ocultados, solo se muestran las sedes */}
      {/* Tabs de sedes */}
      <div className="mt-8">
        <div className="flex gap-2 border-b mb-4">
          {Array.isArray(despacho.meta._despacho_sedes) &&
            despacho.meta._despacho_sedes.length > 0 &&
            despacho.meta._despacho_sedes.map((sede, idx) => (
              <button
                key={idx}
                className={`px-4 py-2 rounded-t-md border-b-2 -mb-px focus:outline-none ${
                  sedeTab === idx
                    ? "border-blue-600 text-blue-700 bg-white"
                    : "border-transparent text-gray-500 bg-gray-50 hover:text-blue-600"
                }`}
                onClick={() => setSedeTab(idx)}
              >
                {sede.nombre ? sede.nombre : `Sede ${idx + 1}`}
              </button>
            ))}
          <button
            className="ml-2 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
            type="button"
            onClick={() => {
              const nuevasSedes = [...(despacho.meta._despacho_sedes || [])];
              nuevasSedes.push({
                nombre: "",
                localidad: "",
                provincia: "",
                activa: true,
                es_principal: false,
              });
              handleChange("meta._despacho_sedes", nuevasSedes);
              setSedeTab(nuevasSedes.length - 1);
            }}
          >
            + Añadir Sede
          </button>
        </div>
        {Array.isArray(despacho.meta._despacho_sedes) &&
        despacho.meta._despacho_sedes.length > 0 ? (
          <div className="border rounded p-4 bg-gray-50 relative">
            <div className="absolute top-2 right-2">
              {despacho.meta._despacho_sedes.length > 1 && (
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  type="button"
                  onClick={() => {
                    const nuevasSedes = despacho.meta._despacho_sedes!.filter(
                      (_, i) => i !== sedeTab
                    );
                    handleChange("meta._despacho_sedes", nuevasSedes);
                    setSedeTab(Math.max(0, sedeTab - 1));
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
            {/* Formulario de la sede seleccionada */}
            {(() => {
              const sede = despacho.meta._despacho_sedes![sedeTab];
              if (!sede) return null;
              // Áreas de práctica seleccionadas para esta sede
              const selectedAreas = Array.isArray(sede.areas_practica)
                ? sede.areas_practica
                : [];
              // Email y teléfono principal del despacho
              const emailPrincipal = despacho.meta.email_contacto || "";
              const telefonoPrincipal = despacho.meta.telefono || "";
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Nombre de la Sede
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.nombre || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          nombre: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Descripción
                    </label>
                    <textarea
                      className="border rounded px-3 py-2 w-full"
                      rows={4}
                      value={sede.descripcion || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          descripcion: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Sitio Web
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.web || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          web: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Persona de Contacto
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.persona_contacto || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          persona_contacto: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Año Fundación
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.ano_fundacion || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          ano_fundacion: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Tamaño Despacho
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.tamano_despacho || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          tamano_despacho: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Teléfono
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.telefono || telefonoPrincipal}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          telefono: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Email de Contacto
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.email_contacto || sede.email || emailPrincipal}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          email_contacto: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Nº Colegiado
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.numero_colegiado || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          numero_colegiado: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Colegio</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.colegio || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          colegio: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">
                      Experiencia
                    </label>
                    <textarea
                      className="border rounded px-3 py-2 w-full"
                      value={sede.experiencia || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          experiencia: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Calle</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.calle || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          calle: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Número</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.numero || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          numero: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Piso</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.piso || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          piso: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Código Postal
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.codigo_postal || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          codigo_postal: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Localidad
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.localidad || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          localidad: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Provincia
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.provincia || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          provincia: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">País</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.pais || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          pais: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">
                      Especialidades
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.especialidades || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          especialidades: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">
                      Servicios Específicos
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.servicios_especificos || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          servicios_especificos: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Áreas de Práctica
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {AREAS_PRACTICA.map((area: string) => (
                        <label key={area} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAreas.includes(area)}
                            onChange={() => {
                              const sedes = [...despacho.meta._despacho_sedes!];
                              const newAreas = selectedAreas.includes(area)
                                ? selectedAreas.filter(
                                    (a: string) => a !== area
                                  )
                                : [...selectedAreas, area];
                              sedes[sedeTab] = {
                                ...sedes[sedeTab],
                                areas_practica: newAreas,
                              };
                              handleChange("meta._despacho_sedes", sedes);
                            }}
                          />
                          <span className="text-sm">{area}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">
                      Observaciones
                    </label>
                    <textarea
                      className="border rounded px-3 py-2 w-full"
                      value={sede.observaciones || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          observaciones: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Foto de Perfil (URL)
                    </label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={sede.foto_perfil || ""}
                      onChange={(e) => {
                        const sedes = [...despacho.meta._despacho_sedes!];
                        sedes[sedeTab] = {
                          ...sedes[sedeTab],
                          foto_perfil: e.target.value,
                        };
                        handleChange("meta._despacho_sedes", sedes);
                      }}
                    />
                  </div>
                  {/* Puedes seguir añadiendo campos complejos como horarios, redes sociales, etc. */}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-gray-500">No hay sedes registradas.</div>
        )}
      </div>
      <button
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
};

export default EditarDespachoWP;
