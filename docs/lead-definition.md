# Definición de Lead - Estructura de Datos

## 🎯 ¿Qué es un Lead?

Un **Lead** es una consulta legal potencial de un cliente que busca servicios jurídicos. Cada lead representa una oportunidad de negocio para los despachos de abogados.

## 📋 Campos Obligatorios

### Datos del Cliente (Siempre Requeridos)
- **nombre** (string): Nombre completo del cliente
- **correo** (string): Email de contacto
- **cuerpo_mensaje** (text): Descripción de la consulta legal

### Datos Generados Automáticamente
- **id** (uuid): Identificador único
- **created_at** (timestamp): Fecha de creación
- **updated_at** (timestamp): Última actualización
- **estado** (enum): Estado actual del lead
  - `pendiente`: Recibido pero no procesado
  - `procesado`: Analizado y listo para venta
  - `en_subasta`: En proceso de subasta
  - `vendido`: Comprado por un despacho
  - `expirado`: Subasta finalizada sin comprador
  - `descartado`: Rechazado por baja calidad

## 📊 Campos Opcionales

### Contacto Adicional
- **telefono** (string): Número de teléfono del cliente

### Clasificación (Generada por IA o Manual)
- **especialidad** (string): Área legal (Civil, Penal, Laboral, etc.)
- **provincia** (string): Provincia del cliente
- **ciudad** (string): Ciudad específica
- **urgencia** (enum): Nivel de urgencia
  - `baja`
  - `media`
  - `alta`
  - `urgente`

### Análisis de IA
- **resumen_ia** (text): Resumen anónimo generado por IA
- **palabras_clave** (array): Palabras clave extraídas
- **puntuacion_calidad** (integer 0-100): Calidad del lead según IA
- **nivel_detalle** (enum): Nivel de información proporcionada
  - `bajo`
  - `medio`
  - `alto`
- **procesado_at** (timestamp): Cuándo fue procesado por IA

### Pricing
- **precio_estimado** (decimal): Precio sugerido por IA
- **precio_base** (decimal): Precio mínimo para subasta (aprobado por admin)
- **precio_venta_directa** (decimal): Precio fijo para compra inmediata
- **precio_actual** (decimal): Precio actual en subasta (con pujas)
- **precio_venta** (decimal): Precio final de venta

### Subasta
- **fecha_inicio_subasta** (timestamp): Inicio de la subasta
- **fecha_fin_subasta** (timestamp): Fin de la subasta

### Venta
- **comprador_id** (uuid): ID del despacho que compró
- **fecha_venta** (timestamp): Cuándo se vendió

### Trazabilidad
- **fuente** (string): Origen del lead (lexhoy.com, manual, etc.)
- **url_pagina** (string): URL de donde vino
- **titulo_post** (string): Título del artículo/página
- **utm_source**, **utm_medium**, **utm_campaign**: Parámetros de tracking
- **aprobado_por** (uuid): ID del admin que aprobó
- **fecha_aprobacion** (timestamp): Cuándo se aprobó
- **acepta_terminos** (boolean): Aceptó términos y condiciones
- **acepta_privacidad** (boolean): Aceptó política de privacidad

## 🔄 Ciclo de Vida de un Lead

```
1. RECEPCIÓN
   ↓
   [pendiente] - Lead recibido desde WordPress o creado manualmente
   ↓
2. PROCESAMIENTO IA (opcional)
   ↓
   [procesado] - IA analiza y genera resumen + clasificación
   ↓
3. APROBACIÓN ADMIN
   ↓
   Admin revisa y aprueba precio
   ↓
4. PUBLICACIÓN
   ├─→ [procesado] - Compra directa disponible
   └─→ [en_subasta] - Subasta activa
   ↓
5. VENTA
   ↓
   [vendido] - Despacho compra el lead
```

## ⚠️ Reglas de Negocio

### Calidad Mínima
- Un lead debe tener `puntuacion_calidad >= 40` para ser publicado
- Leads con calidad < 40 se marcan como `descartado`

### Pricing
- `precio_base` es el precio mínimo para subastas
- `precio_venta_directa` debe ser mayor que `precio_base`
- Si no hay `precio_venta_directa`, solo se permite subasta

### Privacidad
- Datos personales (nombre, email, teléfono, mensaje) solo visibles después de compra
- Antes de compra, solo se muestra `resumen_ia` (anónimo)

### Estados Finales
- `vendido`: Lead comprado, no se puede volver a vender
- `descartado`: Lead rechazado, no se publica
- `expirado`: Subasta terminada sin comprador

## 📝 Ejemplo de Lead Completo

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nombre": "María García López",
  "correo": "maria.garcia@example.com",
  "telefono": "+34 612 345 678",
  "cuerpo_mensaje": "Necesito ayuda con un divorcio contencioso...",
  "especialidad": "Familia",
  "provincia": "Madrid",
  "ciudad": "Madrid",
  "urgencia": "alta",
  "resumen_ia": "Cliente busca asesoramiento para divorcio contencioso con custodia de menores...",
  "palabras_clave": ["divorcio", "custodia", "menores"],
  "puntuacion_calidad": 85,
  "nivel_detalle": "alto",
  "precio_estimado": 75.00,
  "precio_base": 70.00,
  "precio_venta_directa": 90.00,
  "estado": "procesado",
  "fuente": "lexhoy.com",
  "url_pagina": "https://lexhoy.com/abogado-familia-madrid",
  "titulo_post": "Abogado de Familia en Madrid",
  "created_at": "2025-11-28T10:00:00Z",
  "procesado_at": "2025-11-28T10:00:05Z"
}
```
