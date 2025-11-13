import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para verificar sedes de despachos
 */
export async function POST() {
  try {
    // Obtener despachos con owner_email = blancocasal@gmail.com
    const { data: despachos, error: despachosError } = await supabase
      .from('despachos')
      .select('id, nombre, num_sedes, owner_email')
      .eq('owner_email', 'blancocasal@gmail.com');

    if (despachosError) {
      throw despachosError;
    }

    const results = [];

    for (const despacho of despachos) {
      // Obtener sedes del despacho
      const { data: sedes, error: sedesError } = await supabase
        .from('sedes')
        .select('id, nombre, localidad, provincia, es_principal')
        .eq('despacho_id', despacho.id);

      if (sedesError) {
        console.error(`Error al obtener sedes de ${despacho.nombre}:`, sedesError);
      }

      results.push({
        despacho_id: despacho.id,
        nombre: despacho.nombre,
        num_sedes_registrado: despacho.num_sedes,
        sedes_reales: sedes?.length || 0,
        sedes: sedes || [],
        tiene_sedes: (sedes?.length || 0) > 0
      });

      }

    return NextResponse.json({
      success: true,
      total_despachos: despachos.length,
      despachos: results
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar sedes",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
