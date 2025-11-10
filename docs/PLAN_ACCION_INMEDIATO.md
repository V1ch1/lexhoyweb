# PLAN DE ACCION INMEDIATO - PASO A PASO

Fecha: 10 de noviembre de 2025

---

## RESUMEN DE LA SITUACION

**Problema**: Los cambios en Next.js NO se sincronizan a WordPress ni a Algolia

**Solucion**: Implementar sincronizacion automatica Next.js → WordPress → Algolia

---

## FASE 1: SINCRONIZACION NEXT.JS → WORDPRESS (PRIORIDAD MAXIMA)

### TAREA 1.1: Crear endpoint de sincronizacion automatica
**Tiempo**: 2-3 horas

**Archivo**: `app/api/despachos/[id]/sync/route.ts`

```typescript
// app/api/despachos/[id]/sync/route.ts
import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/syncService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const despachoId = params.id;
    
    console.log('🔄 Iniciando sincronizacion para despacho:', despachoId);
    
    // 1. Sincronizar a WordPress
    const wpResult = await SyncService.enviarDespachoAWordPress(despachoId);
    
    if (!wpResult.success) {
      console.error('❌ Error al sincronizar con WordPress:', wpResult.error);
      
      // Guardar en cola para reintentar
      await supabase.from('sync_queue').insert({
        tipo: 'wordpress',
        despacho_id: despachoId,
        accion: 'update',
        estado: 'fallido',
        ultimo_error: wpResult.error
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al sincronizar con WordPress',
          details: wpResult.error
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Sincronizacion exitosa con WordPress');
    console.log('📝 Object ID:', wpResult.objectId);
    
    // 2. Actualizar estado de sincronizacion en Supabase
    await supabase
      .from('despachos')
      .update({
        sincronizado_wp: true,
        ultima_sincronizacion: new Date().toISOString()
      })
      .eq('id', despachoId);
    
    return NextResponse.json({
      success: true,
      message: 'Despacho sincronizado correctamente',
      objectId: wpResult.objectId
    });
    
  } catch (error) {
    console.error('❌ Error en sincronizacion:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}
```

---

### TAREA 1.2: Modificar pagina de edicion de despachos
**Tiempo**: 1-2 horas

**Archivo**: `app/dashboard/despachos/[slug]/page.tsx`

Buscar la funcion `handleSaveSede` y agregar sincronizacion:

```typescript
const handleSaveSede = async () => {
  if (!editedSede || !despacho) return;

  try {
    setSavingSede(true);
    setFormError(null);

    // 1. Guardar en Supabase
    const { error: updateError } = await supabase
      .from('sedes')
      .update({
        nombre: editedSede.nombre || 'Sede',
        descripcion: editedSede.descripcion || '',
        telefono: editedSede.telefono || '',
        email_contacto: editedSede.email_contacto || '',
        // ... resto de campos
      })
      .eq('id', editedSede.id);

    if (updateError) {
      throw updateError;
    }

    // 2. NUEVO: Sincronizar con WordPress
    console.log('🔄 Sincronizando con WordPress...');
    
    const syncResponse = await fetch(`/api/despachos/${despacho.id}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const syncResult = await syncResponse.json();
    
    if (!syncResult.success) {
      console.warn('⚠️ Advertencia: No se pudo sincronizar con WordPress');
      console.warn('Los cambios se guardaron en la base de datos pero no en WordPress');
      // No lanzar error, solo advertir
    } else {
      console.log('✅ Sincronizado con WordPress correctamente');
    }

    setSuccess(true);
    setIsEditing(false);
    
    // Recargar datos
    await fetchDespacho();
    
    setTimeout(() => setSuccess(false), 3000);
    
  } catch (error) {
    console.error('Error al guardar la sede:', error);
    setError('Error al guardar los cambios');
  } finally {
    setSavingSede(false);
  }
};
```

---

### TAREA 1.3: Agregar indicador de sincronizacion en UI
**Tiempo**: 1 hora

Agregar en la interfaz un indicador que muestre si el despacho esta sincronizado:

```typescript
// En el componente de despacho
const [syncStatus, setSyncStatus] = useState<{
  wordpress: boolean;
  lastSync: string | null;
}>({
  wordpress: false,
  lastSync: null
});

// Al cargar el despacho
useEffect(() => {
  if (despacho) {
    setSyncStatus({
      wordpress: despacho.sincronizado_wp || false,
      lastSync: despacho.ultima_sincronizacion || null
    });
  }
}, [despacho]);

// En el JSX, agregar badge de estado
<div className="flex items-center gap-2">
  <h1>{despacho.nombre}</h1>
  
  {syncStatus.wordpress ? (
    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
      ✅ Sincronizado
    </span>
  ) : (
    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
      ⚠️ Pendiente sincronizar
    </span>
  )}
  
  {syncStatus.lastSync && (
    <span className="text-xs text-gray-500">
      Última sync: {new Date(syncStatus.lastSync).toLocaleString()}
    </span>
  )}
