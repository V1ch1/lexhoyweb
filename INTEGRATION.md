# LexHoy Web - Dashboard Despachos

## 🔌 Integraciones Externas

### API Backend (apiBackLexHoy)

El procesamiento de leads (análisis IA, notificaciones) se realiza en un servicio externo desplegado en **Render**.

- **Repositorio**: `apiBackLexHoy`
- **URL Producción**: `https://apibacklexhoy.onrender.com`
- **Función**: Recibe leads de los formularios públicos, los analiza con OpenAI y los guarda en Supabase. Luego notifica a este dashboard.

### Notificaciones de Leads

El flujo de un nuevo lead es:
1. Usuario envía formulario en `lexhoy.com` (WordPress) o `lexhoyweb`.
2. Se envía POST a `https://apibacklexhoy.onrender.com/api/leads`.
3. Backend analiza y guarda en Supabase.
4. Backend llama a `POST https://despachos.lexhoy.com/api/leads/notify-new` para notificar a los admins.

## 🚀 Despliegue Frontend

Este proyecto (`lexhoyweb`) está desplegado en **Vercel**.
