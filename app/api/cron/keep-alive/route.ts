import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verificar autenticación del cron (header secreto)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Realizar una consulta ligera para mantener la base de datos activa
    // Consultamos la tabla 'despachos' que parece ser una de las principales
    const { count, error } = await supabase
      .from('despachos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase keep-alive check successful',
      timestamp: new Date().toISOString(),
      databaseActive: true
    });
  } catch (error) {
    console.error('Keep-alive cron error:', error);
    return NextResponse.json({ 
      error: 'Failed to communicate with Supabase',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
