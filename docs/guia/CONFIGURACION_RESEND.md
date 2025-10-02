# 📧 Configuración de Resend para Notificaciones por Email

## 🎯 Estado Actual

✅ **Sistema completamente implementado y funcional**

El sistema de notificaciones por email está **100% implementado** usando Resend. Solo necesitas configurar las credenciales.

---

## 📦 Dependencias Instaladas

```json
{
  "dependencies": {
    "resend": "^4.8.0"
  }
}
```

✅ Ya está instalado en `package.json`

---

## 🔑 Configuración de Resend

### Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Click en **Create API Key**
3. Dale un nombre (ej: "LexHoy Production")
4. Copia la API Key generada

### Paso 3: Configurar dominio (Opcional pero recomendado)

**Opción A: Usar dominio propio (Recomendado para producción)**

1. En Resend, ve a **Domains**
2. Click en **Add Domain**
3. Ingresa tu dominio: `lexhoy.com`
4. Agrega los registros DNS que Resend te proporciona:
   - **MX Record**
   - **TXT Record** (SPF)
   - **CNAME Record** (DKIM)
5. Espera a que se verifique (puede tardar hasta 48h)

**Opción B: Usar dominio de prueba de Resend**

Para desarrollo, Resend te da un dominio de prueba automáticamente:
- `onboarding@resend.dev` (solo para testing)
- **Limitación**: Solo puedes enviar a emails verificados

### Paso 4: Configurar variables de entorno

Crea o actualiza tu archivo `.env.local`:

```bash
# Resend Configuration
RESEND_API_KEY=re_123456789abcdefghijklmnop  # Tu API Key de Resend
RESEND_FROM_EMAIL=notificaciones@lexhoy.com   # Tu email verificado

# Base URL (para links en emails)
NEXT_PUBLIC_BASE_URL=https://lexhoy.com       # O http://localhost:3000 en desarrollo
```

**⚠️ IMPORTANTE**: 
- Nunca subas el `.env.local` a Git
- Agrega `.env.local` a tu `.gitignore`
- En producción (Vercel/Netlify), configura estas variables en el panel de control

---

## 📧 Emails Configurados

El sistema envía emails automáticamente en estos casos:

### 1. Nueva Solicitud de Despacho
**Destinatario**: Todos los super_admin  
**Trigger**: Cuando un usuario solicita acceso a un despacho  
**Template**: `templateSolicitudRecibida`

```typescript
// Se envía automáticamente desde:
// app/api/solicitar-despacho/route.ts (líneas 159-177)
```

### 2. Solicitud Aprobada
**Destinatario**: Usuario que solicitó  
**Trigger**: Cuando un super_admin aprueba la solicitud  
**Template**: `templateSolicitudAprobada`

```typescript
// Se envía automáticamente desde:
// lib/userService.ts → approveSolicitudDespacho() (líneas 1193-1213)
```

### 3. Solicitud Rechazada
**Destinatario**: Usuario que solicitó  
**Trigger**: Cuando un super_admin rechaza la solicitud  
**Template**: `templateSolicitudRechazada`

```typescript
// Se envía automáticamente desde:
// lib/userService.ts → rejectSolicitudDespacho() (líneas 1276-1296)
```

### 4. Usuario Nuevo (Opcional)
**Destinatario**: Todos los super_admin  
**Trigger**: Cuando se registra un nuevo usuario  
**Template**: `templateUsuarioNuevo`

```typescript
// Puedes implementarlo en el registro si lo necesitas
```

---

## 🎨 Templates de Email

Todos los templates están en `lib/emailService.ts` y tienen:

- ✅ Diseño responsive
- ✅ Colores corporativos
- ✅ Botones de acción
- ✅ Información estructurada
- ✅ Footer con branding

### Personalizar Templates

Para modificar el diseño de los emails, edita:

```typescript
// lib/emailService.ts

static templateSolicitudRecibida(data: EmailTemplateData): string {
  return `
    <!DOCTYPE html>
    <html>
      <!-- Tu HTML personalizado aquí -->
    </html>
  `;
}
```

---

## 🧪 Probar el Sistema

### Prueba 1: Email a Super Admin (Nueva Solicitud)

1. **Login** como usuario normal
2. **Ir a** `/dashboard/despachos`
3. **Click** en "Solicitar Despacho" en cualquier despacho
4. **Verificar**:
   - ✅ Solicitud se crea en BD
   - ✅ Email se envía a todos los super_admin
   - ✅ Revisa la consola del servidor para logs

**Logs esperados**:
```
📧 Enviando email a: admin@lexhoy.com
✅ Email enviado correctamente
✅ Emails enviados a super admins
```

