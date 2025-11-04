# 📊 SCHEMA REAL de la Tabla `sedes`

> **Basado en**: JSON real de producción  
> **Fecha**: 2025-11-04

---

## ✅ CAMPOS QUE SÍ EXISTEN

Estos son los campos que **realmente existen** en tu tabla `sedes` según el JSON de producción:

```typescript
interface SedeReal {
  // IDs
  idx: number;
  id: string; // UUID
  despacho_id: string; // UUID
  wp_sede_id: number | null;
  
  // Básicos
  nombre: string;
  descripcion: string;
  
  // Ubicación
  calle: string;
  numero: string;
  piso: string;
  localidad: string;
  provincia: string;
  codigo_postal: string;
  pais: string;
  direccion: object; // JSONB con estructura completa
  
  // Contacto
  telefono: string;
  email_contacto: string;
  persona_contacto: string;
  web: string;
  
  // Profesional
  numero_colegiado: string;
  colegio: string;
  experiencia: string;
  areas_practica: string[]; // Array
  especialidades: string;
  servicios_especificos: string;
  
  // Adicional
  ano_fundacion: number;
  tamano_despacho: string;
  
  // Estado
  es_principal: boolean;
  activa: boolean;
  estado_verificacion: string; // 'verificado', 'pendiente'
  estado_registro: string; // 'activo'
  is_verified: boolean;
  
  // Multimedia
  foto_perfil: string; // URL
  
  // Datos estructurados (JSONB)
  horarios: object;
  redes_sociales: object;
  observaciones: string;
  
  // Auditoría
  created_at: string; // timestamp
  updated_at: string; // timestamp
}
```

---

## ❌ CAMPOS QUE NO EXISTEN

Estos campos **NO existen** en la tabla actual:

- ❌ `sincronizado_wp` - **NO EXISTE** (causaba error 400)
- ❌ `logo` - No está en el JSON
- ❌ `email` - Se llama `email_contacto`

---

## 📋 EJEMPLO REAL

```json
{
  "idx": 4,
  "id": "8dbe36f8-7932-4dd6-84ba-1cb73dcc8873",
  "despacho_id": "478adb79-744f-4f34-90ff-baebd36eab61",
  "wp_sede_id": null,
  "nombre": "Sede A Coruña",
  "descripcion": "Capital humano y tecnología...",
  "web": "https://www.vento.es",
  "telefono": "981 25 22 58",
  "numero_colegiado": "",
  "colegio": "",
  "experiencia": "",
  "es_principal": true,
  "activa": true,
  "foto_perfil": "https://lexhoy.com/wp-content/uploads/2025/07/Logo-Vento.png",
  "horarios": {
    "lunes": "",
    "martes": "",
    "miercoles": "",
    "jueves": "",
    "viernes": "",
    "sabado": "",
    "domingo": ""
  },
  "redes_sociales": {
    "twitter": "",
    "facebook": "https://www.facebook.com/p/Vento-Abogados-Asesores...",
    "linkedin": "https://www.linkedin.com/company/vento-abogados...",
    "instagram": ""
  },
  "observaciones": "",
  "created_at": "2025-10-31 20:04:43.574+00",
  "updated_at": "2025-10-31 20:04:43.574+00",
  "ano_fundacion": 2016,
  "persona_contacto": "Tomás Dapena Carabel",
  "email_contacto": "vento@vento.es",
  "estado_verificacion": "verificado",
  "estado_registro": "activo",
  "is_verified": true,
  "direccion": {
    "pais": "España",
    "piso": "4º",
    "calle": "C/ Fonseca",
    "numero": "6",
    "localidad": "A Coruña",
    "provincia": "A Coruña",
    "codigo_postal": "15004"
  },
  "localidad": "A Coruña",
  "provincia": "A Coruña",
  "codigo_postal": "15004",
  "tamano_despacho": "",
  "calle": "C/ Fonseca",
  "numero": "6",
  "piso": "4º",
  "pais": "España",
  "especialidades": "",
  "servicios_especificos": "",
  "areas_practica": [
    "Administrativo",
    "Bancario",
    "Civil",
    "Comercial",
    "Concursal",
    "Consumo",
    "Empresarial",
    "Familia",
    "Fiscal",
    "Inmobiliario",
    "Laboral",
    "Mercantil",
    "Penal",
    "Propiedad Intelectual",
    "Protección de Datos",
    "Salud",
    "Seguros",
    "Sucesiones",
    "Tráfico",
    "Urbanismo",
    "Vivienda"
  ]
}
```

---

## 🔧 CAMPOS OBLIGATORIOS (según tu validación)

Basándome en tu código y el schema real:

### Obligatorios para INSERT:
- ✅ `despacho_id` (UUID, FK)
- ✅ `nombre` (string)
- ✅ `localidad` (string)
- ✅ `provincia` (string)
- ✅ `telefono` (string)
- ✅ `email_contacto` (string)

### Con valores por defecto:
- `es_principal` → `false`
- `activa` → `true`
- `pais` → `'España'`
- `descripcion` → `''`
- `areas_practica` → `[]`
- `horarios` → `{}`
- `redes_sociales` → `{}`

---

## 📝 NOTAS IMPORTANTES

1. **Campo `direccion`**: Es un JSONB que contiene la dirección completa estructurada
2. **Campos duplicados**: `localidad`, `provincia`, `calle`, etc. existen tanto en el objeto `direccion` como campos individuales
3. **Estado de verificación**: Usa `estado_verificacion` y `is_verified` (no `sincronizado_wp`)
4. **Timestamps**: `created_at` y `updated_at` se gestionan automáticamente

---

## ✅ VALIDACIÓN CORRECTA

Para evitar errores 400, asegúrate de:

```typescript
// ✅ CORRECTO
const sedeData = {
  despacho_id: 'uuid',
  nombre: 'Sede Madrid',
  localidad: 'Madrid',
  provincia: 'Madrid',
  telefono: '912345678',
  email_contacto: 'madrid@ejemplo.com',
  // ... resto de campos opcionales
};

// ❌ INCORRECTO (causará error 400)
const sedeData = {
  despacho_id: 'uuid',
  nombre: 'Sede Madrid',
  sincronizado_wp: false, // ❌ Este campo NO EXISTE
  // ... faltando campos obligatorios
};
```

---

**Última actualización**: 2025-11-04  
**Estado**: ✅ Verificado con datos de producción