</div>
```

---

### TAREA 1.4: Crear tabla de cola de sincronizacion
**Tiempo**: 30 minutos

**Archivo**: `supabase/migrations/20251110_create_sync_queue.sql`

```sql
-- Tabla para cola de sincronizacion
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tipo de sincronizacion
  tipo TEXT NOT NULL CHECK (tipo IN ('wordpress', 'algolia')),
  
  -- Referencia al despacho
  despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE,
  object_id TEXT,
  
  -- Accion a realizar
  accion TEXT NOT NULL CHECK (accion IN ('create', 'update', 'delete')),
  
  -- Payload de datos
  payload JSONB,
  
  -- Control de reintentos
  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  
  -- Estado
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente',
    'procesando',
    'completado',
    'fallido'
  )),
  
  -- Error tracking
  ultimo_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  procesado_at TIMESTAMPTZ,
  proximo_intento_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX idx_sync_queue_estado ON sync_queue(estado);
CREATE INDEX idx_sync_queue_tipo ON sync_queue(tipo);
CREATE INDEX idx_sync_queue_despacho ON sync_queue(despacho_id);
CREATE INDEX idx_sync_queue_proximo_intento ON sync_queue(proximo_intento_at) 
  WHERE estado = 'pendiente';

-- Trigger para updated_at
CREATE TRIGGER update_sync_queue_updated_at
  BEFORE UPDATE ON sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Comentarios
