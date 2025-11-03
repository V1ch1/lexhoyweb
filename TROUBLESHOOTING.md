# 🔧 Guía de Solución de Problemas

Esta guía te ayudará a resolver los problemas más comunes en LexHoy Portal.

---

## 📋 Tabla de Contenidos

- [Problemas de Instalación](#problemas-de-instalación)
- [Problemas de Build](#problemas-de-build)
- [Problemas de Autenticación](#problemas-de-autenticación)
- [Problemas de Base de Datos](#problemas-de-base-de-datos)
- [Problemas de API](#problemas-de-api)
- [Problemas de Deployment](#problemas-de-deployment)
- [Problemas de Performance](#problemas-de-performance)

---

## 📦 Problemas de Instalación

### Error: "pnpm: command not found"

**Problema:** pnpm no está instalado.

**Solución:**
```bash
npm install -g pnpm
```

---

### Error: "EACCES: permission denied"

**Problema:** Permisos insuficientes.

**Solución:**
```bash
# En Linux/Mac
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules

# En Windows (ejecutar PowerShell como admin)
takeown /f node_modules /r /d y
```

---

### Error: "Cannot find module"

**Problema:** Dependencias no instaladas correctamente.

**Solución:**
```bash
# Limpiar caché y reinstalar
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## 🏗️ Problemas de Build

### Error: "Type error: Cannot find type definition file for 'interfaces'"

**Problema:** Carpeta de tipos vacía o mal configurada.

**Solución:**
```bash
# Eliminar carpeta problemática
rm -rf types/interfaces

# Verificar tsconfig.json
# Asegurarse de que typeRoots solo incluye node_modules/@types
```

**Archivo:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types"]
  }
}
```

---

### Error: "Module not found: Can't resolve '@/...'"

**Problema:** Path alias no configurado correctamente.

**Solución:**

Verificar `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### Error: "EPERM: operation not permitted, symlink"

**Problema:** Problemas con symlinks en Windows con `output: 'standalone'`.

**Solución:**

En `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // Comentar esta línea en Windows
  // output: 'standalone',
};
```

---

### Build muy lento

**Problema:** Build tarda mucho tiempo.

**Solución:**
```bash
# Limpiar caché de Next.js
rm -rf .next

# Limpiar caché de TypeScript
rm -rf .tsbuildinfo

# Rebuild
pnpm build
```

---

## 🔐 Problemas de Autenticación

### Error: "No autenticado" al hacer login

**Problema:** Token JWT no se está enviando correctamente.

**Solución:**

Verificar que el token se incluye en el header:
```typescript
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`
  }
});
```

---

### Error: "Invalid JWT"

**Problema:** Token expirado o inválido.

**Solución:**
```typescript
// Refrescar sesión
const { data, error } = await supabase.auth.refreshSession();
if (error) {
  // Redirigir a login
  router.push('/login');
}
```

---

### Usuario no puede acceder a rutas protegidas

**Problema:** Middleware de autenticación no configurado.

**Solución:**

Verificar `middleware.ts`:
```typescript
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
```

---

## 🗄️ Problemas de Base de Datos

### Error: "relation does not exist"

**Problema:** Tabla no existe en Supabase.

**Solución:**
```sql
-- Ejecutar migraciones en Supabase SQL Editor
-- Ver docs/DATABASE_SCHEMA.md
```

---

### Error: "permission denied for table"

**Problema:** Políticas RLS mal configuradas.

**Solución:**
```sql
-- Verificar que RLS está habilitado
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;

-- Crear política de lectura
CREATE POLICY "Usuarios pueden ver sus despachos"
ON despachos FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM user_despachos WHERE despacho_id = id
));
```

---

### Queries muy lentas

**Problema:** Falta de índices.

**Solución:**
```sql
-- Crear índices en columnas frecuentemente consultadas
CREATE INDEX idx_despachos_slug ON despachos(slug);
CREATE INDEX idx_user_despachos_user_id ON user_despachos(user_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_despacho(estado);
```

---

### Error: "Connection timeout"

**Problema:** No se puede conectar a Supabase.

**Solución:**

1. Verificar variables de entorno:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

2. Verificar que el proyecto de Supabase está activo
3. Verificar firewall/proxy

---

## 🌐 Problemas de API

### Error 400: "ID de solicitud inválido"

**Problema:** UUID no válido.

**Solución:**

Verificar que el ID es un UUID válido:
```typescript
import { validateUUID } from '@/lib/validation';

if (!validateUUID(id)) {
  console.error('ID inválido:', id);
  // Usar ID correcto
}
```

---

### Error 401: "No autenticado"

**Problema:** Token no enviado o inválido.

**Solución:**
```typescript
// Verificar que el token existe
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  router.push('/login');
  return;
}

// Incluir en request
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

---

### Error 403: "No tienes permisos"

**Problema:** Usuario no tiene el rol necesario.

**Solución:**

Verificar rol del usuario:
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('rol')
  .eq('id', user.id)
  .single();

console.log('Rol del usuario:', userData?.rol);
// Debe ser 'super_admin' para endpoints administrativos
```

---

### Error 500: "Error al aprobar solicitud"

**Problema:** Error en el servidor.

**Solución:**

1. Verificar logs en Vercel:
```bash
vercel logs --prod
```

2. Verificar logs en Supabase Dashboard

3. Verificar que todas las variables de entorno están configuradas

---

### API no responde / Timeout

**Problema:** Request tarda demasiado.

**Solución:**

1. Verificar queries de base de datos
2. Añadir timeout:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch('/api/endpoint', {
    signal: controller.signal
  });
} finally {
  clearTimeout(timeout);
}
```

---

## 🚀 Problemas de Deployment

### Build falla en Vercel

**Problema:** Error durante el build en Vercel.

**Solución:**

1. Verificar que build funciona localmente:
```bash
pnpm build
```

2. Verificar variables de entorno en Vercel

3. Ver logs detallados:
```bash
vercel logs --build
```

---

### Variables de entorno no funcionan en producción

**Problema:** Variables no configuradas en Vercel.

**Solución:**

1. Ir a Vercel Dashboard → Settings → Environment Variables
2. Añadir todas las variables necesarias
3. Marcar para: Production, Preview, Development
4. Redeploy

---

### Cambios no se reflejan después de deploy

**Problema:** Caché de Vercel.

**Solución:**

1. Forzar redeploy:
```bash
vercel --prod --force
```

2. Limpiar caché del navegador (Ctrl + Shift + R)

---

### Error: "Function execution timed out"

**Problema:** Función serverless excede tiempo límite.

**Solución:**

1. Optimizar queries de base de datos
2. Añadir índices
3. Usar edge functions si es posible
4. Aumentar timeout en `vercel.json`:
```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

---

## ⚡ Problemas de Performance

### Página carga muy lento

**Problema:** Componentes no optimizados.

**Solución:**

1. Usar `next/image` para imágenes:
```typescript
import Image from 'next/image';

<Image 
  src="/logo.png" 
  width={200} 
  height={100}
  alt="Logo"
/>
```

2. Lazy loading de componentes:
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Cargando...</p>
});
```

3. Usar React.memo para componentes que no cambian:
```typescript
export const UserCard = React.memo(({ user }: Props) => {
  return <div>{user.name}</div>;
});
```

---

### Muchas re-renders

**Problema:** Componente se renderiza demasiadas veces.

**Solución:**

1. Usar `useCallback`:
```typescript
const handleClick = useCallback(() => {
  // lógica
}, [dependencies]);
```

2. Usar `useMemo`:
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

### Bundle size muy grande

**Problema:** JavaScript bundle demasiado grande.

**Solución:**

1. Analizar bundle:
```bash
pnpm build
# Ver reporte en .next/analyze
```

2. Code splitting:
```typescript
// Importar solo lo necesario
import { specific } from 'library/specific';
// En lugar de
import { specific } from 'library';
```

3. Remover dependencias no usadas:
```bash
pnpm prune
```

---

## 🔍 Debugging

### Habilitar logs detallados

```typescript
// En desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### Usar React DevTools

1. Instalar extensión de Chrome/Firefox
2. Inspeccionar componentes
3. Ver props y state

### Usar Network tab

1. Abrir DevTools (F12)
2. Tab Network
3. Ver requests y responses

---

## 📞 Obtener Ayuda

Si ninguna solución funciona:

1. **Buscar en Issues**: [GitHub Issues](https://github.com/V1ch1/lexhoyweb/issues)
2. **Crear nuevo Issue**: Incluir:
   - Descripción del problema
   - Pasos para reproducir
   - Logs de error
   - Entorno (OS, browser, versión)
3. **Contactar**: dev@lexhoy.com

---

## 📚 Recursos Adicionales

- [Next.js Troubleshooting](https://nextjs.org/docs/messages)
- [Supabase Troubleshooting](https://supabase.com/docs/guides/platform/troubleshooting)
- [Vercel Troubleshooting](https://vercel.com/docs/concepts/deployments/troubleshoot-a-build)

---

**Última actualización**: 3 de noviembre de 2025  
**Versión**: 1.0.0
