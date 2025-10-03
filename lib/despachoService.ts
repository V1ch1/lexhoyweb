// lib/despachoService.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class DespachoService {
  /**
   * Busca un despacho por ID en Supabase y, si no lo encuentra, en WordPress
   */
  static async buscarDespacho(id: string) {
    try {
      console.log(`Buscando despacho con ID: ${id}`);
      
      // 1. Buscar en Supabase
      const { data: despachoLocal } = await supabase
        .from('despachos')
        .select('*')
        .eq('wp_id', id)
        .single();

      if (despachoLocal) {
        console.log('✅ Despacho encontrado en Supabase');
        return { 
          success: true, 
          data: despachoLocal, 
          source: 'local' 
        };
      }

      // 2. Si no está en Supabase, buscar en WordPress
      console.log('🔍 Despacho no encontrado localmente, buscando en WordPress...');
      const wpResponse = await fetch(
        `${process.env.WORDPRESS_API_URL}/${id}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APPLICATION_PASSWORD}`
            ).toString('base64')}`
          }
        }
      );

      if (!wpResponse.ok) {
        const errorData = await wpResponse.json().catch(() => ({}));
        console.error('Error al buscar en WordPress:', errorData);
        return { 
          success: false, 
          error: 'No se encontró el despacho en WordPress',
          details: errorData
        };
      }

      const wpDespacho = await wpResponse.json();
      console.log('✅ Despacho encontrado en WordPress:', wpDespacho.id);
      
      return { 
        success: true,
        data: wpDespacho, 
        source: 'wordpress',
        existsInWordPress: true
      };
      
    } catch (error) {
      console.error('❌ Error en buscarDespacho:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : String(error)
      };
    }
  }

  /**
   * Importa un despacho desde WordPress a Supabase
   */
  static async importarDeWordPress(despachoWP: {
    id: number | string;
    title?: { rendered?: string };
    content?: { rendered?: string };
    status?: string;
    date?: string;
    meta?: Record<string, unknown>;
    [key: string]: unknown;
  }) {
    try {
      console.log('Importando despacho desde WordPress:', despachoWP.id);
      
      const { data, error } = await supabase
        .from('despachos')
        .upsert({
          wp_id: despachoWP.id,
          titulo: despachoWP.title?.rendered || 'Sin título',
          contenido: despachoWP.content?.rendered || '',
          estado: despachoWP.status || 'draft',
          fecha_publicacion: despachoWP.date || new Date().toISOString(),
          datos_originales: despachoWP, // Guardamos los datos completos
          actualizado_en: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Despacho importado correctamente:', data.id);
      return { 
        success: true, 
        data 
      };
      
    } catch (error) {
      console.error('❌ Error al importar despacho:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : String(error) 
      };
    }
  }
}
