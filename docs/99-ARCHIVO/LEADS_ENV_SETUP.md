# Variables de Entorno para Sistema de Leads

## Configuración Requerida

Añade estas variables a tu archivo `.env.local`:

```env
# OpenAI API Key (para procesamiento de leads con IA)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Webhook Secret (para validar requests desde WordPress)
LEXHOY_WEBHOOK_SECRET=your-secure-webhook-secret-here
```

## Cómo Obtener las Claves

### 1. OpenAI API Key
1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Cópiala a tu `.env.local`

### 2. Webhook Secret
Genera un secret aleatorio:
```bash
openssl rand -hex 32
```

O usa cualquier string seguro y aleatorio.

## Configuración en WordPress

En tu sitio LexHoy.com, configura el webhook para enviar leads a:
```
https://despachos.lexhoy.com/api/webhooks/lexhoy
```

Headers requeridos:
```
x-webhook-secret: [tu-secret-aquí]
Content-Type: application/json
```

## Testing del Webhook

Puedes probar el endpoint con:
```bash
curl -X POST https://despachos.lexhoy.com/api/webhooks/lexhoy \
  -H "x-webhook-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "correo": "test@example.com",
    "telefono": "600123456",
    "cuerpoMensaje": "Necesito asesoramiento legal urgente...",
    "urlPagina": "https://lexhoy.com/test",
    "tituloPost": "Test Post"
  }'
```
