// lib/sedeService.ts
import { createClient } from '@supabase/supabase-js';

// Cliente con Service Role para operaciones del servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interfaces
export interface SedeInput {
  despacho_id: string;
  nombre: string;
  descripcion?: string;
  // Ubicación
  calle?: string;
  numero?: string;
  piso?: string;
  localidad: string;
  provincia: string;
  codigo_postal?: string;
  pais?: string;
  // Contacto
  telefono: string;
  email_contacto: string;
  persona_contacto?: string;
  web?: string;
  // Adicional
  ano_fundacion?: number | string; // Acepta ambos para flexibilidad
  tamano_despacho?: string;
  // Estado
  es_principal?: boolean;
  foto_perfil?: string;
}

export interface Sede extends SedeInput {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface SedeWordPress {
  id?: number;
  nombre: string;
  descripcion?: string;
  web?: string;
  ano_fundacion?: string;
  tamano_despacho?: string;
  persona_contacto?: string;
  email_contacto?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SedeService {
  /**
   * Crear una nueva sede
   */
  static async crearSede(sedeData: SedeInput): Promise<{ success: boolean; data?: Sede; error?: string }> {
    try {
      console.log('📝 Creando nueva sede:', sedeData.nombre);

      // Validar datos
      const validation = this.validarSede(sedeData);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validación fallida: ${validation.errors.join(', ')}`
        };
      }

      // Crear sede en Supabase
      const { data, error } = await supabase
        .from('sedes')
        .insert({
          despacho_id: sedeData.despacho_id,
          nombre: sedeData.nombre,
          descripcion: sedeData.descripcion || '',
          // Ubicación
          calle: sedeData.calle || '',
          numero: sedeData.numero || '',
          piso: sedeData.piso || '',
          localidad: sedeData.localidad,
          provincia: sedeData.provincia,
          codigo_postal: sedeData.codigo_postal || '',
          pais: sedeData.pais || 'España',
          // Contacto
          telefono: sedeData.telefono,
          email_contacto: sedeData.email_contacto,
          persona_contacto: sedeData.persona_contacto || '',
          web: sedeData.web || '',
          // Adicional
          ano_fundacion: sedeData.ano_fundacion 
            ? (typeof sedeData.ano_fundacion === 'string' ? parseInt(sedeData.ano_fundacion) : sedeData.ano_fundacion)
            : null,
          tamano_despacho: sedeData.tamano_despacho || '',
          // Estado
          es_principal: sedeData.es_principal || false,
          activa: true,
          foto_perfil: sedeData.foto_perfil || '',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error al crear sede:', error);
        throw error;
      }

      console.log('✅ Sede creada exitosamente:', data.id);

      // Incrementar contador de sedes en despacho
      await this.incrementarNumSedes(sedeData.despacho_id);

      return {
        success: true,
        data: data as Sede
      };
    } catch (error) {
      console.error('❌ Error en crearSede:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener una sede por ID
   */
  static async obtenerSede(sedeId: number): Promise<{ success: boolean; data?: Sede; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .eq('id', sedeId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Sede
      };
    } catch (error) {
      console.error('❌ Error al obtener sede:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar una sede existente
   */
  static async actualizarSede(
    sedeId: number,
    sedeData: Partial<SedeInput>
  ): Promise<{ success: boolean; data?: Sede; error?: string }> {
    try {
      console.log('🔄 Actualizando sede:', sedeId);

      const { data, error } = await supabase
        .from('sedes')
        .update({
          ...sedeData,
          updated_at: new Date().toISOString()
        })
        .eq('id', sedeId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Sede actualizada exitosamente');

      return {
        success: true,
        data: data as Sede
      };
    } catch (error) {
      console.error('❌ Error al actualizar sede:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar una sede (soft delete recomendado)
   */
  static async eliminarSede(sedeId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Eliminando sede:', sedeId);

      // Obtener información de la sede para validaciones
      const { data: sede } = await supabase
        .from('sedes')
        .select('despacho_id')
        .eq('id', sedeId)
        .single();

      if (!sede) {
        return {
          success: false,
          error: 'Sede no encontrada'
        };
      }

      // Validar que no es la única sede
      const esUnicaSede = await this.esUnicaSede(sede.despacho_id);
      if (esUnicaSede) {
        return {
          success: false,
          error: 'No puedes eliminar la única sede del despacho. Cada despacho debe tener al menos una sede.'
        };
      }

      // Eliminar sede (hard delete)
      // Nota: Si prefieres soft delete, cambia esto por un UPDATE con activa = false
      const { error } = await supabase
        .from('sedes')
        .delete()
        .eq('id', sedeId);

      if (error) throw error;

      console.log('✅ Sede eliminada exitosamente');

      // Decrementar contador de sedes en despacho
      await this.decrementarNumSedes(sede.despacho_id);

      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Error al eliminar sede:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Listar todas las sedes de un despacho
   */
  static async listarSedesDespacho(despachoId: string): Promise<{ success: boolean; data?: Sede[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .eq('despacho_id', despachoId)
        .order('id', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data as Sede[]
      };
    } catch (error) {
      console.error('❌ Error al listar sedes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener la sede principal de un despacho
   */
  static async obtenerSedePrincipal(despachoId: string): Promise<{ success: boolean; data?: Sede; error?: string }> {
    try {
      // Nota: El schema actual no tiene campo es_principal
      // Por ahora retornamos la primera sede
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .eq('despacho_id', despachoId)
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Sede
      };
    } catch (error) {
      console.error('❌ Error al obtener sede principal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Validar datos de una sede
   */
  static validarSede(sedeData: SedeInput): ValidationResult {
    const errors: string[] = [];

    // Validar campos requeridos
    if (!sedeData.nombre || sedeData.nombre.trim() === '') {
      errors.push('El nombre de la sede es requerido');
    }

    if (!sedeData.despacho_id) {
      errors.push('El ID del despacho es requerido');
    }

    // Validar formato de email si está presente
    if (sedeData.email_contacto && !this.validarEmail(sedeData.email_contacto)) {
      errors.push('El formato del email es inválido');
    }

    // Validar formato de URL si está presente
    if (sedeData.web && !this.validarURL(sedeData.web)) {
      errors.push('El formato de la URL es inválido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Verificar si es la única sede del despacho
   */
  static async esUnicaSede(despachoId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('sedes')
        .select('id', { count: 'exact', head: true })
        .eq('despacho_id', despachoId);

      if (error) throw error;

      return count === 1;
    } catch (error) {
      console.error('❌ Error al verificar si es única sede:', error);
      return false;
    }
  }

  /**
   * Incrementar contador de sedes en despacho
   */
  private static async incrementarNumSedes(despachoId: string): Promise<void> {
    try {
      // Obtener el valor actual
      const { data: despacho } = await supabase
        .from('despachos')
        .select('num_sedes')
        .eq('id', despachoId)
        .single();

      if (despacho) {
        const nuevoNumSedes = (despacho.num_sedes || 0) + 1;
        await supabase
          .from('despachos')
          .update({ num_sedes: nuevoNumSedes })
          .eq('id', despachoId);
        
        console.log(`✅ Contador de sedes incrementado a ${nuevoNumSedes}`);
      }
    } catch (error) {
      console.error('❌ Error al incrementar num_sedes:', error);
    }
  }

  /**
   * Decrementar contador de sedes en despacho
   */
  private static async decrementarNumSedes(despachoId: string): Promise<void> {
    try {
      // Obtener el valor actual
      const { data: despacho } = await supabase
        .from('despachos')
        .select('num_sedes')
        .eq('id', despachoId)
        .single();

      if (despacho) {
        const nuevoNumSedes = Math.max((despacho.num_sedes || 1) - 1, 1);
        await supabase
          .from('despachos')
          .update({ num_sedes: nuevoNumSedes })
          .eq('id', despachoId);
        
        console.log(`✅ Contador de sedes decrementado a ${nuevoNumSedes}`);
      }
    } catch (error) {
      console.error('❌ Error al decrementar num_sedes:', error);
    }
  }

  /**
   * Convertir sede de Supabase a formato WordPress
   */
  static sedeToWordPress(sede: Sede): SedeWordPress {
    return {
      id: sede.id,
      nombre: sede.nombre,
      descripcion: sede.descripcion || '',
      web: sede.web || '',
      ano_fundacion: sede.ano_fundacion ? String(sede.ano_fundacion) : '',
      tamano_despacho: sede.tamano_despacho || '',
      persona_contacto: sede.persona_contacto || '',
      email_contacto: sede.email_contacto || '',
    };
  }

  /**
   * Validar formato de email
   */
  private static validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar formato de URL
   */
  private static validarURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
