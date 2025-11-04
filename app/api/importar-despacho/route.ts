import { NextResponse } from "next/server";
import { SyncService } from "@/lib/syncService";
import { createClient } from '@supabase/supabase-js';

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

    // Obtener usuario autenticado
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    console.log('📥 Importando despacho:', despachoWP.id, 'para usuario:', user.id);

    // Importar usando SyncService
    const result = await SyncService.importarDespachoDesdeWordPress(despachoWP);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 500 }
      );
    }

    // Crear relación en user_despachos
    console.log('👤 Creando relación user_despachos para:', user.id, result.despachoId);
    
    const { error: relationError } = await supabase
      .from('user_despachos')
      .insert({
        user_id: user.id,
        despacho_id: result.despachoId,
        role: 'admin',
        created_at: new Date().toISOString()
      });

    if (relationError) {
      console.error('⚠️ Error al crear relación user_despachos:', relationError);
      // No es crítico, el despacho ya se importó
    } else {
      console.log('✅ Relación user_despachos creada exitosamente');
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
