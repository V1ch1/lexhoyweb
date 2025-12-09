# 📱 Guía: Configurar Instagram API para Importar Vídeos

## Paso 1: Crear App de Facebook

1. Ve a https://developers.facebook.com/apps
2. Click en "Crear app"
3. Selecciona "Empresa" como tipo de app
4. Completa el formulario:
   - Nombre de la app: "LexHoy Instagram Sync"
   - Email de contacto: tu email
   - Cuenta de empresa: Crea una nueva si no tienes

## Paso 2: Añadir Instagram Graph API

1. En el dashboard de tu app, busca "Instagram Graph API"
2. Click en "Configurar"
3. Acepta los términos

## Paso 3: Conectar Instagram Business

1. Tu cuenta @lexhoynoticias debe ser una cuenta Business o Creator
2. Debe estar conectada a una Página de Facebook
3. Si no lo está:
   - Ve a Instagram → Configuración → Cuenta
   - Cambia a cuenta profesional
   - Conecta con una Página de Facebook

## Paso 4: Obtener Access Token

### 4.1 Token de Corta Duración

1. Ve a https://developers.facebook.com/tools/explorer
2. Selecciona tu app en el dropdown
3. Click en "Generar token de acceso"
4. Selecciona permisos:
   - `instagram_basic`
   - `pages_read_engagement`
   - `instagram_manage_insights` (opcional)
5. Click en "Generar token de acceso"
6. Copia el token

### 4.2 Convertir a Token de Larga Duración

Ejecuta este comando (reemplaza los valores):

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_TOKEN_CORTO"
```

Esto te dará un token que dura 60 días.

## Paso 5: Obtener Instagram User ID

1. Con tu token, ejecuta:

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=TU_TOKEN"
```

2. Busca tu página de Facebook y copia el `id`

3. Luego ejecuta:

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/TU_PAGE_ID?fields=instagram_business_account&access_token=TU_TOKEN"
```

4. Copia el `instagram_business_account.id` - Este es tu INSTAGRAM_USER_ID

## Paso 6: Configurar Variables de Entorno

Añade estas variables a tu `.env.local`:

```env
# Instagram API
INSTAGRAM_ACCESS_TOKEN=IGQVJxxxxxxxxxxxxxxxxxxxxxxxxx
INSTAGRAM_USER_ID=17841xxxxxxxxx
```

## Paso 7: Reiniciar Servidor

```bash
# Detener el servidor (Ctrl+C)
pnpm dev
```

## Paso 8: Sincronizar Vídeos

1. Ve a `/dashboard/admin/marketing/videos/sync`
2. Click en "Sincronizar Ahora"
3. Espera a que termine
4. Ve a `/dashboard/marketing/videos-instagram` para ver los vídeos

---

## Renovar Token (Cada 60 días)

El token expira cada 60 días. Para renovarlo:

1. Repite el Paso 4.1 para obtener un nuevo token corto
2. Repite el Paso 4.2 para convertirlo a largo
3. Actualiza `INSTAGRAM_ACCESS_TOKEN` en `.env.local`
4. Reinicia el servidor

---

## Solución de Problemas

### Error: "Invalid OAuth access token"
- El token expiró, renuévalo siguiendo los pasos anteriores

### Error: "Instagram credentials not configured"
- Verifica que las variables de entorno estén en `.env.local`
- Reinicia el servidor después de añadirlas

### Error: "Forbidden"
- Verifica que tu cuenta de Instagram sea Business/Creator
- Verifica que esté conectada a una Página de Facebook
- Verifica los permisos de la app

### No se importan vídeos
- Verifica que @lexhoynoticias tenga vídeos publicados
- Verifica que el INSTAGRAM_USER_ID sea correcto
- Revisa la consola del servidor para errores

---

## Automatización (Opcional)

Para sincronizar automáticamente cada día, puedes:

1. Crear un cron job en Vercel (limitado en plan gratuito)
2. Usar un servicio externo como Zapier
3. Ejecutar manualmente cuando publiques nuevo contenido

---

**¿Necesitas ayuda?** Revisa los logs del servidor para ver errores detallados.
