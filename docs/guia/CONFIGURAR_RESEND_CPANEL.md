# 📧 Configurar Resend con lexhoy.com en cPanel

## Opción Recomendada: Usar lexhoy.com directamente

### Paso 1: Crear cuenta en Resend

1. Ve a https://resend.com
2. Crea una cuenta con tu email
3. Verifica tu email

### Paso 2: Añadir dominio en Resend

1. En Resend, ve a **"Domains"**
2. Click en **"Add Domain"**
3. Introduce: `lexhoy.com` (sin www, sin subdominios)
4. Click en **"Add"**

### Paso 3: Configurar DNS en cPanel

Resend te mostrará 3 registros DNS que debes añadir:

#### 3.1 Ir a cPanel
1. Accede a tu cPanel de lexhoy.com
2. Busca **"Zone Editor"** o **"Editor de Zona"**
3. Selecciona el dominio `lexhoy.com`

#### 3.2 Añadir registros DNS

Resend te dará algo similar a esto (los valores exactos los verás en Resend):

**Registro 1: SPF (TXT)**
```
Tipo: TXT
Nombre: @ (o lexhoy.com)
Valor: v=spf1 include:amazonses.com ~all
TTL: 3600
```

**Registro 2: DKIM (TXT)**
```
Tipo: TXT
Nombre: resend._domainkey
Valor: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN... (valor largo que te da Resend)
TTL: 3600
```

**Registro 3: DMARC (TXT)** (Opcional pero recomendado)
```
Tipo: TXT
Nombre: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@lexhoy.com
TTL: 3600
```

#### 3.3 Cómo añadir en cPanel

1. En **Zone Editor**, click en **"Add Record"** o **"Añadir Registro"**
2. Selecciona tipo: **TXT**
3. En **Name/Nombre**: introduce el nombre del registro (ej: `resend._domainkey`)
4. En **TXT Data/Valor**: pega el valor que te dio Resend
5. TTL: deja 3600 o el valor por defecto
6. Click en **"Add Record"** o **"Guardar"**
7. Repite para cada registro

### Paso 4: Verificar en Resend

1. Vuelve a Resend → Domains
2. Click en **"Verify"** junto a lexhoy.com
3. Espera 5-10 minutos (propagación DNS)
4. Si no verifica, espera hasta 24 horas (raro)

### Paso 5: Obtener API Key

1. En Resend, ve a **"API Keys"**
2. Click en **"Create API Key"**
3. Nombre: "LexHoy Production"
4. Permisos: **"Sending access"**
5. Click en **"Create"**
6. **COPIA LA KEY** (empieza con `re_`)

### Paso 6: Configurar en .env.local

```env
RESEND_API_KEY=re_tu_key_copiada_aqui
RESEND_FROM_EMAIL=notificaciones@lexhoy.com
NEXT_PUBLIC_BASE_URL=https://lexhoy.com
```

---

## Alternativa: Usar subdominio notificaciones.lexhoy.com

Si prefieres usar un subdominio:

### Paso 1: Crear subdominio en cPanel

1. En cPanel, ve a **"Subdomains"** o **"Subdominios"**
2. Subdominio: `notificaciones`
3. Dominio: `lexhoy.com`
4. Click en **"Create"** o **"Crear"**

### Paso 2: Añadir en Resend

1. En Resend → Domains → Add Domain
2. Introduce: `notificaciones.lexhoy.com`
3. Sigue los mismos pasos de DNS pero con el subdominio

### Paso 3: Configurar DNS

Los registros serán similares pero con el subdominio:

```
Tipo: TXT
Nombre: resend._domainkey.notificaciones
Valor: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...
```

### Paso 4: .env.local

```env
RESEND_FROM_EMAIL=noreply@notificaciones.lexhoy.com
```

---

## 🎯 Recomendación

**Usa `notificaciones@lexhoy.com`** (Opción 1)

**Ventajas**:
- ✅ Más simple de configurar
- ✅ Mejor reputación del dominio
- ✅ Más profesional
- ✅ No necesitas crear subdominio

**Desventajas de usar subdominio**:
- ❌ Más complejo
- ❌ Puede tener peor deliverability al inicio
- ❌ Requiere configuración extra

---

## 🔍 Verificar que funciona

### Opción 1: Desde Resend Dashboard

1. Ve a Resend → Domains
2. Verás un ✅ verde si está verificado
3. Status: "Verified"

### Opción 2: Enviar email de prueba

1. En Resend → API Keys → Copiar tu key
2. En tu proyecto, ejecuta:

```bash
npm run dev
```

3. Solicita un despacho como usuario
4. Revisa tu email (super admin)
5. Si llega, ¡funciona! 🎉

---

## 🐛 Troubleshooting

### Problema: "Domain not verified"

**Solución**:
1. Espera 10-30 minutos (propagación DNS)
2. Verifica que los registros DNS están correctos en cPanel
3. Usa una herramienta como https://mxtoolbox.com/SuperTool.aspx
4. Introduce: `resend._domainkey.lexhoy.com`
5. Debe mostrar el registro TXT

### Problema: "Emails go to spam"

**Solución**:
1. Añade el registro DMARC
2. Espera 24-48 horas para que mejore la reputación
3. Añade un enlace de "darse de baja" en los emails
4. Verifica que el dominio está verificado

### Problema: "No puedo añadir registros TXT en cPanel"

**Solución**:
1. Contacta a tu proveedor de hosting
2. Pídeles que añadan los registros DNS
3. Envíales los valores que te dio Resend

---

## 📊 Ejemplo Visual de cPanel

```
┌─────────────────────────────────────────────────────────┐
│ Zone Editor - lexhoy.com                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Add Record ▼]                                          │
│                                                          │
│ Type: TXT ▼                                             │
│ Name: resend._domainkey                                 │
│ TXT Data: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...            │
│ TTL: 3600                                               │
│                                                          │
│ [Add Record]  [Cancel]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

- [ ] Cuenta creada en Resend
- [ ] Dominio `lexhoy.com` añadido en Resend
- [ ] Registro SPF añadido en cPanel
- [ ] Registro DKIM añadido en cPanel
- [ ] Registro DMARC añadido en cPanel (opcional)
- [ ] Dominio verificado en Resend (✅ verde)
- [ ] API Key creada y copiada
- [ ] Variables añadidas a `.env.local`
- [ ] Servidor reiniciado
- [ ] Email de prueba enviado y recibido

---

## 🎯 Resumen

1. **Añade dominio** en Resend: `lexhoy.com`
2. **Copia los 3 registros DNS** que te da Resend
3. **Añádelos en cPanel** → Zone Editor
4. **Espera 10 minutos** y verifica
5. **Copia API Key** y añádela a `.env.local`
6. **Reinicia** el servidor
7. **Prueba** enviando un email

**Tiempo total**: 15-20 minutos
