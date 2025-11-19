/**
 * Módulo de Transformación de Datos para Sincronización
 *
 * Este módulo convierte datos de Supabase al formato esperado por WordPress/Algolia
 */

// Tipos simplificados para evitar problemas de importación
type DespachoSupabase = {
  id?: string;
  nombre?: string;
  slug?: string;
  descripcion?: string;
  estado_publicacion?: string;
  estado_verificacion?: string;
  sedes?: SedeSupabase[];
};

type SedeSupabase = {
  id?: string;
  nombre?: string;
  descripcion?: string;
  web?: string;
  ano_fundacion?: number | null;
  tamano_despacho?: string;
  persona_contacto?: string;
  email_contacto?: string;
  telefono?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  especialidades?: string;
  areas_practica?: string[] | null;
  servicios_especificos?: string;
  estado_verificacion?: string;
  estado_registro?: string;
  foto_perfil?: string;
  is_verified?: boolean;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  horarios?: Record<string, string> | null;
  redes_sociales?: Record<string, string> | null;
  es_principal?: boolean;
  activa?: boolean;
};

interface SedeAlgolia {
  id_sede: string;
  es_principal: boolean;
  activa: boolean;
  nombre: string;
  descripcion: string;
  web: string;
  ano_fundacion: string | number;
  año_fundacion: string | number; // Compatibilidad
  tamano_despacho: string;
  tamaño_despacho: string; // Compatibilidad
  persona_contacto: string;
  email_contacto: string;
  email: string; // Compatibilidad
  telefono: string;
  numero_colegiado: string;
  colegio: string;
  experiencia: string;
  direccion_completa: string;
  direccion: string; // Compatibilidad
  calle: string;
  numero: string;
  piso: string;
  localidad: string;
  provincia: string;
  codigo_postal: string;
  pais: string;
  especialidades: string;
  areas_practica: string; // Como string separado por comas
  servicios_especificos: string;
  estado_verificacion: string;
  estado_registro: string;
  foto_perfil: string;
  logo: string; // Compatibilidad
  is_verified: boolean;
  observaciones: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  horarios: string | Record<string, string>;
  redes_sociales: string | Record<string, string>;
}

interface DespachoAlgolia {
  nombre: string;
  descripcion: string;
  sedes: SedeAlgolia[];
  num_sedes: number;
  sede_principal_id: string;
  areas_practica: string;
  ultima_actualizacion: string;
  slug: string;
  objectID: string;
}

export class DataTransformer {
  /**
   * Convierte una sede de Supabase al formato de Algolia/WordPress
   */
  static transformSede(
    sede: SedeSupabase,
    objectId: string,
    index: number
  ): SedeAlgolia {
    // Construir dirección completa
    const direccionPartes = [
      sede.calle && sede.numero ? `${sede.calle} ${sede.numero}` : sede.calle,
      sede.piso,
      sede.localidad,
      sede.provincia,
      sede.codigo_postal ? `(${sede.codigo_postal})` : "",
      sede.pais || "España",
    ].filter(Boolean);

    const direccionCompleta = direccionPartes.join(", ");

    // Convertir areas_practica array a string
    const areasPracticaStr =
      Array.isArray(sede.areas_practica) && sede.areas_practica.length > 0
        ? sede.areas_practica.join(", ")
        : "";

    // Convertir horarios y redes sociales
    const horariosValue =
      sede.horarios && Object.keys(sede.horarios).length > 0
        ? sede.horarios
        : "";

    const redesSocialesValue =
      sede.redes_sociales && Object.keys(sede.redes_sociales).length > 0
        ? sede.redes_sociales
        : "";

    // Generar ID de sede
    const idSede = `sede_${objectId}_${index + 1}`;

    // Formatear fechas
    const formatearFecha = (fecha: string | null | undefined) => {
      if (!fecha)
        return new Date()
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "-")
          .split("-")
          .reverse()
          .join("-"); // DD-MM-YYYY
      const d = new Date(fecha);
      return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
    };