### Prueba 2: Email al Usuario (Solicitud Aprobada)

1. **Login** como super_admin
2. **Ir a** `/admin/solicitudes-despachos`
3. **Click** en "Aprobar" en una solicitud
4. **Verificar**:
   - ✅ Solicitud se aprueba
   - ✅ Usuario recibe email
   - ✅ Usuario puede ver el despacho en "Mis Despachos"

### Prueba 3: Email al Usuario (Solicitud Rechazada)

1. **Login** como super_admin
2. **Ir a** `/admin/solicitudes-despachos`
3. **Click** en "Rechazar" en una solicitud
4. **Escribir** motivo del rechazo
5. **Verificar**:
   - ✅ Solicitud se rechaza
   - ✅ Usuario recibe email con el motivo

---

## 🔍 Debugging

### Ver logs de emails

En la consola del servidor (terminal donde corre `npm run dev`):

```bash
# Email enviado correctamente
📧 Enviando email a: usuario@example.com
✅ Email enviado correctamente

# Error al enviar
❌ Error enviando email: [detalles del error]
```

### Problemas comunes

#### 1. "Error: Missing API key"

**Solución**: 
- Verifica que `RESEND_API_KEY` está en `.env.local`
- Reinicia el servidor después de agregar variables de entorno

```bash
# Detener servidor
Ctrl + C

# Reiniciar
npm run dev
```

#### 2. "Error: Invalid from address"

**Solución**:
- Verifica que el email en `RESEND_FROM_EMAIL` está verificado en Resend
- Si usas dominio propio, asegúrate que los DNS estén configurados

#### 3. "Email no llega"

**Solución**:
- Revisa la carpeta de SPAM
- En desarrollo, solo puedes enviar a emails verificados en Resend
- Verifica los logs del servidor

#### 4. "Rate limit exceeded"

**Solución**:
- Plan gratuito de Resend: 100 emails/día
- Considera upgrade si necesitas más

---

## 📊 Límites de Resend

### Plan Gratuito
- ✅ 3,000 emails/mes
- ✅ 100 emails/día
- ✅ 1 dominio verificado
- ✅ API completa

### Plan Pro ($20/mes)
- ✅ 50,000 emails/mes
- ✅ Sin límite diario
- ✅ Dominios ilimitados
- ✅ Soporte prioritario

---

## 🔒 Seguridad

### Buenas Prácticas

1. **Nunca expongas la API Key**
   ```typescript
   // ❌ MAL
   const apiKey = "re_123456789";
   
   // ✅ BIEN
   const apiKey = process.env.RESEND_API_KEY;
   ```

2. **Valida destinatarios**
   ```typescript
   // Verifica que el email es válido antes de enviar
   if (!email || !email.includes('@')) {
     throw new Error('Email inválido');
   }
   ```

3. **Rate limiting**
   ```typescript
   // El sistema ya maneja errores silenciosamente
   // No bloquea la operación principal si falla el email
   ```

---

## 🚀 Despliegue en Producción

### Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega:
   - `RESEND_API_KEY` = tu API key
   - `RESEND_FROM_EMAIL` = tu email verificado
   - `NEXT_PUBLIC_BASE_URL` = tu dominio de producción

### Netlify

1. Ve a tu sitio en Netlify
2. **Site settings** → **Environment variables**
3. Agrega las mismas variables

### Otras plataformas

Consulta la documentación de tu hosting para agregar variables de entorno.

---

## 📝 Archivos del Sistema

```
lexhoyweb/
├── lib/
│   ├── emailService.ts              # ✅ Servicio principal de emails
│   └── userService.ts               # ✅ Lógica de aprobación/rechazo
├── app/
│   └── api/
│       ├── send-email/
│       │   └── route.ts             # ✅ API endpoint para enviar emails
│       └── solicitar-despacho/
│           └── route.ts             # ✅ Envía email a super_admin
└── .env.local                       # ⚠️ Configurar (no en Git)
```

---

## ✅ Checklist de Configuración

- [ ] Cuenta creada en Resend
- [ ] API Key obtenida
- [ ] Dominio verificado (opcional pero recomendado)
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Servidor reiniciado después de configurar
- [ ] Email de prueba enviado correctamente
- [ ] Variables configuradas en producción (Vercel/Netlify)

---

## 🆘 Soporte

### Documentación Oficial
- [Resend Docs](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)

### Contacto
Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración de DNS (si usas dominio propio)
3. Consulta el dashboard de Resend para ver el estado de los emails

---

**¡Sistema de emails completamente funcional!** 📧✅

Solo necesitas:
1. Crear cuenta en Resend
2. Obtener API Key
3. Configurar `.env.local`
4. Reiniciar servidor
