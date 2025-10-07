import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Endpoint para crear un despacho en Supabase desde datos de WordPress
 * Se usa cuando un usuario solicita vinculación a un despacho que no existe en nuestra BD
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { objectId, nombre, localidad, provincia, slug, telefono, email, web, descripcion } = body;

    console.log('📝 Creando despacho desde WordPress:', { objectId, nombre, localidad, provincia });

    if (!objectId || !nombre) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: objectId y nombre" },
        { status: 400 }
      );
    }

    // 1. Verificar si el despacho ya existe por object_id
    const { data: despachoExistente, error: errorBusqueda } = await supabase
      .from('despachos')
      .select('id, object_id')
      .eq('object_id', objectId)
      .single();

    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      // PGRST116 = no rows returned (es esperado si no existe)
      console.error('❌ Error buscando despacho:', errorBusqueda);
      return NextResponse.json(
        { error: "Error al buscar despacho", details: errorBusqueda.message },
        { status: 500 }
      );
    }

    // Si ya existe, devolver el ID existente
    if (despachoExistente) {
      console.log('✅ Despacho ya existe:', despachoExistente.id);
      return NextResponse.json({
        success: true,
        despachoId: despachoExistente.id,
        objectId: despachoExistente.object_id,
        message: 'Despacho ya existente',
        existed: true
      });
    }

    // 2. Crear el despacho
    const { data: nuevoDespacho, error: errorDespacho } = await supabase
      .from('despachos')
      .insert({
        object_id: objectId,
        nombre: nombre,
        slug: slug || nombre.toLowerCase().replace(/\s+/g, '-'),
        localidad: localidad || null,
        provincia: provincia || null,
        telefono: telefono || null,
        email: email || null,
        web: web || null,
        descripcion: descripcion || null,
        activo: true,
        num_sedes: localidad ? 1 : 0,
      })
      .select()
      .single();

    if (errorDespacho) {
      console.error('❌ Error creando despacho:', errorDespacho);
      return NextResponse.json(
        { error: "Error al crear despacho", details: errorDespacho.message },
        { status: 500 }
      );
    }

    console.log('✅ Despacho creado:', nuevoDespacho.id);

    // 3. Si hay localidad/provincia, crear la sede principal
    if (localidad && provincia && nuevoDespacho) {
      const { error: errorSede } = await supabase
        .from('sedes')
        .insert({
          despacho_id: nuevoDespacho.id,
          nombre: 'Sede Principal',
          localidad: localidad,
          provincia: provincia,
          direccion: null,
          telefono: telefono || null,
          email: email || null,
          es_principal: true,
          activo: true,
        });

      if (errorSede) {
        console.warn('⚠️ Error creando sede (no crítico):', errorSede);
      } else {
        console.log('✅ Sede principal creada');
      }
    }

    return NextResponse.json({
      success: true,
      despachoId: nuevoDespacho.id,
      objectId: nuevoDespacho.object_id,
      message: 'Despacho creado exitosamente',
      existed: false
    });

  } catch (error) {
    console.error('❌ Error interno:', error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