    return {
      id_sede: idSede,
      es_principal: sede.es_principal || false,
      activa: sede.activa !== false,
      nombre: sede.nombre || "",
      descripcion: sede.descripcion || "",
      web: sede.web || "",
      ano_fundacion: sede.ano_fundacion || "",
      año_fundacion: sede.ano_fundacion || "", // Duplicado para compatibilidad
      tamano_despacho: sede.tamano_despacho || "",
      tamaño_despacho: sede.tamano_despacho || "", // Duplicado para compatibilidad
      persona_contacto: sede.persona_contacto || "",
      email_contacto: sede.email_contacto || "",
      email: sede.email_contacto || "", // Duplicado para compatibilidad
      telefono: sede.telefono || "",
      numero_colegiado: sede.numero_colegiado || "",
      colegio: sede.colegio || "",
      experiencia: sede.experiencia || "",
      direccion_completa: direccionCompleta,
      direccion: direccionCompleta, // Duplicado para compatibilidad
      calle: sede.calle || "",
      numero: sede.numero || "",
      piso: sede.piso || "",
      localidad: sede.localidad || "",
      provincia: sede.provincia || "",
      codigo_postal: sede.codigo_postal || "",
      pais: sede.pais || "España",
      especialidades: sede.especialidades || "",
      areas_practica: areasPracticaStr,
      servicios_especificos: sede.servicios_especificos || "",
      estado_verificacion: sede.estado_verificacion || "pendiente",
      estado_registro: sede.estado_registro || "activo",
      foto_perfil: sede.foto_perfil?.startsWith("http") ? sede.foto_perfil : "",
      logo: sede.foto_perfil?.startsWith("http") ? sede.foto_perfil : "", // Duplicado
      is_verified: sede.is_verified || false,
      observaciones: sede.observaciones || "",
      fecha_creacion: formatearFecha(sede.created_at),
      fecha_actualizacion: formatearFecha(sede.updated_at),
      horarios: horariosValue,
      redes_sociales: redesSocialesValue,
    };
  }

  /**
   * Convierte un despacho de Supabase con sus sedes al formato de Algolia
   */
  static transformDespacho(
    despacho: DespachoSupabase,
    objectId: string
  ): DespachoAlgolia {
    // Transformar todas las sedes
    const sedesTransformadas = (despacho.sedes || []).map(
      (sede: SedeSupabase, index: number) =>
        this.transformSede(sede, objectId, index)
    );

    // Encontrar sede principal
    const sedePrincipal = sedesTransformadas.find(
      (s: SedeAlgolia) => s.es_principal
    );
    const sedePrincipalId =
      sedePrincipal?.id_sede || sedesTransformadas[0]?.id_sede || "";

    // Consolidar áreas de práctica de todas las sedes
    const todasLasAreas = new Set<string>();
    sedesTransformadas.forEach((sede: SedeAlgolia) => {
      if (sede.areas_practica) {
        sede.areas_practica.split(",").forEach((area: string) => {
          const areaTrim = area.trim();
          if (areaTrim) todasLasAreas.add(areaTrim);
        });
      }
    });

    const areasPracticaDespacho = Array.from(todasLasAreas).join(", ");

    // Fecha de última actualización
    const hoy = new Date();
    const ultimaActualizacion = `${hoy.getDate().toString().padStart(2, "0")}-${(hoy.getMonth() + 1).toString().padStart(2, "0")}-${hoy.getFullYear()}`;

    return {
      nombre: despacho.nombre || "",
      descripcion: "", // Se llenará desde la sede principal o descripción del despacho
      sedes: sedesTransformadas,
      num_sedes: sedesTransformadas.length,
      sede_principal_id: sedePrincipalId,
      areas_practica: areasPracticaDespacho,
      ultima_actualizacion: ultimaActualizacion,
      slug: despacho.slug || "",
      objectID: objectId,
    };
  }

  /**
   * Prepara el payload para WordPress REST API
   * WordPress necesita un formato específico para los meta fields
   */
  static prepareWordPressPayload(despacho: DespachoSupabase, objectId: string) {
    const sedePrincipal =
      despacho.sedes?.find((s: SedeSupabase) => s.es_principal) ||
      despacho.sedes?.[0];

    // Transformar sedes al formato Algolia
    const sedesTransformadas = (despacho.sedes || []).map(
      (sede: SedeSupabase, index: number) =>
        this.transformSede(sede, objectId, index)
    );

    // Descripción: priorizar descripción del despacho, luego sede principal
    const descripcion =
      despacho.descripcion ||
      sedePrincipal?.descripcion ||
      `${despacho.nombre} es un despacho de abogados ubicado en ${sedePrincipal?.localidad || ""}, ${sedePrincipal?.provincia || ""}.`;

    return {
      title: despacho.nombre,
      content: `<p>${descripcion}</p>`,
      slug: despacho.slug,
      status: despacho.estado_publicacion || "publish",
      meta: {
        // Campos principales de la sede principal
        localidad: sedePrincipal?.localidad || "",
        provincia: sedePrincipal?.provincia || "",
        telefono: sedePrincipal?.telefono || "",
        email_contacto: sedePrincipal?.email_contacto || "",

        // Campos de verificación
        _despacho_estado_verificacion:
          despacho.estado_verificacion || "pendiente",
        _despacho_is_verified:
          despacho.estado_verificacion === "verificado" ? "1" : "0",

        // Sedes como meta fields individuales (WordPress no maneja bien arrays complejos)
        _despacho_num_sedes: sedesTransformadas.length,
        ...sedesTransformadas.reduce(
          (acc: Record<string, string>, sede: SedeAlgolia, index: number) => {
            acc[`_despacho_sede_${index}`] = JSON.stringify(sede);
            return acc;
          },
          {} as Record<string, string>
        ),

        // Campos legacy para compatibilidad (sede principal)
        _despacho_nombre: despacho.nombre,
        _despacho_descripcion: descripcion,
        _despacho_localidad: sedePrincipal?.localidad || "",
        _despacho_provincia: sedePrincipal?.provincia || "",
        _despacho_codigo_postal: sedePrincipal?.codigo_postal || "",
        _despacho_telefono: sedePrincipal?.telefono || "",
        _despacho_email: sedePrincipal?.email_contacto || "",
        _despacho_web: sedePrincipal?.web || "",
        _despacho_direccion: sedePrincipal
          ? [
              sedePrincipal.calle && sedePrincipal.numero
                ? `${sedePrincipal.calle} ${sedePrincipal.numero}`
                : sedePrincipal.calle,
              sedePrincipal.piso,
              sedePrincipal.localidad,
              sedePrincipal.provincia,
              sedePrincipal.codigo_postal
                ? `(${sedePrincipal.codigo_postal})`
                : "",
            ]
              .filter(Boolean)
              .join(", ")
          : "",
        _despacho_numero_colegiado: sedePrincipal?.numero_colegiado || "",
        _despacho_colegio: sedePrincipal?.colegio || "",
        _despacho_experiencia: sedePrincipal?.experiencia || "",
        _despacho_tamaño: sedePrincipal?.tamano_despacho || "",
        _despacho_año_fundacion: sedePrincipal?.ano_fundacion || "",
        _despacho_estado_registro: "activo",
        _despacho_foto_perfil: sedePrincipal?.foto_perfil?.startsWith("http")
          ? sedePrincipal?.foto_perfil
          : "",
        _despacho_horario: sedePrincipal?.horarios || {},
        _despacho_redes_sociales: sedePrincipal?.redes_sociales || {},
      },
    };
  }
}
