import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * API Route para exportar datos del usuario (GDPR)
 * POST /api/user/export-data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const format = body.format || 'json';

    // Obtener todos los datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error al obtener datos del usuario:', userError);
    }

    // Obtener despachos del usuario
    const { data: despachosData } = await supabase
      .from('user_despachos')
      .select('*, despachos(*)')
      .eq('user_id', userId);

    // Obtener solicitudes del usuario
    const { data: solicitudesData } = await supabase
      .from('solicitudes_asignacion_despacho')
      .select('*')
      .eq('user_id', userId);

    // Compilar todos los datos
    const exportData = {
      usuario: userData || {},
      despachos: despachosData || [],
      solicitudes: solicitudesData || [],
      fecha_exportacion: new Date().toISOString(),
    };

    // Generar respuesta según el formato
    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="mis-datos-lexhoy.json"',
        },
      });
    } else if (format === 'csv') {
      // Convertir a CSV simple
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="mis-datos-lexhoy.csv"',
        },
      });
    } else if (format === 'pdf') {
      // Para PDF, devolver JSON con instrucción de que se necesita implementación adicional
      return NextResponse.json({
        error: 'Formato PDF en desarrollo. Por favor, usa JSON o CSV.',
      }, { status: 501 });
    }

    return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
  } catch (error) {
    console.error('Error al exportar datos:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Tipo,Campo,Valor');
  
  // Usuario
  if (data.usuario) {
    Object.entries(data.usuario).forEach(([key, value]) => {
      lines.push(`Usuario,${key},"${value}"`);
    });
  }
  
  // Despachos
  if (data.despachos) {
    data.despachos.forEach((despacho: any, index: number) => {
      Object.entries(despacho).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          lines.push(`Despacho ${index + 1},${key},"${value}"`);
        }
      });
    });
  }
  
  return lines.join('\n');
}
