# Guía de Configuración del Sistema de Leads

## ✅ Migración Completada

La base de datos está lista. Ahora sigue estos pasos:

## 1. Configurar Variables de Entorno

Edita tu archivo `.env.local` y añade:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-...

# Webhook Secret (genera uno aleatorio)
LEXHOY_WEBHOOK_SECRET=tu-secret-aqui
```

### Obtener OpenAI API Key:
1. Ve a https://platform.openai.com/api-keys
2. Click en "Create new secret key"
3. Copia la key y pégala en `.env.local`

### Generar Webhook Secret:
```bash
# En terminal
openssl rand -hex 32
```

## 2. Probar el Sistema

### Opción A: Usar el webhook desde WordPress

Configura en WordPress para enviar a:
```
POST https://despachos.lexhoy.com/api/webhooks/lexhoy
Headers:
  x-webhook-secret: [tu-secret]
  Content-Type: application/json
```

### Opción B: Probar con cURL

```bash
curl -X POST http://localhost:3000/api/webhooks/lexhoy \
  -H "x-webhook-secret: tu-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "correo": "test@example.com",
    "telefono": "600123456",
    "cuerpoMensaje": "Necesito asesoramiento legal urgente sobre un despido improcedente en Madrid...",
    "urlPagina": "https://lexhoy.com/test",
    "tituloPost": "Test Post"
  }'
```

### Opción C: Usar el script de prueba

```bash
# Instalar dependencias si es necesario
npm install tsx

# Ejecutar script de prueba
npx tsx testLeads.ts
```

## 3. Verificar en Supabase

Ve a Supabase Dashboard → Table Editor → `leads`

Deberías ver:
- Lead creado
- `resumen_ia` generado
- `especialidad` detectada
- `puntuacion_calidad` calculada
- `estado` = "procesado" o "descartado"

## 4. Próximos Pasos

- [ ] Crear UI del marketplace (`/dashboard/leads`)
- [ ] Configurar webhook en WordPress
- [ ] Probar flujo completo
- [ ] Desplegar a producción

## 🐛 Troubleshooting

### Error: "Missing OPENAI_API_KEY"
→ Asegúrate de tener la variable en `.env.local` y reinicia el servidor

### Error: "Unauthorized" en webhook
→ Verifica que el header `x-webhook-secret` coincida con tu `.env.local`

### Lead se marca como "descartado"
→ La IA determinó que la calidad es muy baja. Revisa el mensaje del lead.

## 📚 Documentación

- [OpenAI API](https://platform.openai.com/docs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- Código del servicio: `lib/services/aiLeadService.ts`
