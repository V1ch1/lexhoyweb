# Análisis de Estructura de Datos para Sincronización

## Formato Algolia (Esperado)

```json
{
  "nombre": "string",
  "descripcion": "string",
  "sedes": [
    {
      "id_sede": "string (formato: sede_{objectID}_{index})",
      "es_principal": boolean,
      "activa": boolean,
      "nombre": "string",
      "descripcion": "string",
      "web": "string",
      "ano_fundacion": "string|number",
      "tamano_despacho": "string",
      "persona_contacto": "string",
      "email_contacto": "string",
      "telefono": "string",
      "numero_colegiado": "string",
      "colegio": "string",
      "experiencia": "string",
      "direccion_completa": "string",
      "calle": "string",
      "numero": "string",
      "piso": "string",
      "localidad": "string",
      "provincia": "string",
      "codigo_postal": "string",
      "pais": "string",
      "especialidades": "string",
      "areas_practica": ["string"] | "string (comma-separated)",
      "servicios_especificos": "string",
      "certificaciones": [],
      "estado_verificacion": "string",
      "estado_registro": "string",
      "foto_perfil": "string (URL)",
      "is_verified": boolean | "string (Sí/No)",
      "observaciones": "string",
      "fecha_creacion": "string (datetime)",
      "fecha_actualizacion": "string (datetime)",
      "horarios": {
        "lunes": "string",
        ...
      } | "string",
      "redes_sociales": {
        "facebook": "string",
        ...
      } | "string"
    }
  ],
  "num_sedes": number,
  "sede_principal_id": "string",
  "areas_practica": "string|array",
  "ultima_actualizacion": "string (DD-MM-YYYY)",
  "slug": "string",
  "objectID": "string (wordpress post ID)"
}
```

## Problemas Identificados

1. **`es_principal`**: Algolia espera `boolean`, nosotros enviamos `boolean`
   - Algolia legacy: `"Sí"/"No"` (string)
2. **`activa`**: Algolia espera `boolean`, nosotros enviamos `true`
   - Algolia legacy: `"Sí"/"No"` (string)

3. **`is_verified`**: Algolia espera `boolean`, nosotros enviamos `false`
   - Algolia legacy: `"Sí"/"No"` (string)

4. **`areas_practica`**:
   - Algolia sede: puede ser array o string separado por comas
   - Nosotros: enviamos array
   - Algolia raíz: string vacío o separado por comas

5. **`horarios` y `redes_sociales`**:
   - Algolia: puede ser objeto o string vacío
   - Nosotros: enviamos objeto

6. **`id_sede`**: NO lo estamos generando (formato: `sede_{objectID}_{index}`)

7. **`sede_principal_id`**: NO lo estamos enviando

8. **`fecha_creacion` y `fecha_actualizacion`**: NO los estamos enviando

9. **`ultima_actualizacion`**: Formato DD-MM-YYYY, nosotros no lo enviamos

10. **`ano_fundacion`**: Nosotros usamos `ano_fundacion`, Algolia acepta ambos

## Solución

Crear un transformador que normalice los datos desde Supabase al formato esperado por Algolia/WordPress.
