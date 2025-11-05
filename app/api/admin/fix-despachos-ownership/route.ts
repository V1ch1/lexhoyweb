import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para corregir la propiedad de despachos existentes
 * Asigna despachos a usuarios basándose en owner_email
 */
export async function POST() {
  try {
    console.log('🔧 Iniciando corrección de propiedad de despachos...');

    // 1. Obtener todos los despachos con owner_email
    const { data: despachos, error: despachosError } = await supabase
      .from('despachos')
      .select('id, owner_email, nombre')
      .not('owner_email', 'is', null);

    if (despachosError) {
      console.error('Error al obtener despachos:', despachosError);
      throw despachosError;
    }

    console.log(`📊 Encontrados ${despachos.length} despachos con owner_email`);

    const results = {
      total: despachos.length,
      asignados: 0,
      errores: 0,
      detalles: [] as Array<{
        despacho_id: string;
        nombre: string;
        email: string;
        user_id?: string;
        status: string;
        error?: string;
      }>
    };

    // 2. Para cada despacho, buscar el usuario y crear la asignación
    for (const despacho of despachos) {
      try {
        // Buscar usuario por email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', despacho.owner_email)
          .single();

        if (userError || !userData) {
          console.log(`⚠️ Usuario no encontrado para ${despacho.owner_email}`);
          results.errores++;
          results.detalles.push({
            despacho_id: despacho.id,
            nombre: despacho.nombre,
            email: despacho.owner_email,
            status: 'usuario_no_encontrado'
          });
          continue;
        }

        // Verificar si ya existe la asignación
        const { data: existingAssignment } = await supabase
          .from('user_despachos')
          .select('id')
          .eq('user_id', userData.id)
          .eq('despacho_id', despacho.id)
          .single();

        if (existingAssignment) {
          console.log(`✓ Asignación ya existe para ${despacho.nombre}`);
          results.detalles.push({
            despacho_id: despacho.id,
            nombre: despacho.nombre,
            email: despacho.owner_email,
            status: 'ya_asignado'
          });
          continue;
        }

        // Crear la asignación (solo campos que existen en la tabla)
        const { error: assignError } = await supabase
          .from('user_despachos')
          .insert({
            user_id: userData.id,
            despacho_id: despacho.id
            // Los demás campos se asignan por defecto en la BD
          });

        if (assignError) {
          console.error(`❌ Error al asignar ${despacho.nombre}:`, assignError);
          results.errores++;
          results.detalles.push({
            despacho_id: despacho.id,
            nombre: despacho.nombre,
            email: despacho.owner_email,
            status: 'error_asignacion',
            error: assignError.message
          });
        } else {
          console.log(`✅ Asignado: ${despacho.nombre} → ${despacho.owner_email}`);
          results.asignados++;
          results.detalles.push({
            despacho_id: despacho.id,
            nombre: despacho.nombre,
            email: despacho.owner_email,
            user_id: userData.id,
            status: 'asignado_correctamente'
          });
        }

      } catch (error) {
        console.error(`❌ Error procesando despacho ${despacho.id}:`, error);
        results.errores++;
        results.detalles.push({
          despacho_id: despacho.id,
          nombre: despacho.nombre,
          email: despacho.owner_email,
          status: 'error_procesamiento',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    console.log('✅ Corrección completada:', results);

    return NextResponse.json({
      success: true,
      message: 'Corrección de propiedad completada',
      results
    });

  } catch (error) {
    console.error("❌ Error en corrección:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al corregir propiedad de despachos",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
