/**
 * Módulo de sincronización con Supabase
 * Responsabilidad: Obtener datos de despachos y sedes
 */

import { createClient } from "@supabase/supabase-js";
import type { Despacho, Sede } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class SupabaseSync {
  /**
   * Obtiene un despacho con todas sus sedes desde Supabase
   */
  static async getDespachoCompleto(
    despachoId: string
  ): Promise<Despacho | null> {
    try {
      console.log(`📊 Obteniendo despacho ${despachoId} desde Supabase...`);

      const { data: despacho, error: despachoError } = await supabase
        .from("despachos")
        .select("*")
        .eq("id", despachoId)
        .single();

      if (despachoError || !despacho) {
        console.error("❌ Error al obtener despacho:", despachoError);
        return null;
      }

      // Obtener sedes por separado para asegurar que se cargan
      const { data: sedes, error: sedesError } = await supabase
        .from("sedes")
        .select("*")
        .eq("despacho_id", despachoId)
        .order("es_principal", { ascending: false }); // Principal primero

      if (sedesError) {
        console.error("❌ Error al obtener sedes:", sedesError);
        return null;
      }

      console.log(`✅ Despacho obtenido: ${despacho.nombre}`);
      console.log(`   Sedes encontradas: ${sedes?.length || 0}`);

      return {
        ...despacho,
        sedes: (sedes as Sede[]) || [],
      };
    } catch (error) {
      console.error("❌ Excepción en getDespachoCompleto:", error);
      return null;
    }
  }

  /**
   * Actualiza el wordpress_id y object_id en Supabase después de sincronizar
   */
  static async actualizarIdsSync(
    despachoId: string,
    wordpressId: number,
    objectId: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("despachos")
        .update({
          wordpress_id: wordpressId,
          object_id: objectId,
          sincronizado_wp: true,
          ultima_sincronizacion: new Date().toISOString(),
        })
        .eq("id", despachoId);

      if (error) {
        console.error("❌ Error al actualizar IDs de sincronización:", error);
        return false;
      }

      console.log("✅ IDs de sincronización actualizados en Supabase");
      return true;
    } catch (error) {
      console.error("❌ Excepción en actualizarIdsSync:", error);
      return false;
    }
  }

  /**
   * Actualiza el estado de verificación del despacho
   */
  static async actualizarEstadoVerificacion(
    despachoId: string,
    estadoVerificacion: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("despachos")
        .update({ estado_verificacion: estadoVerificacion })
        .eq("id", despachoId);

      if (error) {
        console.error("❌ Error al actualizar estado de verificación:", error);
        return false;
      }

      console.log(
        `✅ Estado de verificación actualizado a: ${estadoVerificacion}`
      );
      return true;
    } catch (error) {
      console.error("❌ Excepción en actualizarEstadoVerificacion:", error);
      return false;
    }
  }
}
