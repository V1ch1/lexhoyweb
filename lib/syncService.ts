// lib/syncService.ts
import { createClient } from "@supabase/supabase-js";

// Cliente con Service Role para operaciones del servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DespachoWordPress {
  id: number | string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  slug?: string;
  status?: string;
  date?: string;
  meta?: {
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email_contacto?: string;
    object_id?: string;
    _despacho_sedes?: Array<{
      nombre?: string;
      localidad?: string;
      provincia?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
      web?: string;
      es_principal?: boolean;
      descripcion?: string;
      areas_practica?: string[];
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface Sede {
  // Básicos
  nombre?: string;
  descripcion?: string;
  es_principal?: boolean;

  // Ubicación
  direccion?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;

  // Contacto
  telefono?: string;
  email?: string;
  email_contacto?: string;
  web?: string;
  persona_contacto?: string;

  // Profesional
  ano_fundacion?: string;
  tamano_despacho?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;

  // Servicios
  areas_practica?: string[];
  especialidades?: string;
  servicios_especificos?: string;

  // Multimedia
  foto_perfil?: string;
  logo?: string;

  // Horarios y redes
  horarios?: Record<string, string>;
  redes_sociales?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };

  // Otros
  observaciones?: string;
}

export class SyncService {
  /**
   * Importa un despacho desde WordPress a Next.js
   * Incluye la importación de sedes
   */
  static async importarDespachoDesdeWordPress(despachoWP: DespachoWordPress) {
    try {
      const objectId = String(despachoWP.id);
      const nombre = despachoWP.title?.rendered || "Sin título";
      const descripcion = despachoWP.content?.rendered || "";
      const slug = despachoWP.slug || nombre.toLowerCase().replace(/\s+/g, "-");

      // Verificar si ya existe el despacho
      const { data: existente } = await supabase
        .from("despachos")
        .select("id")
        .eq("object_id", objectId)
        .single();

      let despachoId: string;

      if (existente) {
        // Actualizar despacho existente
        const { data: updated, error: updateError } = await supabase
          .from("despachos")
          .update({
            nombre,
            descripcion,
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq("object_id", objectId)
          .select("id")
          .single();

        if (updateError) throw updateError;
        despachoId = updated.id;
      } else {
        // Crear nuevo despacho
        const { data: created, error: createError } = await supabase
          .from("despachos")
          .insert({
            object_id: objectId,
            nombre,
            descripcion,
            slug,
            activo: despachoWP.status === "publish",
            verificado: false,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("❌ Error al crear despacho:", createError);
          console.error(
            "Detalles completos:",
            JSON.stringify(createError, null, 2)
          );
          throw createError;
        }
        despachoId = created.id;
      }

      // Importar sedes si existen
      const sedes = despachoWP.meta?._despacho_sedes;
      // También verificar otros campos del meta que podrían tener info adicional
      if (sedes && Array.isArray(sedes) && sedes.length > 0) {
        // Eliminar sedes existentes primero
        const { error: deleteError } = await supabase
          .from("sedes")
          .delete()
          .eq("despacho_id", despachoId);

        if (deleteError) {
          console.warn("⚠️ Error al eliminar sedes antiguas:", deleteError);
        } else {
        }

        // Importar nuevas sedes
        await this.importarSedes(despachoId, sedes);

        // Actualizar num_sedes
        await supabase
          .from("despachos")
          .update({ num_sedes: sedes.length })
          .eq("id", despachoId);
      }

      return {
        success: true,
        despachoId,
        objectId,
        message: "Despacho importado correctamente",
      };
    } catch (error) {
      console.error("❌ Error al importar despacho:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        details: error instanceof Error ? error.stack : String(error),
      };
    }
  }

  /**
   * Importa sedes desde WordPress
   */
  static async importarSedes(despachoId: string, sedes: Sede[]) {
    try {
      for (let i = 0; i < sedes.length; i++) {
        const sede = sedes[i];
        const esPrincipal = i === 0 || sede.es_principal === true;

        // Parsear dirección completa desde WordPress
        // Formato: "C/ Fonseca 6 4º, A Coruña, A Coruña, (15004)"
        let calle = sede.calle || "";
        let numero = sede.numero || "";
        let piso = sede.piso || "";
        let codigoPostal = sede.codigo_postal || "";
        let localidad = sede.localidad || "";
        let provincia = sede.provincia || "";

        if (sede.direccion && !calle) {
          // Separar por comas: [dirección, localidad, provincia, CP]
          const partes = sede.direccion.split(",").map((p) => p.trim());

          if (partes.length >= 1) {
            // Primera parte: calle, número y piso
            const direccionMatch = partes[0].match(/^(.+?)\s+(\d+)\s*(.*)$/);
            if (direccionMatch) {
              calle = direccionMatch[1]?.trim() || "";
              numero = direccionMatch[2] || "";
              piso = direccionMatch[3]?.trim() || "";
            } else {
              calle = partes[0];
            }
          }

          if (partes.length >= 2 && !localidad) {
            localidad = partes[1];
          }

          if (partes.length >= 3 && !provincia) {
            provincia = partes[2];
          }

          // Extraer código postal del formato (15004) o 15004
          if (partes.length >= 4) {
            const cpMatch = partes[3].match(/\(?(\d{5})\)?/);
            if (cpMatch) {
              codigoPostal = cpMatch[1];
            }
          }
        }

        // Limpiar localidad de código postal si lo tiene
        localidad = localidad.replace(/\(?\d{5}\)?/, "").trim();

        const { error: sedeError } = await supabase.from("sedes").insert({
          // Relación
          despacho_id: despachoId,

          // Básicos
          nombre: sede.nombre || "Sede Principal",
          descripcion: sede.descripcion || null,
          es_principal: esPrincipal,

          // Ubicación
          localidad: localidad,
          provincia: provincia,
          pais: sede.pais || "España",
          calle: calle,
          numero: numero || null,
          piso: piso || null,
          codigo_postal: codigoPostal || null,

          // Contacto
          telefono: sede.telefono || null,
          email_contacto: sede.email || sede.email_contacto || null,
          web: sede.web || null,
          persona_contacto: sede.persona_contacto || null,

          // Profesional
          ano_fundacion: sede.ano_fundacion || null,
          tamano_despacho: sede.tamano_despacho || null,
          numero_colegiado: sede.numero_colegiado || null,
          colegio: sede.colegio || null,
          experiencia: sede.experiencia || null,

          // Servicios
          areas_practica: sede.areas_practica || [],
          especialidades: sede.especialidades || null,
          servicios_especificos: sede.servicios_especificos || null,

          // Multimedia
          foto_perfil: sede.foto_perfil || sede.logo || null,

          // Horarios y redes
          horarios: sede.horarios || {},
          redes_sociales: sede.redes_sociales || {},

          // Otros
          observaciones: sede.observaciones || null,

          // Estado
          activa: true,
          estado_verificacion: "pendiente",
          estado_registro: "activo",
        });

        if (sedeError) {
          console.error("❌ Error al insertar sede:", sedeError);
          throw sedeError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Error al importar sedes:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Envía un despacho desde Next.js a WordPress
   * @param despachoId - ID del despacho en Supabase
   * @param forzarEstado - Si es true, usa el estado de Supabase. Si es false, mantiene el de WordPress
   */
  static async enviarDespachoAWordPress(
    despachoId: string,
    forzarEstado: boolean = false
  ) {
    try {
      // Obtener datos del despacho
      const { data: despacho, error: despachoError } = await supabase
        .from("despachos")
        .select("*, sedes(*)")
        .eq("id", despachoId)
        .single();

      if (despachoError || !despacho) {
        throw new Error("Despacho no encontrado");
      }

      // Preparar payload para WordPress con TODOS los campos
      // Usar estado_publicacion si existe, sino usar activo
      const estadoInicial =
        despacho.estado_publicacion || (despacho.activo ? "publish" : "draft");

      // Obtener la descripción de la sede principal o la primera sede
      const sedePrincipal =
        despacho.sedes?.find((s: Sede) => s.es_principal) ||
        despacho.sedes?.[0];
      let descripcionFinal =
        despacho.descripcion || sedePrincipal?.descripcion || "";

      // IMPORTANTE: WordPress necesita contenido para renderizar correctamente
      // Si no hay descripción, crear una básica con la información del despacho
      if (!descripcionFinal || descripcionFinal.trim() === "") {
        descripcionFinal = `<p>${despacho.nombre} es un despacho de abogados ubicado en ${sedePrincipal?.localidad || ""}, ${sedePrincipal?.provincia || ""}.</p>`;
        if (
          sedePrincipal?.areas_practica &&
          sedePrincipal.areas_practica.length > 0
        ) {
          descripcionFinal += `<p>Especializado en: ${sedePrincipal.areas_practica.join(", ")}.</p>`;
        }
      }

      const payload = {
        title: despacho.nombre,
        content: descripcionFinal,
        slug: despacho.slug,
        status: estadoInicial,
        meta: {
          localidad: despacho.sedes?.[0]?.localidad || "",
          provincia: despacho.sedes?.[0]?.provincia || "",
          telefono: despacho.sedes?.[0]?.telefono || "",
          email_contacto: despacho.sedes?.[0]?.email_contacto || "",
          // Campo de verificación con el nombre correcto que WordPress espera
          _despacho_estado_verificacion:
            despacho.estado_verificacion || "pendiente",
          _despacho_is_verified:
            despacho.estado_verificacion === "verificado" ? "1" : "0",
          _despacho_sedes:
            despacho.sedes?.map((sede: Sede) => {
              // Construir dirección completa desde campos separados
              const direccionPartes = [
                sede.calle && sede.numero
                  ? `${sede.calle} ${sede.numero}`
                  : sede.calle,
                sede.piso,
                sede.localidad,
                sede.provincia,
                sede.codigo_postal ? `(${sede.codigo_postal})` : "",
              ].filter(Boolean);

              return {
                nombre: sede.nombre || "",
                descripcion: sede.descripcion || "",
                localidad: sede.localidad || "",
                provincia: sede.provincia || "",
                pais: sede.pais || "España",
                direccion: direccionPartes.join(", "),
                direccion_completa: direccionPartes.join(", "), // Campo adicional para compatibilidad
                calle: sede.calle || "",
                numero: sede.numero || "",
                piso: sede.piso || "",
                codigo_postal: sede.codigo_postal || "",
                telefono: sede.telefono || "",
                email: sede.email_contacto || "",
                email_contacto: sede.email_contacto || "",
                web: sede.web || "",
                persona_contacto: sede.persona_contacto || "",
                ano_fundacion: sede.ano_fundacion || null,
                año_fundacion: sede.ano_fundacion || null, // Campo con tilde para compatibilidad
                tamano_despacho: sede.tamano_despacho || "",
                tamaño_despacho: sede.tamano_despacho || "", // Campo con tilde para compatibilidad
                numero_colegiado: sede.numero_colegiado || "",
                colegio: sede.colegio || "",
                experiencia: sede.experiencia || "",
                areas_practica: sede.areas_practica || [],
                especialidades: sede.especialidades || "",
                servicios_especificos: sede.servicios_especificos || "",
                foto_perfil: sede.foto_perfil || null,
                logo: sede.foto_perfil || null,
                horarios: sede.horarios || {},
                redes_sociales: sede.redes_sociales || {},
                observaciones: sede.observaciones || "",
                es_principal: sede.es_principal || false,
                activa: true,
                estado_verificacion: "pendiente",
                estado_registro: "activo",
                is_verified: false,
              };
            }) || [],
          // También agregar campos legacy para compatibilidad con WordPress
          _despacho_nombre: despacho.nombre,
          _despacho_localidad: despacho.sedes?.[0]?.localidad || "",
          _despacho_provincia: despacho.sedes?.[0]?.provincia || "",
          _despacho_codigo_postal: despacho.sedes?.[0]?.codigo_postal || "",
          _despacho_direccion: despacho.sedes?.[0]
            ? [
                despacho.sedes[0].calle && despacho.sedes[0].numero
                  ? `${despacho.sedes[0].calle} ${despacho.sedes[0].numero}`
                  : despacho.sedes[0].calle,
                despacho.sedes[0].piso,
                despacho.sedes[0].localidad,
                despacho.sedes[0].provincia,
                despacho.sedes[0].codigo_postal
                  ? `(${despacho.sedes[0].codigo_postal})`
                  : "",
              ]
                .filter(Boolean)
                .join(", ")
            : "",
          _despacho_telefono: despacho.sedes?.[0]?.telefono || "",
          _despacho_email: despacho.sedes?.[0]?.email_contacto || "",
          _despacho_web: despacho.sedes?.[0]?.web || "",
          _despacho_descripcion:
            sedePrincipal?.descripcion || despacho.descripcion || "",
          _despacho_numero_colegiado:
            despacho.sedes?.[0]?.numero_colegiado || "",
          _despacho_colegio: despacho.sedes?.[0]?.colegio || "",
          _despacho_experiencia: despacho.sedes?.[0]?.experiencia || "",
          _despacho_tamaño: despacho.sedes?.[0]?.tamano_despacho || "",
          _despacho_año_fundacion: despacho.sedes?.[0]?.ano_fundacion || "",
          _despacho_estado_registro: "activo",
          _despacho_foto_perfil: despacho.sedes?.[0]?.foto_perfil || "", // WordPress ahora procesa base64 automáticamente
          _despacho_horario: despacho.sedes?.[0]?.horarios || {},
          _despacho_redes_sociales: despacho.sedes?.[0]?.redes_sociales || {},
        },
      };

      // Autenticación con WordPress
      const username = process.env.WORDPRESS_USERNAME;
      const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;

      if (!username || !appPassword) {
        console.error("❌ Faltan credenciales de WordPress");
        throw new Error("Credenciales de WordPress no configuradas");
      }

      const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
      let wpResponse;
      let objectIdToUse = despacho.object_id;
      let currentWpPost = null;

      // Si no tiene object_id, buscar en WordPress por slug
      if (!objectIdToUse && despacho.slug) {
        const searchResponse = await fetch(
          `https://lexhoy.com/wp-json/wp/v2/despacho?slug=${despacho.slug}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          }
        );

        if (searchResponse.ok) {
          const searchResults = await searchResponse.json();
          if (searchResults && searchResults.length > 0) {
            objectIdToUse = searchResults[0].id;
            currentWpPost = searchResults[0];
            // Guardar el object_id en Supabase para futuras sincronizaciones
            await supabase
              .from("despachos")
              .update({ object_id: objectIdToUse })
              .eq("id", despachoId);
          }
        }
      }

      // Obtener el estado actual si el despacho existe en WordPress
      // Solo mantener el estado de WordPress si NO estamos forzando el estado
      if (objectIdToUse && !forzarEstado) {
        const postResponse = await fetch(
          `https://lexhoy.com/wp-json/wp/v2/despacho/${objectIdToUse}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          }
        );

        if (postResponse.ok) {
          currentWpPost = await postResponse.json();
          // Mantener el estado actual
          payload.status = currentWpPost.status;
        }
      } else if (forzarEstado) {
      }

      if (objectIdToUse) {
        // Actualizar despacho existente
        const url = `https://lexhoy.com/wp-json/wp/v2/despacho/${objectIdToUse}?force=true`;
        wpResponse = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Crear nuevo despacho
        wpResponse = await fetch("https://lexhoy.com/wp-json/wp/v2/despacho", {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!wpResponse.ok) {
        const errorData = await wpResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al enviar a WordPress");
      }

      const wpData = await wpResponse.json();
      const objectId = String(wpData.id);

      // Actualizar despacho en Next.js con object_id y wordpress_id
      await supabase
        .from("despachos")
        .update({
          object_id: objectId,
          wordpress_id: parseInt(objectId), // Sincronizar wordpress_id para evitar duplicados
          sincronizado_wp: true,
          ultima_sincronizacion: new Date().toISOString(),
        })
        .eq("id", despachoId);

      return {
        success: true,
        objectId,
        message: "Despacho enviado a WordPress correctamente",
      };
    } catch (error) {
      console.error("❌ Error al enviar despacho a WordPress:", error);

      // Marcar como no sincronizado
      await supabase
        .from("despachos")
        .update({ sincronizado_wp: false })
        .eq("id", despachoId);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Sincroniza un despacho desde un webhook de WordPress
   */
  static async sincronizarDesdeWebhook(payload: DespachoWordPress) {
    return await this.importarDespachoDesdeWordPress(payload);
  }

  /**
   * Elimina un despacho completamente (NextJS, WordPress y Algolia)
   * Solo para super admins
   */
  static async eliminarDespachoCompleto(despachoId: string) {
    try {
      // Obtener token de autenticación
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(`/api/despachos/${despachoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar el despacho");
      }

      return {
        success: true,
        message: "Despacho eliminado correctamente",
        details: data.details,
      };
    } catch (error) {
      console.error("❌ Error al eliminar despacho:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Sincroniza un despacho directamente con Algolia desde Next.js
   * Obtiene los datos de Supabase y los envía a Algolia
   */
  static async sincronizarConAlgolia(
    despachoId: string,
    algoliaObjectId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener datos del despacho desde Supabase
      const { data: despacho, error: despachoError } = await supabase
        .from("despachos")
        .select("*")
        .eq("id", despachoId)
        .single();

      if (despachoError || !despacho) {
        throw new Error(`Error al obtener despacho: ${despachoError?.message}`);
      }

      // Obtener sedes del despacho
      const { data: sedes, error: sedesError } = await supabase
        .from("sedes")
        .select("*")
        .eq("despacho_id", despachoId)
        .eq("activa", true)
        .order("es_principal", { ascending: false });

      if (sedesError) {
        throw new Error(`Error al obtener sedes: ${sedesError.message}`);
      }

      // Construir el registro para Algolia
      const algoliaRecord = {
        objectID: algoliaObjectId,
        nombre: despacho.nombre,
        descripcion: despacho.descripcion || "",
        sedes: (sedes || []).map((sede) => ({
          nombre: sede.nombre || "",
          descripcion: sede.descripcion || "",
          web: sede.web || "",
          ano_fundacion: sede.ano_fundacion || "",
          tamano_despacho: sede.tamano_despacho || "",
          persona_contacto: sede.persona_contacto || "",
          email_contacto: sede.email_contacto || "",
          telefono: sede.telefono || "",
          numero_colegiado: sede.numero_colegiado || "",
          colegio: sede.colegio || "",
          experiencia: sede.experiencia || "",
          calle: sede.calle || "",
          numero: sede.numero || "",
          piso: sede.piso || "",
          localidad: sede.localidad || "",
          provincia: sede.provincia || "",
          codigo_postal: sede.codigo_postal || "",
          pais: sede.pais || "España",
          direccion_completa: [
            sede.calle && sede.numero
              ? `${sede.calle} ${sede.numero}`
              : sede.calle,
            sede.piso,
            sede.localidad,
            sede.provincia,
            sede.codigo_postal ? `(${sede.codigo_postal})` : "",
          ]
            .filter(Boolean)
            .join(", "),
          especialidades: sede.especialidades || "",
          servicios_especificos: sede.servicios_especificos || "",
          estado_verificacion: sede.estado_verificacion || "pendiente",
          estado_registro: sede.estado_registro || "activo",
          foto_perfil: sede.foto_perfil || "",
          is_verified: sede.estado_verificacion === "verificado",
          observaciones: sede.observaciones || "",
          es_principal: sede.es_principal || false,
          activa: sede.activa !== false,
          horarios: sede.horarios || {},
          redes_sociales: sede.redes_sociales || {},
          areas_practica: sede.areas_practica || [],
        })),
        num_sedes: sedes?.length || 0,
        areas_practica: despacho.areas_practica || [],
        ultima_actualizacion: new Date().toLocaleDateString("es-ES"),
        slug:
          despacho.slug || despacho.nombre.toLowerCase().replace(/\s+/g, "-"),
      };

      // Enviar a Algolia
      const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
      const algoliaApiKey = process.env.ALGOLIA_ADMIN_API_KEY;
      const algoliaIndex =
        process.env.NEXT_PUBLIC_ALGOLIA_INDEX || "despachos_v3";

      if (!algoliaAppId || !algoliaApiKey) {
        throw new Error("Algolia credentials not configured");
      }

      const response = await fetch(
        `https://${algoliaAppId}-dsn.algolia.net/1/indexes/${algoliaIndex}/${algoliaObjectId}`,
        {
          method: "PUT",
          headers: {
            "X-Algolia-API-Key": algoliaApiKey,
            "X-Algolia-Application-Id": algoliaAppId,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(algoliaRecord),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Algolia sync failed: ${response.status} - ${errorText}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Error al sincronizar con Algolia:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
