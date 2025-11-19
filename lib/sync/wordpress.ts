/**
 * Módulo de sincronización con WordPress
 * Responsabilidad: Enviar y recibir datos de/a WordPress vía REST API
 */

import type { Despacho, Sede, SyncResult, WordPressDespacho } from "./types";

export class WordPressSync {
  private static readonly WP_API_URL =
    process.env.WORDPRESS_API_URL ||
    "https://lexhoy.com/wp-json/wp/v2/despacho";
  private static readonly WP_USERNAME = process.env.WORDPRESS_USERNAME!;
  private static readonly WP_PASSWORD =
    process.env.WORDPRESS_APPLICATION_PASSWORD!;

  /**
   * Construye el payload de sedes para WordPress
   * CRÍTICO: Cada sede debe incluir el estado_verificacion del DESPACHO
   */
  private static construirSedesPayload(
    despacho: Despacho
  ): Record<string, unknown>[] {
    if (!despacho.sedes || despacho.sedes.length === 0) {
      console.warn("⚠️ Despacho sin sedes, enviando array vacío");
      return [];
    }

    console.log(
      `📦 Construyendo payload para ${despacho.sedes.length} sedes...`
    );

    return despacho.sedes.map((sede: Sede, index: number) => {
      // Construir dirección completa
      const direccionPartes = [
        sede.calle && sede.numero ? `${sede.calle} ${sede.numero}` : sede.calle,
        sede.piso,
        sede.localidad,
        sede.provincia,
        sede.codigo_postal ? `(${sede.codigo_postal})` : "",
      ].filter(Boolean);

      const sedePayload = {
        nombre: sede.nombre || "",
        descripcion: sede.descripcion || "",
        localidad: sede.localidad || "",
        provincia: sede.provincia || "",
        pais: sede.pais || "España",
        direccion: direccionPartes.join(", "),
        direccion_completa: direccionPartes.join(", "),
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
        año_fundacion: sede.ano_fundacion || null,
        tamano_despacho: sede.tamano_despacho || "",
        tamaño_despacho: sede.tamano_despacho || "",
        numero_colegiado: sede.numero_colegiado || "",
        colegio: sede.colegio || "",
        experiencia: sede.experiencia || "",
        areas_practica: sede.areas_practica || [],
        especialidades: sede.especialidades || "",
        servicios_especificos: sede.servicios_especificos || "",
        foto_perfil: sede.foto_perfil?.startsWith("http")
          ? sede.foto_perfil
          : null,
        logo: sede.foto_perfil?.startsWith("http") ? sede.foto_perfil : null,
        horarios: sede.horarios || {},
        redes_sociales: sede.redes_sociales || {},
        observaciones: sede.observaciones || "",
        es_principal: sede.es_principal || false,
        activa: sede.activa !== false,
        // CRÍTICO: Usar el estado de verificación del DESPACHO
        estado_verificacion: despacho.estado_verificacion || "pendiente",
        estado_registro: sede.estado_registro || "activo",
        is_verified: despacho.estado_verificacion === "verificado",
      };

      console.log(
        `   Sede ${index + 1}: ${sede.nombre} - estado: ${sedePayload.estado_verificacion}`
      );

      return sedePayload;
    });
  }

