/**
 * Servicio para gestionar leads en el marketplace
 */

import { supabase, supabaseAdmin } from "../supabase";
import { AILeadService, LeadData, LeadAnalysis } from "./aiLeadService";

export interface Lead {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string;
  cuerpo_mensaje: string;
  url_pagina: string;
  titulo_post: string;
  fuente?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  especialidad?: string;
  provincia?: string;
  ciudad?: string;
  urgencia?: "baja" | "media" | "alta" | "urgente";
  resumen_ia?: string;
  precio_estimado?: number; // Precio sugerido por IA
  palabras_clave?: string[];
  estado:
    | "pendiente"
    | "procesado"
    | "vendido"
    | "descartado";
  comprador_id?: string;
  precio_venta?: number;
  fecha_venta?: string;
  precio_base?: number; // Precio del lead
  puntuacion_calidad?: number;
  nivel_detalle?: "bajo" | "medio" | "alto";
  acepta_terminos?: boolean;
  acepta_privacidad?: boolean;
  // Trazabilidad de aprobación
  aprobado_por?: string; // ID del admin que aprobó el precio
  fecha_aprobacion?: string; // Cuándo se aprobó el precio
  created_at: string;
  updated_at: string;
  procesado_at?: string;
}

export interface CreateLeadInput {
  nombre: string;
  correo: string;
  telefono?: string;
  cuerpoMensaje: string;
  urlPagina: string;
  tituloPost: string;
  fuente?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  aceptaTerminos?: boolean;
  aceptaPrivacidad?: boolean;
}

