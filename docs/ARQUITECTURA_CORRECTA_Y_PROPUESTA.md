# ARQUITECTURA REAL Y PROPUESTA CORRECTA

Fecha: 10 de noviembre de 2025

---

## SITUACION ACTUAL REAL

### Como funciona AHORA:

```
WordPress (lexhoy.com)
    |
    | 1. Despachos originales
    | 2. Plugin conectado a Algolia
    |
    v
Algolia (Indice de busqueda)
    ^
    |
    | WordPress actualiza Algolia
    |
WordPress


Next.js (despachos.lexhoy.com)
    |
    | - Importa despachos desde WordPress
    | - Guarda en Supabase
    | - Los cambios SE QUEDAN en Supabase
    | - NO sincroniza de vuelta a WordPress
    | - NO sincroniza a Algolia
    |
    v
Supabase (Base de datos)
```

### Problema Actual:

1. **WordPress** tiene los despachos originales
2. **WordPress** actualiza **Algolia** (via plugin)
3. **Next.js** importa desde WordPress a Supabase
4. **Next.js** modifica datos en Supabase
5. ❌ **Los cambios NO vuelven a WordPress**
6. ❌ **Los cambios NO llegan a Algolia**
7. ❌ **Hay 3 fuentes de verdad diferentes**

---

## TU PREGUNTA CLAVE

> "Yo creo que la fuente de la verdad debe estar en Algolia pero el tema es que los datos pasan por WordPress siempre"

### Analisis de Opciones:

#### OPCION A: Algolia como fuente de verdad
```
Algolia (FUENTE DE VERDAD)
    ^
    |
WordPress + Next.js sincronizan a Algolia
```

**Problemas:**
- ❌ Algolia es un motor de busqueda, no una BD transaccional
- ❌ No tiene relaciones, constraints, triggers
- ❌ No tiene sistema de usuarios/permisos
- ❌ Caro para operaciones de escritura
- ❌ No es ideal para datos estructurados complejos

#### OPCION B: WordPress como fuente de verdad
```
WordPress (FUENTE DE VERDAD)
    |
    +--> Algolia (sincronizacion)
    |
    +--> Next.js (lectura + escritura via API)
```

**Problemas:**
- ❌ WordPress no esta optimizado para aplicaciones modernas
- ❌ API REST de WordPress es lenta
- ❌ Dificil gestionar sedes multiples
- ❌ Menos flexible para nuevas funcionalidades

#### OPCION C: Next.js (Supabase) como fuente de verdad ✅
```
Next.js + Supabase (FUENTE DE VERDAD)
    |
    +--> WordPress (sincronizacion)
    |        |
    |        +--> Algolia (via plugin WP)
    |
    +--> Algolia (sincronizacion directa) [OPCIONAL]
```

**Ventajas:**
- ✅ Supabase: BD PostgreSQL completa
- ✅ Relaciones, constraints, RLS
- ✅ Rapido y moderno
- ✅ Facil agregar nuevas funcionalidades
- ✅ Control total sobre los datos

---

## PROPUESTA RECOMENDADA

### ARQUITECTURA PROPUESTA:

```
                NEXT.JS + SUPABASE
              (FUENTE UNICA DE VERDAD)
                        |
        +---------------+---------------+
        |                               |
        v                               v
    WordPress                       Algolia
    (sincronizacion)            (sincronizacion)
        |
        | Plugin WP actualiza Algolia
        | (mantener como backup)
        v
    Algolia
```

### FLUJO COMPLETO:

#### 1. CREAR/MODIFICAR DESPACHO EN NEXT.JS

```
Usuario modifica despacho en Next.js
    |
    v
Guardar en Supabase ✅
    |
    v
Sincronizar a WordPress (API REST)
    |
    v
WordPress actualiza Algolia (via plugin)
    |
    v
[OPCIONAL] Next.js tambien actualiza Algolia directamente
```

#### 2. MODIFICAR DESPACHO EN WORDPRESS

```
Admin modifica en WordPress
    |
    v
WordPress actualiza Algolia (via plugin)
    |
    v
WordPress envia webhook a Next.js
    |
    v
Next.js actualiza Supabase
```

---

## IMPLEMENTACION PROPUESTA

### FASE 1: Sincronizacion Next.js → WordPress → Algolia

**Objetivo**: Cuando se modifica en Next.js, actualizar WordPress (y este actualiza Algolia)

#### Paso 1: Crear endpoint de sincronizacion

```typescript
// app/api/despachos/[id]/route.ts

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // 1. Actualizar en Supabase
  const { data, error } = await supabase
    .from('despachos')
    .update(cambios)
    .eq('id', params.id);
  
  // 2. Sincronizar a WordPress
  await SyncService.enviarDespachoAWordPress(params.id);
  
  // WordPress automaticamente actualiza Algolia via plugin
  
  return NextResponse.json({ success: true });
}
```

