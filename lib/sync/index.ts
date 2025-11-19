/**
 * Orchestrator de sincronización
 * Coordina el flujo: Supabase → WordPress
 * (WordPress sincroniza automáticamente con Algolia)
 */

import { SupabaseSync } from "./supabase";
import { WordPressSync } from "./wordpress";
import type { SyncResult } from "./types";

export class SyncOrchestrator {
  /**
   * Sincronización completa: Supabase → WordPress → Algolia
   * @param despachoId - ID del despacho en Supabase
   * @param forzarEstado - Si true, usa el estado de Supabase. Si false, mantiene el de WP
   */
  static async sincronizarCompleto(
    despachoId: string,
    forzarEstado: boolean = false
  ): Promise<SyncResult> {
    console.log("\n" + "=".repeat(70));
    console.log("🔄 INICIANDO SINCRONIZACIÓN COMPLETA");
    console.log("=".repeat(70));
    console.log(`Despacho ID: ${despachoId}`);
    console.log(`Forzar estado: ${forzarEstado ? "Sí" : "No"}`);
    console.log("");

    try {
      // PASO 1: Obtener datos completos desde Supabase
      console.log("📊 PASO 1: Obtener datos desde Supabase");
      console.log("-".repeat(70));

      const despacho = await SupabaseSync.getDespachoCompleto(despachoId);

      if (!despacho) {
        const error = "No se pudo obtener el despacho desde Supabase";
        console.error(`❌ ${error}`);
        return { success: false, error };
      }

      console.log(`✅ Despacho obtenido: ${despacho.nombre}`);
      console.log(`   Estado verificación: ${despacho.estado_verificacion}`);
      console.log(`   Sedes cargadas: ${despacho.sedes?.length || 0}`);

      if (!despacho.sedes || despacho.sedes.length === 0) {
        console.warn("⚠️ ADVERTENCIA: El despacho no tiene sedes");
      } else {
        despacho.sedes.forEach((sede, i) => {
          console.log(`      ${i + 1}. ${sede.nombre} (${sede.localidad})`);
        });
      }

      // PASO 2: Enviar a WordPress
      console.log("\n📤 PASO 2: Enviar a WordPress");
      console.log("-".repeat(70));

      const wpResult = await WordPressSync.enviarDespacho(despacho);

      if (!wpResult.success) {
        const error = `Error al enviar a WordPress: ${wpResult.error}`;
        console.error(`❌ ${error}`);
        return { success: false, error };
      }

      console.log(`✅ Enviado a WordPress exitosamente`);
      console.log(`   WordPress ID: ${wpResult.wordpressId}`);
      console.log(`   Object ID: ${wpResult.objectId}`);

      // Actualizar IDs en Supabase si es necesario
      if (
        wpResult.wordpressId &&
        (!despacho.wordpress_id ||
          despacho.wordpress_id !== wpResult.wordpressId)
      ) {
        console.log(`   Actualizando IDs en Supabase...`);
        await SupabaseSync.actualizarIdsSync(
          despachoId,
          wpResult.wordpressId,
          Number(wpResult.objectId)
        );
      }

      // PASO 3: Sincronización con Algolia
      // ⚠️ WordPress sincroniza automáticamente con Algolia al crear/actualizar
      // el despacho vía REST API (hooks: save_post_despacho, rest_after_insert_despacho)
      // Por lo tanto, NO es necesario sincronizar desde Next.js

      if (!wpResult.objectId) {
        const error = "No se obtuvo objectID de WordPress";
        console.error(`❌ ${error}`);
        return {
          success: false,
          error,
          wordpressId: wpResult.wordpressId,
        };
      }

      console.log(
        "\n✅ PASO 3: Algolia (sincronizado automáticamente por WordPress)"
      );
      console.log("-".repeat(70));
      console.log(`   WordPress ya sincronizó este despacho con Algolia`);
      console.log(`   Algolia Object ID: ${wpResult.objectId}`);

      // RESULTADO FINAL
      console.log("\n" + "=".repeat(70));
      console.log("✅ SINCRONIZACIÓN COMPLETA EXITOSA");
      console.log("=".repeat(70));
      console.log(`Despacho: ${despacho.nombre}`);
      console.log(`Estado verificación: ${despacho.estado_verificacion}`);
      console.log(`Sedes sincronizadas: ${despacho.sedes?.length || 0}`);
      console.log(`WordPress ID: ${wpResult.wordpressId}`);
      console.log(`Algolia Object ID: ${wpResult.objectId}`);
      console.log("");

      return {
        success: true,
        wordpressId: wpResult.wordpressId,
        objectId: wpResult.objectId,
        message: "Sincronización completa exitosa",
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("\n❌ EXCEPCIÓN EN SINCRONIZACIÓN:", errorMsg);
      console.error(error);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Actualiza solo el estado de verificación (más rápido)
   * @param despachoId - ID del despacho en Supabase
   * @param estadoVerificacion - Nuevo estado: 'pendiente' | 'verificado' | 'rechazado'
   */
  static async actualizarVerificacion(
    despachoId: string,
    estadoVerificacion: string
  ): Promise<SyncResult> {
    console.log("\n" + "=".repeat(70));
    console.log("🔄 ACTUALIZANDO ESTADO DE VERIFICACIÓN");
    console.log("=".repeat(70));
    console.log(`Despacho ID: ${despachoId}`);
    console.log(`Nuevo estado: ${estadoVerificacion}`);
    console.log("");

    try {
      // Validar estado
      if (
        !["pendiente", "verificado", "rechazado"].includes(estadoVerificacion)
      ) {
        return {
          success: false,
          error: "Estado de verificación inválido",
        };
      }

      // Actualizar en Supabase
      const updateOk = await SupabaseSync.actualizarEstadoVerificacion(
        despachoId,
        estadoVerificacion
      );

      if (!updateOk) {
        return {
          success: false,
          error: "Error al actualizar Supabase",
        };
      }

      // Sincronizar completo (para propagar el cambio)
      return await this.sincronizarCompleto(despachoId, false);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("❌ Error al actualizar verificación:", errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
