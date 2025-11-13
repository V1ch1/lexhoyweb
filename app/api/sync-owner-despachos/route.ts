import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Endpoint temporal para sincronizar despachos con owner_email a user_despachos
 * Este endpoint crea los registros faltantes en user_despachos para usuarios que tienen despachos con owner_email
 */
export async function POST() {
  try {
    // 1. Obtener todos los despachos que tienen owner_email
    const { data: despachosConOwner, error: despachosError } = await supabase
      .from('despachos')
      .select('id, nombre, owner_email')
      .not('owner_email', 'is', null)
      .eq('activo', true);

    if (despachosError) {
      console.error('❌ Error obteniendo despachos:', despachosError);
      throw despachosError;
    }

    const resultados = [];

    // 2. Para cada despacho, buscar el usuario y crear el vínculo
    for (const despacho of despachosConOwner || []) {
      try {
        // Buscar usuario por email
        const { data: usuario, error: usuarioError } = await supabase
          .from('users')
          .select('id, email, nombre, apellidos')
          .eq('email', despacho.owner_email)
          .single();

        if (usuarioError || !usuario) {
          resultados.push({
            despacho: despacho.nombre,
            email: despacho.owner_email,
            status: 'usuario_no_encontrado',
          });
          continue;
        }

        // Verificar si ya existe el vínculo
        const { data: vinculoExistente, error: checkError } = await supabase
          .from('user_despachos')
          .select('id, activo')
          .eq('user_id', usuario.id)
          .eq('despacho_id', despacho.id)
          .maybeSingle();

        if (checkError) {
          console.error(`❌ Error verificando vínculo:`, checkError);
          throw checkError;
        }

        if (vinculoExistente) {
          if (vinculoExistente.activo) {
            resultados.push({
              despacho: despacho.nombre,
              email: despacho.owner_email,
              usuario: `${usuario.nombre} ${usuario.apellidos}`,
              status: 'ya_existe',
            });
          } else {
            // Reactivar vínculo
            const { error: updateError } = await supabase
              .from('user_despachos')
              .update({ activo: true })
              .eq('id', vinculoExistente.id);

            if (updateError) throw updateError;

            resultados.push({
              despacho: despacho.nombre,
              email: despacho.owner_email,
              usuario: `${usuario.nombre} ${usuario.apellidos}`,
              status: 'reactivado',
            });
          }
        } else {
          // Crear nuevo vínculo
          const { error: insertError } = await supabase
            .from('user_despachos')
            .insert({
              user_id: usuario.id,
              despacho_id: despacho.id,
              asignado_por: 'system_sync',
              permisos: { leer: true, escribir: true, eliminar: true },
              activo: true,
              fecha_asignacion: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`❌ Error creando vínculo:`, insertError);
            throw insertError;
          }

          // Actualizar rol del usuario a despacho_admin si no lo es
          const { error: roleError } = await supabase
            .from('users')
            .update({ rol: 'despacho_admin' })
            .eq('id', usuario.id)
            .neq('rol', 'super_admin'); // No cambiar si es super_admin

          if (roleError) {
            console.warn(`⚠️ Error actualizando rol:`, roleError);
          } else {
            }

          resultados.push({
            despacho: despacho.nombre,
            email: despacho.owner_email,
            usuario: `${usuario.nombre} ${usuario.apellidos}`,
            status: 'creado',
          });
        }
      } catch (error) {
        console.error(`❌ Error procesando despacho ${despacho.nombre}:`, error);
        resultados.push({
          despacho: despacho.nombre,
          email: despacho.owner_email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      resultados,
      resumen: {
        total: resultados.length,
        creados: resultados.filter(r => r.status === 'creado').length,
        reactivados: resultados.filter(r => r.status === 'reactivado').length,
        ya_existentes: resultados.filter(r => r.status === 'ya_existe').length,
        errores: resultados.filter(r => r.status === 'error').length,
      },
    });
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error en sincronización',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
