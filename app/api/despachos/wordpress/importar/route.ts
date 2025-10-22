import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface DespachoWP {
  id: number;
  title?: { rendered?: string };
  content?: { rendered?: string };
  meta?: {
    _despacho_email_contacto?: string;
    _despacho_telefono?: string;
    _despacho_web?: string;
    _despacho_sedes?: Array<{
      id?: number;
      localidad?: string;
      provincia?: string;
      direccion?: string;
      codigo_postal?: string;
      telefono?: string;
      email?: string;
      horario?: string;
      es_principal?: boolean;
    }>;
    [key: string]: unknown;
  };
  slug?: string;
  [key: string]: unknown;
}

/**
 * Importa un despacho desde WordPress a la base de datos local
 * POST /api/despachos/wordpress/importar
 */
export async function POST(request: Request) {
  console.log('🔄 [WordPress] Iniciando importación de despacho...');
  
  try {
    const requestData = await request.json();
    const objectId = requestData?.objectId;
    
    console.log('📥 [WordPress] Datos recibidos:', { objectId });
    
    if (!objectId) {
      return NextResponse.json(
        { 
          error: 'Se requiere el objectId del despacho',
          receivedData: requestData
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = 'Falta la configuración de Supabase';
      console.error('❌ [WordPress]', errorMsg, { supabaseUrl, hasKey: !!supabaseKey });
      return NextResponse.json(
        { error: errorMsg },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Obtener el despacho de WordPress
    console.log('🌐 [WordPress] Obteniendo datos del despacho...');
    const wpResponse = await fetch(`https://lexhoy.com/wp-json/wp/v2/despacho/${objectId}`);
    
    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('❌ [WordPress] Error al obtener el despacho:', wpResponse.status, errorText);
      return NextResponse.json(
        { 
          error: 'No se pudo obtener el despacho de WordPress',
          details: errorText,
          status: wpResponse.status
        },
        { status: 404 }
      );
    }
    
    const despacho: DespachoWP = await wpResponse.json();
    console.log('✅ [WordPress] Despacho obtenido:', { id: despacho.id, titulo: despacho.title?.rendered });
    
    // 2. Preparar datos para Supabase - Datos del despacho
    const despachoData = {
      object_id: despacho.id.toString(),
      nombre: despacho.title?.rendered || `Despacho ${despacho.id}`,
      descripcion: despacho.content?.rendered || '',
      email: despacho.meta?._despacho_email_contacto || '',
      telefono: despacho.meta?._despacho_telefono || '',
      web: despacho.meta?._despacho_web || '',
      direccion: despacho.meta?._despacho_sedes?.[0]?.direccion || '',
      slug: despacho.slug || `despacho-${despacho.id}`,
      wp_post_id: despacho.id,
      sincronizado_wp: true,
      estado_registro: 'pendiente' as const, // Valores permitidos: 'borrador', 'pendiente', 'aprobado', 'rechazado', 'suspendido'
      ultima_sincronizacion: new Date().toISOString(),
      verificado: true,
      activo: true,
      num_sedes: despacho.meta?._despacho_sedes?.length || 0
    };

    // 2.1 Preparar datos de sedes
    const sedesData = despacho.meta?._despacho_sedes?.map((sede, index) => {
      const sedeData = {
        nombre: `Sede ${index + 1} - ${sede.localidad || 'Principal'}`,
        descripcion: `Sede en ${sede.localidad || 'ubicación principal'}`,
        calle: sede.direccion?.split(',')[0]?.trim() || '',
        localidad: sede.localidad || '',
        provincia: sede.provincia || '',
        codigo_postal: sede.codigo_postal || '',
        telefono: sede.telefono || despacho.meta?._despacho_telefono || '',
        email_contacto: sede.email || despacho.meta?._despacho_email_contacto || '', // Usamos email_contacto en lugar de email
        web: despacho.meta?._despacho_web || '',
        es_principal: index === 0,
        activa: true,
        estado_verificacion: 'pendiente',
        sincronizado_wp: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Usar el ID de la sede si está disponible
        wp_sede_id: sede.id?.toString() || ''
      };

      console.log('📝 Datos de la sede a guardar:', JSON.stringify(sedeData, null, 2));

      return sedeData;
    }) || [];
    
    // 3. Verificar si el despacho ya existe
    const { data: despachoExistente } = await supabase
      .from('despachos')
      .select('*')
      .or(`object_id.eq.${despacho.id},wp_post_id.eq.${despacho.id}`)
      .single();
    
    let resultado;
    
    // 4. Insertar o actualizar el despacho
    if (despachoExistente) {
      console.log('🔄 [Supabase] Actualizando despacho existente:', despachoExistente.id);
      const { data, error } = await supabase
        .from('despachos')
        .update(despachoData)
        .eq('id', despachoExistente.id)
        .select()
        .single();
        
      if (error) throw error;
      resultado = { ...data, isNew: false };
    } else {
      console.log('✨ [Supabase] Creando nuevo despacho');
      const { data, error } = await supabase
        .from('despachos')
        .insert([despachoData])
        .select()
        .single();
        
      if (error) throw error;
      resultado = { ...data, isNew: true };
    }
    
    console.log('✅ [Supabase] Despacho guardado correctamente');
    
    // 5. Procesar sedes si existen
    if (sedesData.length > 0) {
      console.log(`🏢 [WordPress] Procesando ${sedesData.length} sedes del despacho...`);
      
      // Obtener todas las sedes existentes para este despacho
      const { data: sedesExistentes, error: fetchError } = await supabase
        .from('sedes')
        .select('*')
        .eq('despacho_id', resultado.id);
      
      if (fetchError) {
        console.error('❌ [Supabase] Error al obtener sedes existentes:', fetchError);
      } else {
        // Marcar como inactivas las sedes que ya no están en los datos de WordPress
        const sedesAEliminar = sedesExistentes.filter(
          se => !sedesData.some(sd => sd.wp_sede_id && se.wp_sede_id === sd.wp_sede_id)
        );
        
        for (const sede of sedesAEliminar) {
          const { error: updateError } = await supabase
            .from('sedes')
            .update({ 
              activa: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', sede.id);
            
          if (updateError) {
            console.error(`❌ [Supabase] Error al marcar como inactiva la sede ${sede.id}:`, updateError);
          }
        }
      }
      
      // Luego, insertar o actualizar las sedes
      for (const [index, sede] of sedesData.entries()) {
        try {
          // Verificar si la sede ya existe (por dirección y localidad)
          const { data: sedeExistente, error: sedeError } = await supabase
            .from('sedes')
            .select('*')
            .eq('despacho_id', resultado.id)
            .or(`and(localidad.eq.${sede.localidad ? `'${sede.localidad.replace(/'/g, "''")}'` : 'null'},calle.eq.${sede.calle ? `'${sede.calle.replace(/'/g, "''")}'` : 'null'})`)
            .maybeSingle();
            
          if (sedeError) throw sedeError;
          
          // Extraemos solo los campos necesarios
          // @ts-expect-error - El objeto sede puede tener un id
          const { id: _wp_sede_id, ...sedeSinId } = sede; // Prefijo con _ para indicar que no se usa
          const datosSede = {
            ...sedeSinId,
            despacho_id: resultado.id,
            activa: true,
            updated_at: new Date().toISOString()
          };
          
          if (sedeExistente) {
            // Actualizar sede existente
            const { error: updateError } = await supabase
            .from('sedes')
            .update(datosSede)
            .eq('id', sedeExistente.id)
            .select()
            .single();
            
            if (updateError) throw updateError;
            console.log(`✅ [Supabase] Sede actualizada: ${datosSede.nombre}`);
          } else {
            // Insertar nueva sede
            const { error: insertError } = await supabase
              .from('sedes')
              .insert([datosSede])
              .select()
              .single();
              
            if (insertError) throw insertError;
            console.log(`✅ [Supabase] Nueva sede creada: ${datosSede.nombre}`);
          }
        } catch (error) {
          console.error(`❌ [Supabase] Error al procesar la sede ${sede.nombre || index + 1}:`, error);
        }
      }
      
      console.log(`✅ [Supabase] Procesadas ${sedesData.length} sedes`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Despacho importado correctamente',
      data: resultado,
      isNew: !!resultado.isNew
    });
    
  } catch (error) {
    console.error('❌ [Error] Error en la importación:', error);
    return NextResponse.json(
      { 
        error: 'Error al importar el despacho',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