#### Paso 2: Modificar pagina de edicion

```typescript
// app/dashboard/despachos/[slug]/page.tsx

const handleSaveSede = async () => {
  // Guardar en Supabase
  await supabase.from('sedes').update(...)
  
  // Llamar a endpoint que sincroniza
  await fetch(`/api/despachos/${despachoId}/sync`, {
    method: 'POST'
  });
}
```

### FASE 2: [OPCIONAL] Sincronizacion directa a Algolia

Si el plugin de WordPress falla o es lento, podemos sincronizar directamente:

```typescript
// lib/algoliaService.ts

export class AlgoliaService {
  static async sincronizarDespacho(despachoId: string) {
    // 1. Obtener datos de Supabase
    const despacho = await obtenerDespacho(despachoId);
    
    // 2. Formatear para Algolia
    const algoliaObject = {
      objectID: despacho.object_id,
      nombre: despacho.nombre,
      // ... mas campos
    };
    
    // 3. Enviar a Algolia
    await algoliaIndex.saveObject(algoliaObject);
  }
}
```

---

## DECISION: QUE CAMINO TOMAR

### RECOMENDACION: Opcion Hibrida

```
Next.js (Supabase) = FUENTE DE VERDAD
    |
    +--> WordPress (sincronizacion)
    |        |
    |        +--> Algolia (via plugin WP) ✅ Principal
    |
    +--> Algolia (sincronizacion directa) ⚠️ Backup/Redundancia
```

**Por que?**

1. **Mantener plugin de WordPress → Algolia**
   - Ya esta funcionando
   - Probado y estable
   - WordPress sigue siendo util para contenido

2. **Agregar sincronizacion directa Next.js → Algolia**
   - Como backup si WordPress falla
   - Mas rapido (no pasa por WordPress)
   - Mas control

3. **Next.js como fuente de verdad**
   - Mejor para aplicacion moderna
   - Mas flexible
   - Mejor rendimiento

---

## PLAN DE IMPLEMENTACION

### SEMANA 1: Sincronizacion Next.js → WordPress

- [ ] Crear endpoint /api/despachos/[id]/sync
- [ ] Modificar paginas de edicion para llamar sync
- [ ] Probar que WordPress recibe cambios
- [ ] Verificar que Algolia se actualiza via plugin WP

### SEMANA 2: Sincronizacion directa Next.js → Algolia (Backup)

- [ ] Crear lib/algoliaService.ts
- [ ] Implementar sincronizacion directa
- [ ] Agregar como fallback si WordPress falla
- [ ] Monitoreo y logs

### SEMANA 3: Sistema de Leads

- [ ] Implementar captura de formularios
- [ ] Procesamiento con IA
- [ ] Marketplace

---

## RESPUESTA A TU PREGUNTA

> "Ahora mismo pasan por WordPress y luego se van a Algolia, aunque no se si me recomiendas hacerlo de otra manera"

**MI RECOMENDACION:**

1. **Mantener el flujo WordPress → Algolia** (via plugin)
   - Es estable y funciona
   - No romper lo que funciona

2. **Agregar Next.js → WordPress** (sincronizacion)
   - Para que cambios en Next.js lleguen a WordPress
   - Y de ahi a Algolia via plugin

3. **Agregar Next.js → Algolia directo** (opcional/backup)
   - Como redundancia
   - Si WordPress falla
   - Mas rapido

**FLUJO FINAL:**

```
Usuario edita en Next.js
    |
    v
Guardar en Supabase (FUENTE DE VERDAD)
    |
    +----> WordPress (sincronizacion)
    |          |
    |          v
    |      Algolia (via plugin WP)
    |
    +----> Algolia (sincronizacion directa como backup)
```

---

## VENTAJAS DE ESTA ARQUITECTURA

1. **Supabase es la fuente de verdad**
   - Control total
   - Rapido
   - Flexible

2. **WordPress sigue funcionando**
   - No romper lo existente
   - Plugin de Algolia sigue activo
   - Contenido del blog intacto

3. **Algolia siempre actualizado**
   - Via WordPress (principal)
   - Via Next.js (backup)
   - Doble garantia

4. **Facil agregar funcionalidades**
   - Sistema de leads
   - Marketplace
   - Analytics
   - Todo en Next.js/Supabase

---

## PROXIMOS PASOS

1. **Confirmar esta arquitectura contigo**
2. **Implementar sincronizacion Next.js → WordPress**
3. **Probar que Algolia se actualiza**
4. **Agregar sincronizacion directa a Algolia (opcional)**
5. **Implementar sistema de leads**

---

Ultima actualizacion: 10 de noviembre de 2025
