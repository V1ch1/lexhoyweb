import { NextResponse } from "next/server";
import { SyncService } from "@/lib/syncService";
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from "@/lib/api-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Endpoint para importar un despacho desde WordPress a Next.js
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { despachoWP } = body;

    if (!despachoWP || !despachoWP.id) {
      return NextResponse.json(
        { error: "Datos del despacho inválidos" },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado con NextAuth
    const { user, error: authError } = await requireAuth();

    if (authError) {
      return authError;
    }

    // Importar usando SyncService
    const result = await SyncService.importarDespachoDesdeWordPress(despachoWP);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 500 }
      );
    }

    // Crear relación en user_despachos
    const { error: relationError } = await supabase
      .from('user_despachos')
      .insert({
        user_id: user.id,
        despacho_id: result.despachoId
        // No incluir rol ni created_at - se asignarán por defecto en la BD
      });

    if (relationError) {
      console.error('⚠️ Error al crear relación user_despachos:', relationError);
      // No es crítico, el despacho ya se importó
    } else {
      }

    return NextResponse.json({
      success: true,
      despachoId: result.despachoId,
      objectId: result.objectId,
      message: result.message,
    });

  } catch (error) {
    console.error('❌ Error al importar despacho:', error);
    console.error('Tipo de error:', typeof error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    let errorMessage = 'Error desconocido';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json(
      {
        error: 'Error al importar despacho',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
