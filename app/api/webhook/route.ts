import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface MetaData {
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
  [key: string]: string | undefined;
}

interface DespachoData {
  id: number | string;
  title?: {
    rendered: string;
  };
  content?: {
    rendered: string;
  };
  status?: string;
  slug?: string;
  meta?: MetaData;
  [key: string]: string | number | MetaData | undefined | { rendered: string };
}

export async function POST(request: Request) {
  try {
    // 1. Log de headers para depuración
    const requestHeaders = Object.fromEntries(request.headers.entries());
    // 2. Verificar el método HTTP
    if (request.method !== 'POST') {
      console.error(`❌ Método no permitido: ${request.method}`);
      return NextResponse.json(
        { error: 'Método no permitido' },
        { status: 405 }
      );
    }

    // 3. Verificar el secreto del webhook
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.WEBHOOK_SECRET;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      console.error('❌ No autorizado - Secreto de webhook inválido o faltante');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 4. Parsear el body
    let payload;
    try {
      payload = await request.json();
      } catch (error) {
      console.error('❌ Error al parsear el JSON:', error);
      return NextResponse.json(
        { error: 'Formato de JSON inválido' },
        { status: 400 }
      );
    }

    // 5. Validar la estructura del payload
    if (!payload.event || !payload.data) {
      console.error('❌ Estructura de payload inválida:', { payload });
      return NextResponse.json(
        { error: 'Formato de payload inválido' },
        { status: 400 }
      );
    }

    const eventType = payload.event;
    const data = payload.data;

    switch (eventType) {
      case 'despacho.created':
      case 'despacho.updated':
        await handleDespachoUpdate(data);
        break;
      case 'despacho.deleted':
        await handleDespachoDelete(data.id);
        break;
      default:
        }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook procesado correctamente',
      event: eventType,
      despachoId: data?.id
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const stack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Error en el webhook:', {
      message: errorMessage,
      stack: stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al procesar el webhook',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  } finally {
    }
}

async function handleDespachoUpdate(despachoData: DespachoData) {
  try {
    // Validar datos requeridos
    if (!despachoData.id) {
      throw new Error('ID de despacho es requerido');
    }

    const updateData = {
      // Usamos el ID de WordPress como object_id
      object_id: despachoData.id.toString(),
      nombre: despachoData.title?.rendered || 'Sin título',
      descripcion: despachoData.content?.rendered || '',
      direccion: despachoData.meta?.direccion || null,
      telefono: despachoData.meta?.telefono || null,
      email: despachoData.meta?.email || null,
      web: despachoData.meta?.web || null,
      // Campos adicionales para el control
      estado_registro: 'borrador',  // Valores permitidos: 'borrador', 'pendiente', 'aprobado', 'rechazado'
      sincronizado_wordpress: true,
      fecha_sync_wordpress: new Date().toISOString(),
      // Mantenemos los campos requeridos
      num_sedes: 1, // Valor por defecto, ajusta según sea necesario
      areas_practica: [], // Inicializamos como array vacío
      ultima_actualizacion: new Date().toISOString(),
      slug: despachoData.slug || `despacho-${despachoData.id}`,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      verificado: false,
      activo: true
    };

    // Buscamos si ya existe un despacho con este object_id
    const { data: existingDespacho } = await supabase
      .from('despachos')
      .select('id')
      .eq('object_id', despachoData.id.toString())
      .single();

    let result;
    if (existingDespacho) {
      const { data, error } = await supabase
        .from('despachos')
        .update(updateData)
        .eq('id', existingDespacho.id)
        .select();
      
      if (error) {
        console.error('❌ Error de Supabase al actualizar:', error);
        throw error;
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from('despachos')
        .insert([updateData])
        .select();
      
      if (error) {
        console.error('❌ Error de Supabase al crear:', error);
        throw error;
      }
      result = data;
    }

    return result;
  } catch (error) {
    console.error('❌ Error al actualizar despacho:', error);
    throw error;
  }
}

async function handleDespachoDelete(despachoId: number | string) {
  const { error } = await supabase
    .from('despachos')
    .delete()
    .eq('wp_post_id', despachoId);
  if (error) {
    console.error('❌ Error al eliminar despacho:', error);
    throw error;
  }

  return true;
}