export class LeadService {
  /**
   * Crea un nuevo lead y lo procesa con IA
   */
  static async createLead(input: CreateLeadInput): Promise<Lead> {
    try {
      // 1. Procesar con IA
      console.log("🤖 Procesando lead con IA...");
      const leadData: LeadData = {
        nombre: input.nombre,
        correo: input.correo,
        telefono: input.telefono,
        cuerpoMensaje: input.cuerpoMensaje,
        urlPagina: input.urlPagina,
        tituloPost: input.tituloPost,
      };

      const analysis = await AILeadService.processLead(leadData);

      // 2. Verificar calidad
      const cumpleCalidad = AILeadService.meetsQualityStandards(analysis);
      const estado = cumpleCalidad ? "procesado" : "descartado";

      console.log(
        `📊 Análisis completado. Calidad: ${analysis.puntuacionCalidad}/100. Estado: ${estado}`
      );

      // 3. Calcular precio base si cumple calidad
      const precioBase = cumpleCalidad
        ? AILeadService.calculateBasePrice(analysis)
        : null;

      // 4. Insertar en base de datos
      // Usamos supabaseAdmin para saltar RLS ya que es una operación de servidor
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from("leads")
        .insert({
          nombre: input.nombre,
          correo: input.correo,
          telefono: input.telefono,
          cuerpo_mensaje: input.cuerpoMensaje,
          url_pagina: input.urlPagina,
          titulo_post: input.tituloPost,
          fuente: input.fuente || "lexhoy.com",
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
          especialidad: analysis.especialidad,
          provincia: analysis.provincia,
          ciudad: analysis.ciudad,
          urgencia: analysis.urgencia,
          resumen_ia: analysis.resumenIA,
          precio_estimado: analysis.precioEstimado,
          palabras_clave: analysis.palabrasClave,
          estado,
          precio_base: precioBase,
          puntuacion_calidad: analysis.puntuacionCalidad,
          nivel_detalle: analysis.nivelDetalle,
          acepta_terminos: input.aceptaTerminos ?? false,
          acepta_privacidad: input.aceptaPrivacidad ?? false,
          procesado_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 5. Registrar log de procesamiento IA
      await this.logAIProcessing(data.id, analysis);

      // 6. Enviar notificaciones si cumple calidad
      if (cumpleCalidad && precioBase) {
        console.log("📧 Enviando notificaciones de nuevo lead...");
        
        // Obtener usuarios despacho_admin y super_admin
        const { data: despachoAdmins } = await supabase
          .from("users")
          .select("id")
          .eq("rol", "despacho_admin")
          .eq("estado", "activo");

        const { data: superAdmins } = await supabase
          .from("users")
          .select("id")
          .eq("rol", "super_admin")
          .eq("estado", "activo");

        // Importar servicios
        const { EmailService } = await import("@/lib/services/emailService");
        const { NotificationService } = await import("@/lib/notificationService");

        // Notificar a despacho_admin (email + dashboard)
        if (despachoAdmins && despachoAdmins.length > 0) {
          await Promise.allSettled(
            despachoAdmins.map(async (admin) => {
              // Email (respeta preferencias)
              await EmailService.sendNewLeadAvailable(admin.id, {
                id: data.id,
                especialidad: analysis.especialidad,
                urgencia: analysis.urgencia,
                puntuacion_calidad: analysis.puntuacionCalidad,
                precio: precioBase,
              });
              
              // Notificación dashboard (siempre)
              await NotificationService.create({
                userId: admin.id,
                tipo: "nuevo_lead",
                titulo: `🎯 Nuevo Lead: ${analysis.especialidad}`,
                mensaje: `Lead de ${analysis.urgencia} urgencia disponible. Calidad: ${analysis.puntuacionCalidad}/100. Precio: ${precioBase}€`,
                url: `/dashboard/leads/${data.id}`,
                metadata: {
                  leadId: data.id,
                  especialidad: analysis.especialidad,
                  urgencia: analysis.urgencia,
                  precio: precioBase,
                },
              });
            })
          );
          
          console.log(`✅ Notificaciones enviadas a ${despachoAdmins.length} despachos`);
        }

        // Notificar a super_admin (solo dashboard, para monitoreo)
        if (superAdmins && superAdmins.length > 0) {
          await Promise.allSettled(
            superAdmins.map((admin) =>
              NotificationService.create({
                userId: admin.id,
                tipo: "nuevo_lead_admin",
                titulo: `📊 Nuevo Lead Procesado`,
                mensaje: `Lead "${data.nombre}" procesado. Especialidad: ${analysis.especialidad}. Calidad: ${analysis.puntuacionCalidad}/100`,
                url: `/dashboard/admin/leads/${data.id}`,
                metadata: {
                  leadId: data.id,
                  especialidad: analysis.especialidad,
                  calidad: analysis.puntuacionCalidad,
                },
              })
            )
          );
          
          console.log(`✅ Notificaciones dashboard enviadas a ${superAdmins.length} super admins`);
        }
      }

      console.log(`✅ Lead creado: ${data.id}`);
      return data;
    } catch (error) {
      console.error("❌ Error creando lead:", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los leads (para admin)
   */
  static async getAllLeads() {
    if (!supabaseAdmin) {
      throw new Error("Database connection error");
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all leads:", error);
      throw error;
    }

    return data as Lead[];
  }

  /**
   * Obtiene leads disponibles para compra (solo resumen IA)
   */
  static async getAvailableLeads(filters?: {
    especialidad?: string;
    provincia?: string;
    urgencia?: string;
    precioMax?: number;
  }) {
    const client = supabaseAdmin || supabase;
    let query = client
      .from("leads")
      .select(
        `
        id,
        especialidad,
        provincia,
        ciudad,
        urgencia,
        resumen_ia,
        precio_estimado,
        precio_base,
        palabras_clave,
        estado,
        puntuacion_calidad,
        nivel_detalle,
        created_at
      `
      )
      .in("estado", ["pendiente", "procesado"])
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filters?.especialidad) {
      query = query.eq("especialidad", filters.especialidad);
    }
    if (filters?.provincia) {
      query = query.eq("provincia", filters.provincia);
    }
    if (filters?.urgencia) {
      query = query.eq("urgencia", filters.urgencia);
    }
    if (filters?.precioMax) {
      query = query.lte("precio_base", filters.precioMax);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene un lead completo (solo si el usuario lo compró)
   */
  static async getLeadById(leadId: string, userId: string): Promise<Lead> {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (error) throw error;

    // Verificar que el usuario tenga acceso
    if (data.comprador_id !== userId) {
      // Si no es el comprador, solo devolver datos públicos
      return {
        ...data,
        nombre: "***",
        correo: "***",
        telefono: "***",
        cuerpo_mensaje: data.resumen_ia || "***",
      };
    }

    return data;
  }

  /**
   * Compra directa de un lead
   */
  static async buyLead(leadId: string, compradorId: string): Promise<Lead> {
    try {
      const client = supabaseAdmin || supabase;
      // 1. Obtener lead
      const { data: lead, error: leadError } = await client
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .eq("estado", "procesado")
        .single();

      if (leadError) throw leadError;
      if (!lead) throw new Error("Lead no disponible");

      const precioVenta = lead.precio_base || 100;

      // 2. Actualizar lead como vendido
      const { data: updatedLead, error: updateError } = await client
        .from("leads")
        .update({
          estado: "vendido",
          comprador_id: compradorId,
          precio_venta: precioVenta,
          fecha_venta: new Date().toISOString(),
        })
        .eq("id", leadId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Registrar compra
      await client.from("compras_leads").insert({
        lead_id: leadId,
        comprador_id: compradorId,
        tipo_compra: "directa",
        precio_pagado: precioVenta,
        lead_snapshot: lead,
        estado: "completada",
      });

      // 4. Enviar notificaciones de compra
      try {
        const { EmailService } = await import("@/lib/services/emailService");
        const { NotificationService } = await import("@/lib/notificationService");
        
        // Email al comprador
        await EmailService.sendLeadPurchasedEmail(
          compradorId,
          lead.nombre || "Cliente",
          leadId
        );
        console.log(`📧 Email de compra enviado a ${compradorId}`);
        
        // Notificación dashboard al comprador
        await NotificationService.create({
          userId: compradorId,
          tipo: "lead_comprado",
          titulo: "✅ Lead Adquirido",
          mensaje: `Has adquirido el lead "${lead.nombre}". Contacta al cliente lo antes posible para maximizar conversión.`,
          url: `/dashboard/leads/${leadId}`,
          metadata: {
            leadId,
            precio: precioVenta,
            clienteNombre: lead.nombre,
          },
        });
        console.log(`✅ Notificación dashboard enviada al comprador`);
        
        // Notificar a super_admin sobre la venta
        const { data: superAdmins } = await supabase
          .from("users")
          .select("id, nombre, email")
          .eq("rol", "super_admin")
          .eq("estado", "activo");

        if (superAdmins && superAdmins.length > 0) {
          // Obtener datos del comprador
          const { data: comprador } = await supabase
            .from("users")
            .select("nombre, email")
            .eq("id", compradorId)
            .single();

          await Promise.allSettled(
            superAdmins.map((admin) =>
              NotificationService.create({
                userId: admin.id,
                tipo: "lead_vendido",
                titulo: "💰 Lead Vendido",
                mensaje: `Lead "${lead.nombre}" vendido a ${comprador?.nombre || comprador?.email} por ${precioVenta}€`,
                url: `/dashboard/admin/leads/${leadId}`,
                metadata: {
                  leadId,
                  compradorId,
                  compradorNombre: comprador?.nombre,
                  precio: precioVenta,
                },
              })
            )
          );
          
          console.log(`✅ Notificaciones de venta enviadas a ${superAdmins.length} super admins`);
        }
      } catch (emailError) {
        console.error("Error enviando notificaciones de compra:", emailError);
        // No lanzar error, la compra ya se completó
      }

      console.log(`✅ Lead ${leadId} comprado por ${compradorId}`);
      return updatedLead;
    } catch (error) {
      console.error("❌ Error comprando lead:", error);
      throw error;
    }
  }

  /**
   * Obtiene leads comprados por un usuario
   */
  static async getPurchasedLeads(userId: string) {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("leads")
      .select("*")
      .eq("comprador_id", userId)
      .eq("estado", "vendido")
      .order("fecha_venta", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Registra visualización de un lead
   */
  static async trackView(leadId: string, despachoId: string) {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from("visualizaciones_leads")
      .upsert(
        {
          lead_id: leadId,
          despacho_id: despachoId,
          ultima_vista: new Date().toISOString(),
        },
        {
          onConflict: "lead_id,despacho_id",
        }
      )
      .select()
      .single();

    if (error && error.code !== "23505") {
      // Ignorar errores de duplicado
      console.error("Error tracking view:", error);
    }

    // Incrementar contador de vistas
    if (data) {
      await client.rpc("increment", {
        table_name: "visualizaciones_leads",
        row_id: data.id,
        column_name: "vistas",
      });
    }
  }

  /**
   * Registra log de procesamiento IA
   */
  private static async logAIProcessing(
    leadId: string,
    analysis: LeadAnalysis
  ) {
    const client = supabaseAdmin || supabase;
    await client.from("logs_procesamiento_ia").insert({
      lead_id: leadId,
      modelo_ia: "gpt-4o-mini",
      respuesta_ia: JSON.stringify(analysis),
      exito: true,
    });
  }

  /**
   * Obtiene estadísticas de leads
   */
  static async getStats() {
    const { count: totalLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    const { count: disponibles } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("estado", ["procesado", "en_subasta"]);

    const { count: vendidos } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("estado", "vendido");

    return {
      total: totalLeads || 0,
      disponibles: disponibles || 0,
      vendidos: vendidos || 0,
    };
  }
}
