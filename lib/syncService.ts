// lib/syncService.ts
import { createClient } from '@supabase/supabase-js';

// Cliente con Service Role para operaciones del servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DespachoWordPress {
  id: number | string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  slug?: string;
  status?: string;
  date?: string;
  meta?: {
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email_contacto?: string;
    object_id?: string;
    _despacho_sedes?: Array<{
      nombre?: string;
      localidad?: string;
      provincia?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
      web?: string;
      es_principal?: boolean;
      descripcion?: string;
      areas_practica?: string[];
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface Sede {
  nombre?: string;
  localidad?: string;
  provincia?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
  es_principal?: boolean;
  descripcion?: string;
  areas_practica?: string[];
}

export class SyncService {
  /**
   * Importa un despacho desde WordPress a Next.js
   * Incluye la importación de sedes
   */
  static async importarDespachoDesdeWordPress(despachoWP: DespachoWordPress) {
    try {
      console.log('🔄 Importando despacho desde WordPress:', despachoWP.id);
      
      const objectId = String(despachoWP.id);
      const nombre = despachoWP.title?.rendered || 'Sin título';
      const descripcion = despachoWP.content?.rendered || '';
      const slug = despachoWP.slug || nombre.toLowerCase().replace(/\s+/g, '-');
      
      // Verificar si ya existe el despacho
      const { data: existente } = await supabase
        .from('despachos')
        .select('id')
        .eq('object_id', objectId)
        .single();

      let despachoId: string;

      if (existente) {
        console.log('✅ Despacho ya existe, actualizando...');
        
        // Actualizar despacho existente
        const { data: updated, error: updateError } = await supabase
          .from('despachos')
          .update({
            nombre,
            descripcion,
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq('object_id', objectId)
          .select('id')
          .single();

        if (updateError) throw updateError;
        despachoId = updated.id;
        
      } else {
        console.log('📝 Creando nuevo despacho...');
        
        // Crear nuevo despacho
        const { data: created, error: createError } = await supabase
          .from('despachos')
          .insert({
            object_id: objectId,
            nombre,
            descripcion,
            slug,
            activo: despachoWP.status === 'publish',
            verificado: false,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error al crear despacho:', createError);
          console.error('Detalles completos:', JSON.stringify(createError, null, 2));
          throw createError;
        }
        despachoId = created.id;
        console.log('✅ Despacho creado con ID:', despachoId);
      }

      // Importar sedes si existen
      console.log('🔍 Meta completo:', JSON.stringify(despachoWP.meta, null, 2));
      const sedes = despachoWP.meta?._despacho_sedes;
      console.log('🔍 Sedes encontradas:', sedes);
      if (sedes && Array.isArray(sedes) && sedes.length > 0) {
        console.log(`📍 Importando ${sedes.length} sede(s)...`);
        
        // Eliminar sedes existentes primero
        const { error: deleteError } = await supabase
          .from('sedes')
          .delete()
          .eq('despacho_id', despachoId);
        
        if (deleteError) {
          console.warn('⚠️ Error al eliminar sedes antiguas:', deleteError);
        } else {
          console.log('🗑️ Sedes antiguas eliminadas');
        }
        
        // Importar nuevas sedes
        await this.importarSedes(despachoId, sedes);
        
        // Actualizar num_sedes
        await supabase
          .from('despachos')
          .update({ num_sedes: sedes.length })
          .eq('id', despachoId);
      }

      console.log('✅ Despacho importado correctamente:', despachoId);
      
      return {
        success: true,
        despachoId,
        objectId,
        message: 'Despacho importado correctamente',
      };
      
    } catch (error) {
      console.error('❌ Error al importar despacho:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : String(error),
      };
    }
  }

  /**
   * Importa sedes desde WordPress
   */
  static async importarSedes(despachoId: string, sedes: Sede[]) {
    try {
      for (let i = 0; i < sedes.length; i++) {
        const sede = sedes[i];
        const esPrincipal = i === 0 || sede.es_principal === true;

        const { error: sedeError } = await supabase.from('sedes').insert({
          despacho_id: despachoId,
          nombre: sede.nombre || 'Sede Principal',
          es_principal: esPrincipal,
          localidad: sede.localidad || '',
          provincia: sede.provincia || '',
          calle: sede.direccion || '',
          telefono: sede.telefono || '',
          email_contacto: sede.email || '',
          web: sede.web || '',
          descripcion: sede.descripcion || null,
          areas_practica: sede.areas_practica || [],
          activa: true,
          estado_verificacion: 'pendiente',
        });
        
        if (sedeError) {
          console.error('❌ Error al insertar sede:', sedeError);
          throw sedeError;
        }
      }

      console.log(`✅ ${sedes.length} sede(s) importada(s)`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error al importar sedes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Envía un despacho desde Next.js a WordPress
   */
  static async enviarDespachoAWordPress(despachoId: string) {
    try {
      console.log('🔄 Enviando despacho a WordPress:', despachoId);

      // Obtener datos del despacho
      const { data: despacho, error: despachoError } = await supabase
        .from('despachos')
        .select('*, sedes(*)')
        .eq('id', despachoId)
        .single();

      if (despachoError || !despacho) {
        throw new Error('Despacho no encontrado');
      }

      // Preparar payload para WordPress
      const payload = {
        title: despacho.nombre,
        content: despacho.descripcion || '',
        slug: despacho.slug,
        status: despacho.activo ? 'publish' : 'draft',
        meta: {
          localidad: despacho.sedes?.[0]?.localidad || '',
          provincia: despacho.sedes?.[0]?.provincia || '',
          telefono: despacho.sedes?.[0]?.telefono || '',
          email_contacto: despacho.sedes?.[0]?.email || '',
          _despacho_sedes: despacho.sedes?.map((sede: {
            nombre: string;
            localidad: string;
            provincia: string;
            calle: string;
            telefono: string;
            email: string;
            web: string;
            es_principal: boolean;
          }) => ({
            nombre: sede.nombre,
            localidad: sede.localidad,
            provincia: sede.provincia,
            direccion: sede.calle,
            telefono: sede.telefono,
            email: sede.email,
            web: sede.web,
            es_principal: sede.es_principal,
          })) || [],
        },
      };

      // Autenticación con WordPress
      const username = process.env.NEXT_PUBLIC_WP_USER;
      const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
      const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');

      let wpResponse;
      
      if (despacho.object_id) {
        // Actualizar despacho existente
        wpResponse = await fetch(
          `https://lexhoy.com/wp-json/wp/v2/despacho/${despacho.object_id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Crear nuevo despacho
        wpResponse = await fetch(
          'https://lexhoy.com/wp-json/wp/v2/despacho',
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!wpResponse.ok) {
        const errorData = await wpResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al enviar a WordPress');
      }

      const wpData = await wpResponse.json();
      const objectId = String(wpData.id);

      // Actualizar despacho en Next.js con object_id
      await supabase
        .from('despachos')
        .update({
          object_id: objectId,
          sincronizado_wp: true,
          ultima_sincronizacion: new Date().toISOString(),
        })
        .eq('id', despachoId);

      console.log('✅ Despacho enviado a WordPress:', objectId);

      return {
        success: true,
        objectId,
        message: 'Despacho enviado a WordPress correctamente',
      };

    } catch (error) {
      console.error('❌ Error al enviar despacho a WordPress:', error);
      
      // Marcar como no sincronizado
      await supabase
        .from('despachos')
        .update({ sincronizado_wp: false })
        .eq('id', despachoId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Sincroniza un despacho desde un webhook de WordPress
   */
  static async sincronizarDesdeWebhook(payload: DespachoWordPress) {
    return await this.importarDespachoDesdeWordPress(payload);
  }
}
