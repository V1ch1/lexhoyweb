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
  // Básicos
  nombre?: string;
  descripcion?: string;
  es_principal?: boolean;
  
  // Ubicación
  direccion?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  
  // Contacto
  telefono?: string;
  email?: string;
  email_contacto?: string;
  web?: string;
  persona_contacto?: string;
  
  // Profesional
  ano_fundacion?: string;
  tamano_despacho?: string;
  numero_colegiado?: string;
  colegio?: string;
  experiencia?: string;
  
  // Servicios
  areas_practica?: string[];
  especialidades?: string;
  servicios_especificos?: string;
  
  // Multimedia
  foto_perfil?: string;
  logo?: string;
  
  // Horarios y redes
  horarios?: Record<string, string>;
  redes_sociales?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  
  // Otros
  observaciones?: string;
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
      console.log('🔍 Sedes encontradas:', JSON.stringify(sedes, null, 2));
      
      // También verificar otros campos del meta que podrían tener info adicional
      console.log('📋 Año fundación en meta:', despachoWP.meta?.ano_fundacion || despachoWP.meta?.year_founded);
      console.log('📋 Redes sociales en meta:', despachoWP.meta?.redes_sociales || despachoWP.meta?.social_media);
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
        
        console.log(`📍 Importando sede ${i + 1}:`, JSON.stringify(sede, null, 2));

        // Parsear dirección completa desde WordPress
        // Formato: "C/ Fonseca 6 4º, A Coruña, A Coruña, (15004)"
        let calle = sede.calle || '';
        let numero = sede.numero || '';
        let piso = sede.piso || '';
        let codigoPostal = sede.codigo_postal || '';
        let localidad = sede.localidad || '';
        let provincia = sede.provincia || '';
        
        if (sede.direccion && !calle) {
          // Separar por comas: [dirección, localidad, provincia, CP]
          const partes = sede.direccion.split(',').map(p => p.trim());
          
          if (partes.length >= 1) {
            // Primera parte: calle, número y piso
            const direccionMatch = partes[0].match(/^(.+?)\s+(\d+)\s*(.*)$/);
            if (direccionMatch) {
              calle = direccionMatch[1]?.trim() || '';
              numero = direccionMatch[2] || '';
              piso = direccionMatch[3]?.trim() || '';
            } else {
              calle = partes[0];
            }
          }
          
          if (partes.length >= 2 && !localidad) {
            localidad = partes[1];
          }
          
          if (partes.length >= 3 && !provincia) {
            provincia = partes[2];
          }
          
          // Extraer código postal del formato (15004) o 15004
          if (partes.length >= 4) {
            const cpMatch = partes[3].match(/\(?(\d{5})\)?/);
            if (cpMatch) {
              codigoPostal = cpMatch[1];
            }
          }
        }
        
        // Limpiar localidad de código postal si lo tiene
        localidad = localidad.replace(/\(?\d{5}\)?/, '').trim();

        const { error: sedeError } = await supabase.from('sedes').insert({
          // Relación
          despacho_id: despachoId,
          
          // Básicos
          nombre: sede.nombre || 'Sede Principal',
          descripcion: sede.descripcion || null,
          es_principal: esPrincipal,
          
          // Ubicación
          localidad: localidad,
          provincia: provincia,
          pais: sede.pais || 'España',
          calle: calle,
          numero: numero || null,
          piso: piso || null,
          codigo_postal: codigoPostal || null,
          
          // Contacto
          telefono: sede.telefono || null,
          email_contacto: sede.email || sede.email_contacto || null,
          web: sede.web || null,
          persona_contacto: sede.persona_contacto || null,
          
          // Profesional
          ano_fundacion: sede.ano_fundacion || null,
          tamano_despacho: sede.tamano_despacho || null,
          numero_colegiado: sede.numero_colegiado || null,
          colegio: sede.colegio || null,
          experiencia: sede.experiencia || null,
          
          // Servicios
          areas_practica: sede.areas_practica || [],
          especialidades: sede.especialidades || null,
          servicios_especificos: sede.servicios_especificos || null,
          
          // Multimedia
          foto_perfil: sede.foto_perfil || sede.logo || null,
          
          // Horarios y redes
          horarios: sede.horarios || {},
          redes_sociales: sede.redes_sociales || {},
          
          // Otros
          observaciones: sede.observaciones || null,
          
          // Estado
          activa: true,
          estado_verificacion: 'pendiente',
          estado_registro: 'activo',
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

      // Preparar payload para WordPress con TODOS los campos
      const payload = {
        title: despacho.nombre,
        content: despacho.descripcion || '',
        slug: despacho.slug,
        status: despacho.activo ? 'publish' : 'draft',
        meta: {
          localidad: despacho.sedes?.[0]?.localidad || '',
          provincia: despacho.sedes?.[0]?.provincia || '',
          telefono: despacho.sedes?.[0]?.telefono || '',
          email_contacto: despacho.sedes?.[0]?.email_contacto || '',
          _despacho_sedes: despacho.sedes?.map((sede: any) => {
            // Construir dirección completa desde campos separados
            const direccionPartes = [
              sede.calle && sede.numero ? `${sede.calle} ${sede.numero}` : sede.calle,
              sede.piso,
              sede.localidad,
              sede.provincia,
              sede.codigo_postal ? `(${sede.codigo_postal})` : ''
            ].filter(Boolean);
            
            return {
              nombre: sede.nombre,
              descripcion: sede.descripcion,
              localidad: sede.localidad,
              provincia: sede.provincia,
              pais: sede.pais,
              direccion: direccionPartes.join(', '),
              calle: sede.calle,
              numero: sede.numero,
              piso: sede.piso,
              codigo_postal: sede.codigo_postal,
              telefono: sede.telefono,
              email: sede.email_contacto,
              email_contacto: sede.email_contacto,
              web: sede.web,
              persona_contacto: sede.persona_contacto,
              ano_fundacion: sede.ano_fundacion,
              tamano_despacho: sede.tamano_despacho,
              numero_colegiado: sede.numero_colegiado,
              colegio: sede.colegio,
              experiencia: sede.experiencia,
              areas_practica: sede.areas_practica,
              especialidades: sede.especialidades,
              servicios_especificos: sede.servicios_especificos,
              foto_perfil: sede.foto_perfil,
              logo: sede.foto_perfil,
              horarios: sede.horarios,
              redes_sociales: sede.redes_sociales,
              observaciones: sede.observaciones,
              es_principal: sede.es_principal,
            };
          }) || [],
        },
      };

      // Autenticación con WordPress
      const username = process.env.WORDPRESS_USERNAME;
      const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;
      
      if (!username || !appPassword) {
        console.error('❌ Faltan credenciales de WordPress');
        throw new Error('Credenciales de WordPress no configuradas');
      }
      
      const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
      console.log('🔑 Autenticando con WordPress como:', username);
      console.log('📝 Payload a enviar:', JSON.stringify(payload, null, 2));

      let wpResponse;
      
      if (despacho.object_id) {
        // Actualizar despacho existente
        const url = `https://lexhoy.com/wp-json/wp/v2/despacho/${despacho.object_id}`;
        console.log('🔄 URL de actualización:', url);
        
        wpResponse = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        console.log('📊 Respuesta de WordPress:', wpResponse.status, wpResponse.statusText);
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
