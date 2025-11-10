# ANALISIS COMPLETO DEL PROYECTO LEXHOY

Fecha: 10 de noviembre de 2025

---

## RESUMEN DEL ECOSISTEMA

### 1. LEXHOY.COM (WordPress)
- Portal de noticias juridicas
- +10,000 despachos de abogados
- Formularios de contacto en cada entrada
- Conectado con Algolia para busqueda

### 2. DESPACHOS.LEXHOY.COM (Next.js + Supabase)
- Portal para que despachos gestionen sus datos
- Importacion desde WordPress
- Gestion de sedes multiples
- Sistema de usuarios y roles
- Sincronizacion bidireccional con WordPress

### 3. ALGOLIA
- Motor de busqueda
- Indice con +10,000 despachos
- Usado en plugin de WordPress
- Busqueda optimizada

---

## ARQUITECTURA ACTUAL

```
                    FUENTE DE VERDAD
                         ???
                          |
        +-----------------+-----------------+
        |                 |                 |
   WordPress         Next.js            Algolia
   (lexhoy.com)   (despachos.lexhoy.com)  (busqueda)
        |                 |                 |
        |                 |                 |
    Formularios -----> Supabase <------ Sincronizacion
    de contacto         (BD)
```

---

## PROBLEMA PRINCIPAL

NO HAY UNA UNICA FUENTE DE LA VERDAD CLARA

Actualmente:
- WordPress tiene los despachos originales
- Next.js importa desde WordPress
- Algolia se alimenta de WordPress
- Los cambios en Next.js van a WordPress
- Pero Algolia no se actualiza desde Next.js

---

## SOLUCION PROPUESTA

ESTABLECER NEXT.JS COMO FUENTE UNICA DE VERDAD

```
                 NEXT.JS (Supabase)
                 FUENTE DE VERDAD
                         |
        +----------------+----------------+
        |                                 |
    WordPress                          Algolia
    (sincronizacion)                (sincronizacion)
        |                                 |
    Formularios                       Busqueda
```

Flujo:
1. Despachos se gestionan en Next.js
2. Cambios se sincronizan a WordPress
3. Cambios se sincronizan a Algolia
4. WordPress envia formularios a Next.js
5. Next.js procesa leads con IA

---

## ESTADO ACTUAL - LO QUE FUNCIONA

### Sistema de Usuarios
- Registro con Supabase
- Roles: super_admin, despacho_admin, usuario
- Aprobacion de usuarios
- Notificaciones

### Gestion de Despachos
- Importacion desde WordPress
- CRUD completo
- Gestion de multiples sedes
- Solicitud de propiedad
- Aprobacion por admin

### Sincronizacion
- WordPress a Next.js (webhook)
- Next.js a WordPress (API REST)
- Importacion de sedes

### Servicios
- userService.ts
- despachoService.ts
- sedeService.ts
- syncService.ts
- notificationService.ts
- emailService.ts

---

## LO QUE FALTA - CRITICO

### 1. SINCRONIZACION CON ALGOLIA

Actualmente Algolia NO se actualiza desde Next.js

Necesario:
- Crear lib/algoliaService.ts
- Sincronizar al crear despacho
- Sincronizar al actualizar despacho
- Sincronizar al eliminar despacho
- Cola de reintentos

Variables necesarias:
```
NEXT_PUBLIC_ALGOLIA_APP_ID
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
ALGOLIA_ADMIN_KEY
```

### 2. SISTEMA DE LEADS CON IA

Objetivo: Monetizar las consultas de lexhoy.com

Flujo completo:
1. Usuario llena formulario en entrada de blog
2. Formulario envia a /api/leads/capturar
3. IA (OpenAI) procesa la consulta:
   - Genera resumen SIN datos personales
   - Detecta especialidad juridica
   - Evalua urgencia (baja/media/alta/urgente)
   - Evalua complejidad (baja/media/alta)
   - Sugiere precio (50-500 euros)
4. Se guarda en BD con estado "pendiente"
5. Super admin recibe notificacion
6. Admin revisa:
   - Lee resumen anonimo
   - Verifica precio sugerido
   - Puede ajustar precio
   - Aprueba o rechaza
7. Si aprueba, lead pasa a "publicado"
8. Lead aparece en marketplace para despachos
9. Despachos ven:
   - Resumen anonimo
   - Especialidad
   - Localizacion (ciudad, provincia)
   - Urgencia y complejidad
   - Precio
10. Despacho compra lead
11. Tras compra, se revelan datos:
    - Nombre completo
    - Email
    - Telefono
    - Consulta original completa

Componentes necesarios:

Base de datos:
- leads_marketplace (leads para vender)
- leads_compras (registro de compras)
- leads_interacciones (seguimiento)

Servicios:
- lib/leadAIService.ts (OpenAI)
- lib/leadService.ts (logica de negocio)

APIs:
- /api/leads/capturar (recibir formularios)
- /api/admin/leads/aprobar
- /api/admin/leads/rechazar
- /api/leads/marketplace (listar publicados)
- /api/leads/comprar

Paginas:
- /admin/leads/pendientes (aprobar)
- /dashboard/leads/marketplace (comprar)
- /dashboard/leads/comprados (ver comprados)

