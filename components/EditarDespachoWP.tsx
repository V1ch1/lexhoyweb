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

const EditarDespachoWP: React.FC<Props> = ({ despachoId, wpUser, wpAppPassword, onSaved }) => {
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
      setDespacho({ ...despacho, meta: { ...despacho.meta, [metaField]: value } });
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
      {success && <div className="text-green-600 mb-2">¡Guardado correctamente!</div>}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={despacho.title.rendered}
            onChange={e => handleChange("title", { rendered: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={despacho.slug}
            onChange={e => handleChange("slug", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Descripción</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            value={despacho.excerpt.rendered}
            onChange={e => handleChange("excerpt", { rendered: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Localidad</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={despacho.meta.localidad || ""}
            onChange={e => handleChange("meta.localidad", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Provincia</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={despacho.meta.provincia || ""}
            onChange={e => handleChange("meta.provincia", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Teléfono</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={despacho.meta.telefono || ""}
            onChange={e => handleChange("meta.telefono", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={despacho.meta.email_contacto || ""}
            onChange={e => handleChange("meta.email_contacto", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Web</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={despacho.meta.web || ""}
            onChange={e => handleChange("meta.web", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Áreas de práctica (separadas por coma)</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={Array.isArray(despacho.meta.areas_practica) ? despacho.meta.areas_practica.join(", ") : ""}
            onChange={e => handleChange("meta.areas_practica", e.target.value.split(",").map((s: string) => s.trim()))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Verificado</label>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={!!despacho.meta.verificado}
            onChange={e => handleChange("meta.verificado", e.target.checked)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Activo</label>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={!!despacho.meta.activo}
            onChange={e => handleChange("meta.activo", e.target.checked)}
          />
        </div>
        {/* Sedes gestionadas */}
        <div className="md:col-span-2 border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2 flex items-center justify-between">Sedes gestionadas
            <button
              className="ml-2 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
              type="button"
              onClick={() => {
                const nuevasSedes = [...(despacho.meta._despacho_sedes || [])];
                nuevasSedes.push({ nombre: "", localidad: "", provincia: "", activa: true, es_principal: false });
                handleChange("meta._despacho_sedes", nuevasSedes);
              }}
            >
              + Añadir Sede
            </button>
          </h3>
          {Array.isArray(despacho.meta._despacho_sedes) && despacho.meta._despacho_sedes.length > 0 ? (
            despacho.meta._despacho_sedes.map((sede, idx) => (
              <div key={idx} className="border rounded p-4 mb-4 bg-gray-50 relative">
                <div className="absolute top-2 right-2">
                  {despacho.meta._despacho_sedes!.length > 1 && (
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      type="button"
                      onClick={() => {
                        const nuevasSedes = despacho.meta._despacho_sedes!.filter((_, i) => i !== idx);
                        handleChange("meta._despacho_sedes", nuevasSedes);
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Nombre de la Sede</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.nombre || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], nombre: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Descripción</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.descripcion || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], descripcion: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Sitio Web</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.web || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], web: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Persona de Contacto</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.persona_contacto || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], persona_contacto: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Año Fundación</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.ano_fundacion || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], ano_fundacion: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Tamaño Despacho</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.tamano_despacho || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], tamano_despacho: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Teléfono</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.telefono || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], telefono: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Email de Contacto</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.email || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], email: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Nº Colegiado</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.numero_colegiado || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], numero_colegiado: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Colegio</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.colegio || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], colegio: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Experiencia</label>
                    <textarea className="border rounded px-3 py-2 w-full" value={sede.experiencia || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], experiencia: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Calle</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.calle || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], calle: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Número</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.numero || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], numero: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Piso</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.piso || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], piso: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Código Postal</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.codigo_postal || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], codigo_postal: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Localidad</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.localidad || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], localidad: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Provincia</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.provincia || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], provincia: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">País</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.pais || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], pais: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Especialidades</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.especialidades || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], especialidades: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Servicios Específicos</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.servicios_especificos || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], servicios_especificos: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Áreas de Práctica (separadas por coma)</label>
                    <input className="border rounded px-3 py-2 w-full" value={Array.isArray(sede.areas_practica) ? sede.areas_practica.join(", ") : ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], areas_practica: e.target.value.split(",").map((s: string) => s.trim()) };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Observaciones</label>
                    <textarea className="border rounded px-3 py-2 w-full" value={sede.observaciones || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], observaciones: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Foto de Perfil (URL)</label>
                    <input className="border rounded px-3 py-2 w-full" value={sede.foto_perfil || ""} onChange={e => {
                      const sedes = [...despacho.meta._despacho_sedes!];
                      sedes[idx] = { ...sedes[idx], foto_perfil: e.target.value };
                      handleChange("meta._despacho_sedes", sedes);
                    }} />
                  </div>
                  {/* Puedes seguir añadiendo campos complejos como horarios, redes sociales, etc. */}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No hay sedes registradas.</div>
          )}
        </div>
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
