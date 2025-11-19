/**
 * Módulo de sincronización con Algolia
 * Responsabilidad: Sincronizar datos a Algolia sin perder información
 */

import type { Despacho, SyncResult } from "./types";

export class AlgoliaSync {
  private static readonly APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
  private static readonly ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY!;
  private static readonly INDEX =
    process.env.NEXT_PUBLIC_ALGOLIA_INDEX || "despachos_v3";
  private static readonly BASE_URL = `https://${this.APP_ID}-dsn.algolia.net/1/indexes/${this.INDEX}`;

  /**
   * Sincroniza un despacho con Algolia
   * IMPORTANTE: Obtiene el registro completo, modifica solo los campos necesarios, y guarda todo
   */
  static async sincronizarDespacho(
    despacho: Despacho,
    objectId: string
  ): Promise<SyncResult> {
    try {
      console.log(`\n🔍 Sincronizando con Algolia (objectID: ${objectId})...`);

      // PASO 1: Obtener el registro completo actual de Algolia
      console.log("   Obteniendo registro actual de Algolia...");
      const getResponse = await fetch(`${this.BASE_URL}/${objectId}`, {
        method: "GET",
        headers: {
          "X-Algolia-API-Key": this.ADMIN_KEY,
          "X-Algolia-Application-Id": this.APP_ID,
        },
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        console.error(
          `❌ Error al obtener de Algolia (${getResponse.status}):`,
          errorText
        );
        return {
          success: false,
          error: `Algolia GET error: ${getResponse.status}`,
        };
      }

      const registroActual = await getResponse.json();
      console.log(`   Registro obtenido: ${registroActual.nombre}`);
      console.log(
        `   Sedes existentes en Algolia: ${registroActual.sedes?.length || 0}`
      );

      // PASO 2: Actualizar solo los campos de verificación en las sedes
      if (registroActual.sedes && Array.isArray(registroActual.sedes)) {
        const estadoVerificacion = despacho.estado_verificacion || "pendiente";
        const isVerified = estadoVerificacion === "verificado";

        console.log(
          `   Actualizando estado de verificación en ${registroActual.sedes.length} sedes...`
        );
        console.log(
          `   Nuevo estado: ${estadoVerificacion} (is_verified: ${isVerified ? "Sí" : "No"})`
        );

        registroActual.sedes = registroActual.sedes.map(
          (sede: Record<string, unknown>, index: number) => {
            console.log(
              `      Sede ${index + 1}: ${sede.nombre} -> ${estadoVerificacion}`
            );
            return {
              ...sede,
              estado_verificacion: estadoVerificacion,
              is_verified: isVerified ? "Sí" : "No",
            };
          }
        );
      } else {
        console.warn("⚠️ No hay sedes en el registro de Algolia");
      }

      // PASO 3: Guardar el registro completo de vuelta
      console.log("   Guardando registro actualizado en Algolia...");
      const putResponse = await fetch(`${this.BASE_URL}/${objectId}`, {
        method: "PUT",
        headers: {
          "X-Algolia-API-Key": this.ADMIN_KEY,
          "X-Algolia-Application-Id": this.APP_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registroActual),
      });

      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        console.error(
          `❌ Error al actualizar Algolia (${putResponse.status}):`,
          errorText
        );
        return {
          success: false,
          error: `Algolia PUT error: ${putResponse.status}`,
        };
      }

      const result = await putResponse.json();
      console.log(`✅ Algolia actualizado exitosamente`);
      console.log(`   ObjectID: ${result.objectID}`);
      console.log(`   Updated at: ${result.updatedAt}`);

      return {
        success: true,
        objectId: result.objectID,
        message: "Despacho sincronizado con Algolia",
      };
    } catch (error) {
      console.error("❌ Excepción al sincronizar con Algolia:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Busca un despacho en Algolia por nombre
   */
  static async buscarDespacho(
    query: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const searchKey = "dcec9a6a746edae820a86f53e57e60e4"; // Search-only key

      const response = await fetch(`${this.BASE_URL}/query`, {
        method: "POST",
        headers: {
          "X-Algolia-API-Key": searchKey,
          "X-Algolia-Application-Id": this.APP_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          hitsPerPage: 1,
        }),
      });

      if (!response.ok) {
        console.error(`❌ Error en búsqueda Algolia: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.hits[0] || null;
    } catch (error) {
      console.error("❌ Excepción en búsqueda Algolia:", error);
      return null;
    }
  }
}