---

## ESTRUCTURA DE DATOS LEADS

### Tabla: leads_marketplace

Campos publicos (visibles antes de comprar):
- resumen_anonimo (generado por IA)
- especialidad
- urgencia
- complejidad
- provincia
- ciudad
- precio_final

Campos privados (solo tras comprar):
- nombre_completo
- email
- telefono
- consulta (texto original completo)

Estados:
- pendiente: esperando revision admin
- aprobado: admin aprobo pero no publicado
- publicado: visible en marketplace
- vendido: ya comprado
- rechazado: admin rechazo

### Tabla: leads_compras

Registro de cada compra:
- lead_id
- despacho_id
- user_id
- precio_pagado
- metodo_pago
- estado_pago
- datos_cliente (JSON con nombre, email, telefono)
- created_at
- revelado_at

---

## INTEGRACION CON WORDPRESS

### Formularios en Entradas de Blog

Cada entrada de lexhoy.com tiene un formulario.

El formulario debe enviar a:
```
POST https://despachos.lexhoy.com/api/leads/capturar
```

Payload:
```json
{
  "nombre": "Juan Perez",
  "email": "juan@example.com",
  "telefono": "666123456",
  "consulta": "Necesito ayuda con...",
  "provincia": "Madrid",
  "ciudad": "Madrid",
  "url_origen": "https://lexhoy.com/entrada-blog-123",
  "entrada_blog_id": 123
}
```

Respuesta:
```json
{
  "success": true,
  "leadId": "uuid",
  "message": "Consulta recibida. Te contactaremos pronto."
}
```

---

## PROCESAMIENTO CON IA

### OpenAI GPT-4

Prompt para procesar lead:
```
Eres un asistente especializado en analisis de consultas legales.

Analiza la siguiente consulta y proporciona:
1. Un resumen anonimo (SIN nombres, emails, telefonos)
2. La especialidad juridica principal
3. El nivel de urgencia (baja/media/alta/urgente)
4. La complejidad del caso (baja/media/alta)
5. Un precio sugerido en euros (entre 50 y 500)

Consulta:
"[TEXTO DE LA CONSULTA]"

Localizacion: [CIUDAD], [PROVINCIA]

Responde en formato JSON.
```

Respuesta esperada:
```json
{
  "resumen_anonimo": "Cliente busca asesoramiento sobre...",
  "especialidad": "Derecho Civil",
  "urgencia": "alta",
  "complejidad": "media",
  "precio_sugerido": 150,
  "justificacion_precio": "Caso de complejidad media...",
  "palabras_clave": ["divorcio", "custodia", "pension"]
}
```

### Validacion de Anonimizacion

Verificar que el resumen NO contenga:
- Emails (regex)
- Telefonos (regex)
- Nombres propios (regex)

Si detecta datos personales, reintentar con prompt mas estricto.

---

## VARIABLES DE ENTORNO

### Actuales (configuradas)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WORDPRESS_API_URL
WORDPRESS_USERNAME
WORDPRESS_APPLICATION_PASSWORD
RESEND_API_KEY
```

### Nuevas (a configurar)
```
NEXT_PUBLIC_ALGOLIA_APP_ID
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
ALGOLIA_ADMIN_KEY
OPENAI_API_KEY
```

### Futuras (pagos)
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## PLAN DE IMPLEMENTACION

### SEMANA 1-2: ALGOLIA

Dia 1-2: Crear algoliaService.ts
Dia 3-4: Integrar en endpoints
Dia 5: Cola de sincronizacion
Semana 2: Panel admin y testing

### SEMANA 3-4: LEADS - BASE

Dia 1: Crear tablas BD
Dia 2-3: Servicio de IA
Dia 4-5: API de captura

### SEMANA 5: LEADS - ADMIN

Dia 1-3: Panel de aprobacion
Dia 4-5: APIs de admin

### SEMANA 6: LEADS - MARKETPLACE

Dia 1-3: Interfaz marketplace
Dia 4-5: Sistema de compra

### SEMANA 7: LEADS - FINALIZACION

Dia 1-2: Pagina de comprados
Dia 3-5: Testing completo

---

## CONSIDERACIONES IMPORTANTES

### Privacidad
- GDPR: datos personales protegidos
- Anonimizacion obligatoria antes de mostrar
- Datos solo revelados tras compra
- Consentimiento en formulario

### Costos
- OpenAI: ~0.01-0.03 USD por lead procesado
- Algolia: operaciones de escritura
- Stripe: comision por transaccion (futuro)

### Escalabilidad
- Cola de procesamiento para picos
- Cache de resultados de IA
- Indices en BD optimizados

### Seguridad
- Validar origen de formularios
- Rate limiting en APIs
- Encriptacion de datos sensibles
- Logs de auditoria

---

## METRICAS DE EXITO

### Tecnicas
- Sincronizacion: >99% exitosa
- Latencia IA: <5 segundos
- Uptime: >99.9%

### Negocio
- Leads capturados/mes
- Tasa de aprobacion admin
- Leads vendidos/mes
- Precio promedio por lead
- Tasa de conversion despacho

---

Ultima actualizacion: 10 de noviembre de 2025