  /**
   * Construye el payload completo para WordPress
   */
  private static construirPayload(despacho: Despacho): WordPressDespacho {
    const sedePrincipal =
      despacho.sedes?.find((s) => s.es_principal) || despacho.sedes?.[0];

    // Descripción
    let descripcion = despacho.descripcion || sedePrincipal?.descripcion || "";
    if (!descripcion || descripcion.trim() === "") {
      descripcion = `<p>${despacho.nombre} es un despacho de abogados ubicado en ${sedePrincipal?.localidad || ""}, ${sedePrincipal?.provincia || ""}.</p>`;
      if (
        sedePrincipal?.areas_practica &&
        sedePrincipal.areas_practica.length > 0
      ) {
        descripcion += `<p>Áreas de práctica: ${sedePrincipal.areas_practica.join(", ")}.</p>`;
      }
    }

    // Estado de publicación
    const estado =
      despacho.estado_publicacion || (despacho.activo ? "publish" : "draft");

    // Construir sedes
    const sedesPayload = this.construirSedesPayload(despacho);

    const payload: WordPressDespacho = {
      title: despacho.nombre,
      slug: despacho.slug,
      content: descripcion,
      status: estado,
      meta: {
        _despacho_estado_verificacion: despacho.estado_verificacion,
        _despacho_is_verified:
          despacho.estado_verificacion === "verificado" ? "1" : "0",
        _despacho_sedes: sedesPayload,
        _despacho_nombre: despacho.nombre,
        _despacho_localidad: sedePrincipal?.localidad || "",
        _despacho_provincia: sedePrincipal?.provincia || "",
        _despacho_codigo_postal: sedePrincipal?.codigo_postal || "",
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
        _despacho_telefono: sedePrincipal?.telefono || "",
        _despacho_email: sedePrincipal?.email_contacto || "",
        _despacho_web: sedePrincipal?.web || "",
        _despacho_descripcion:
          sedePrincipal?.descripcion || despacho.descripcion || "",
        _despacho_numero_colegiado: sedePrincipal?.numero_colegiado || "",
        _despacho_colegio: sedePrincipal?.colegio || "",
        _despacho_experiencia: sedePrincipal?.experiencia || "",
        _despacho_tamaño: sedePrincipal?.tamano_despacho || "",
        _despacho_año_fundacion: sedePrincipal?.ano_fundacion || "",
        _despacho_estado_registro: "activo",
        _despacho_foto_perfil: sedePrincipal?.foto_perfil?.startsWith("http")
          ? sedePrincipal.foto_perfil
          : "",
        _despacho_horario: sedePrincipal?.horarios || {},
        _despacho_redes_sociales: sedePrincipal?.redes_sociales || {},
      },
    };

    console.log(`📦 Payload construido:`);
    console.log(`   Título: ${payload.title}`);
    console.log(`   Estado: ${payload.status}`);
    console.log(
      `   Verificación: ${payload.meta._despacho_estado_verificacion}`
    );
    console.log(`   Sedes en payload: ${sedesPayload.length}`);

    return payload;
  }

  /**
   * Envía un despacho a WordPress (crear o actualizar)
   */
  static async enviarDespacho(despacho: Despacho): Promise<SyncResult> {
    try {
      // Validaciones
      if (!despacho.nombre || !despacho.slug) {
        return {
          success: false,
          error: "Despacho sin nombre o slug",
        };
      }

      console.log(`\n📤 Enviando despacho a WordPress: ${despacho.nombre}`);
      console.log(`   Estado verificación: ${despacho.estado_verificacion}`);
      console.log(`   Sedes disponibles: ${despacho.sedes?.length || 0}`);

      const payload = this.construirPayload(despacho);
      const auth = Buffer.from(
        `${this.WP_USERNAME}:${this.WP_PASSWORD}`
      ).toString("base64");

      let response: Response;
      let wordpressId: number;

      // Actualizar o crear
      if (despacho.wordpress_id) {
        console.log(
          `   Actualizando despacho existente (ID: ${despacho.wordpress_id})...`
        );
        response = await fetch(`${this.WP_API_URL}/${despacho.wordpress_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify(payload),
        });
        wordpressId = despacho.wordpress_id;
      } else {
        console.log(`   Creando nuevo despacho en WordPress...`);
        response = await fetch(this.WP_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en WordPress (${response.status}):`, errorText);
        return {
          success: false,
          error: `WordPress API error: ${response.status} - ${errorText}`,
        };
      }

      const wpData = await response.json();
      wordpressId = wpData.id;

      console.log(`✅ Despacho enviado exitosamente a WordPress`);
      console.log(`   WordPress ID: ${wordpressId}`);
      console.log(
        `   Sedes sincronizadas: ${(payload.meta._despacho_sedes as unknown[]).length}`
      );

      return {
        success: true,
        wordpressId: wordpressId,
        objectId: String(wordpressId),
        message: "Despacho sincronizado con WordPress",
      };
    } catch (error) {
      console.error("❌ Excepción al enviar a WordPress:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Obtiene un despacho desde WordPress
   */
  static async obtenerDespacho(
    wordpressId: number
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.WP_API_URL}/${wordpressId}`);

      if (!response.ok) {
        console.error(
          `❌ Error al obtener despacho ${wordpressId}: ${response.status}`
        );
        return null;
      }

      const data = await response.json();
      console.log(`✅ Despacho obtenido desde WordPress (ID: ${wordpressId})`);
      console.log(`   Sedes en WP: ${data.meta?._despacho_sedes?.length || 0}`);

      return data;
    } catch (error) {
      console.error("❌ Excepción al obtener desde WordPress:", error);
      return null;
    }
  }
}