COMMENT ON TABLE sync_queue IS 'Cola de sincronizacion para WordPress y Algolia';
COMMENT ON COLUMN sync_queue.tipo IS 'Destino de sincronizacion: wordpress o algolia';
COMMENT ON COLUMN sync_queue.intentos IS 'Numero de intentos realizados';
COMMENT ON COLUMN sync_queue.proximo_intento_at IS 'Cuando reintentar (exponential backoff)';
```

Ejecutar migracion:
```bash
# Desde Supabase Dashboard o CLI
supabase migration up
```

---

### TAREA 1.5: Crear servicio de cola de sincronizacion
**Tiempo**: 2-3 horas

**Archivo**: `lib/syncQueue.ts`

```typescript
// lib/syncQueue.ts
import { createClient } from '@supabase/supabase-js';
import { SyncService } from './syncService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SyncQueue {
  /**
   * Agregar tarea a la cola
   */
  static async encolar(
    tipo: 'wordpress' | 'algolia',
    despachoId: string,
    accion: 'create' | 'update' | 'delete',
    payload?: any
  ) {
    try {
      const { data, error } = await supabase
        .from('sync_queue')
        .insert({
          tipo,
          despacho_id: despachoId,
          accion,
          payload: payload || {},
          estado: 'pendiente',
          proximo_intento_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('📥 Tarea encolada:', data.id);
      return { success: true, taskId: data.id };
      
    } catch (error) {
      console.error('❌ Error al encolar tarea:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Procesar cola de sincronizacion
   */
  static async procesarCola() {
    try {
      console.log('🔄 Procesando cola de sincronizacion...');

      // Obtener tareas pendientes
      const { data: tareas, error } = await supabase
        .from('sync_queue')
        .select('*')
        .eq('estado', 'pendiente')
        .lte('proximo_intento_at', new Date().toISOString())
        .lt('intentos', 3) // Max 3 intentos
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      if (!tareas || tareas.length === 0) {
        console.log('✅ No hay tareas pendientes');
        return { success: true, procesadas: 0 };
      }

      console.log(`📋 Procesando ${tareas.length} tarea(s)...`);

      let procesadas = 0;
      let fallidas = 0;

      for (const tarea of tareas) {
        const resultado = await this.procesarTarea(tarea);
        if (resultado.success) {
          procesadas++;
        } else {
          fallidas++;
        }
      }

      console.log(`✅ Procesadas: ${procesadas}, Fallidas: ${fallidas}`);

      return { 
        success: true, 
        procesadas, 
        fallidas 
      };
      
    } catch (error) {
      console.error('❌ Error al procesar cola:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Procesar una tarea individual
   */
  private static async procesarTarea(tarea: any) {
    try {
      // Marcar como procesando
      await supabase
        .from('sync_queue')
        .update({ 
          estado: 'procesando',
          intentos: tarea.intentos + 1
        })
        .eq('id', tarea.id);

      let resultado;

      // Ejecutar segun tipo
      if (tarea.tipo === 'wordpress') {
        resultado = await SyncService.enviarDespachoAWordPress(tarea.despacho_id);
      } else if (tarea.tipo === 'algolia') {
        // TODO: Implementar cuando tengamos AlgoliaService
        resultado = { success: true };
      }

      if (resultado.success) {
        // Marcar como completado
        await supabase
          .from('sync_queue')
          .update({ 
            estado: 'completado',
            procesado_at: new Date().toISOString()
          })
          .eq('id', tarea.id);

        console.log(`✅ Tarea ${tarea.id} completada`);
        return { success: true };
        
      } else {
        // Calcular proximo intento (exponential backoff)
        const proximoIntento = new Date();
        proximoIntento.setMinutes(
          proximoIntento.getMinutes() + Math.pow(2, tarea.intentos)
        );

        // Si ya agotamos intentos, marcar como fallido
        const nuevoEstado = tarea.intentos >= 2 ? 'fallido' : 'pendiente';

        await supabase
          .from('sync_queue')
          .update({ 
            estado: nuevoEstado,
            ultimo_error: resultado.error,
            proximo_intento_at: proximoIntento.toISOString()
          })
          .eq('id', tarea.id);

        console.warn(`⚠️ Tarea ${tarea.id} fallo (intento ${tarea.intentos + 1}/3)`);
        return { success: false, error: resultado.error };
      }
      
    } catch (error) {
      console.error(`❌ Error al procesar tarea ${tarea.id}:`, error);
      
      // Marcar como fallido
      await supabase
        .from('sync_queue')
        .update({ 
          estado: 'fallido',
          ultimo_error: error instanceof Error ? error.message : 'Error desconocido'
        })
        .eq('id', tarea.id);

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Obtener estadisticas de la cola
   */
  static async obtenerEstadisticas() {
    try {
      const { data, error } = await supabase
        .from('sync_queue')
        .select('estado, tipo')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        pendientes: data.filter(t => t.estado === 'pendiente').length,
        procesando: data.filter(t => t.estado === 'procesando').length,
        completados: data.filter(t => t.estado === 'completado').length,
        fallidos: data.filter(t => t.estado === 'fallido').length,
        porTipo: {
          wordpress: data.filter(t => t.tipo === 'wordpress').length,
          algolia: data.filter(t => t.tipo === 'algolia').length
        }
      };

      return { success: true, stats };
      
    } catch (error) {
      console.error('❌ Error al obtener estadisticas:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Reintentar tareas fallidas manualmente
   */
  static async reintentarFallidos() {
    try {
      const { error } = await supabase
        .from('sync_queue')
        .update({ 
          estado: 'pendiente',
          intentos: 0,
          proximo_intento_at: new Date().toISOString()
        })
        .eq('estado', 'fallido');

      if (error) throw error;

      console.log('✅ Tareas fallidas marcadas para reintento');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error al reintentar fallidos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }
}
```

---

### TAREA 1.6: Crear endpoint para procesar cola
**Tiempo**: 30 minutos

**Archivo**: `app/api/admin/sync-queue/process/route.ts`

```typescript
// app/api/admin/sync-queue/process/route.ts
import { NextResponse } from 'next/server';
import { SyncQueue } from '@/lib/syncQueue';

export async function POST(request: Request) {
  try {
    console.log('🔄 Procesando cola de sincronizacion...');
    
    const resultado = await SyncQueue.procesarCola();
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}
```

---

### TAREA 1.7: Crear cron job para procesar cola automaticamente
**Tiempo**: 1 hora

**Opcion A: Vercel Cron (si estas en Vercel)**

Crear archivo `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/admin/sync-queue/process",
    "schedule": "*/5 * * * *"
  }]
}
```

**Opcion B: Endpoint manual + cron externo**

Usar un servicio como cron-job.org para llamar al endpoint cada 5 minutos.

---

## TESTING Y VERIFICACION

### Test 1: Editar sede y verificar sincronizacion

1. Ir a `/dashboard/despachos/[slug]`
2. Editar una sede (cambiar telefono, email, etc)
3. Guardar cambios
4. Verificar en consola: "✅ Sincronizado con WordPress correctamente"
5. Ir a WordPress admin y verificar que los cambios estan ahi
6. Verificar en Algolia que los cambios se reflejaron

### Test 2: Verificar cola de sincronizacion

```sql
-- Ver tareas en cola
SELECT * FROM sync_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver estadisticas
SELECT estado, COUNT(*) 
FROM sync_queue 
GROUP BY estado;
```

### Test 3: Forzar error y verificar reintento

1. Desconectar WordPress temporalmente (cambiar credenciales)
2. Editar un despacho
3. Verificar que se crea tarea en cola con estado 'fallido'
4. Restaurar credenciales
5. Llamar a `/api/admin/sync-queue/process`
6. Verificar que la tarea se procesa correctamente

---

## PROXIMOS PASOS DESPUES DE FASE 1

Una vez completada la sincronizacion Next.js → WordPress:

1. **Verificar que Algolia se actualiza via plugin de WordPress**
2. **[OPCIONAL] Agregar sincronizacion directa Next.js → Algolia**
3. **Implementar sistema de Leads con IA**

---

## CHECKLIST DE IMPLEMENTACION

- [ ] Tarea 1.1: Crear endpoint /api/despachos/[id]/sync
- [ ] Tarea 1.2: Modificar pagina de edicion
- [ ] Tarea 1.3: Agregar indicador de sincronizacion en UI
- [ ] Tarea 1.4: Crear tabla sync_queue
- [ ] Tarea 1.5: Crear lib/syncQueue.ts
- [ ] Tarea 1.6: Crear endpoint para procesar cola
- [ ] Tarea 1.7: Configurar cron job
- [ ] Test 1: Editar y verificar
- [ ] Test 2: Verificar cola
- [ ] Test 3: Verificar reintentos

---

Ultima actualizacion: 10 de noviembre de 2025
