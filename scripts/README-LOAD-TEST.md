# 🧪 Load Testing - Sistema de Registro

Scripts para probar la capacidad del sistema de registro en **producción** simulando múltiples usuarios registrándose simultáneamente.

## 📋 Archivos

- `load-test-registro.js` - Ejecuta el test de carga
- `limpiar-usuarios-prueba.js` - Limpia usuarios de prueba creados
- `usuarios-prueba-creados.json` - (Generado automáticamente) Lista de emails creados

---

## 🚀 Uso Rápido

### 1. Configurar URL de producción

```bash
# .env.local
PRODUCTION_URL=https://tu-proyecto.vercel.app
```

O usar variable de entorno al ejecutar:

```bash
PRODUCTION_URL=https://tu-proyecto.vercel.app node scripts/load-test-registro.js
```

### 2. Ejecutar test con 10 usuarios (por defecto)

```bash
cd lexhoyweb
node scripts/load-test-registro.js
```

### 3. Ejecutar test con número personalizado

```bash
# 5 usuarios
NUM_USUARIOS=5 node scripts/load-test-registro.js

# 20 usuarios
NUM_USUARIOS=20 node scripts/load-test-registro.js

# 50 usuarios (stress test)
NUM_USUARIOS=50 node scripts/load-test-registro.js
```

### 4. Limpiar usuarios de prueba

```bash
node scripts/limpiar-usuarios-prueba.js
```

---

## 📊 Interpretación de Resultados

### Tasa de Éxito

| Porcentaje | Estado       | Recomendación                         |
| ---------- | ------------ | ------------------------------------- |
| **≥ 90%**  | ✅ Excelente | Puedes lanzar campaña masiva          |
| **70-89%** | ⚠️ Aceptable | Lanzamiento gradual (50-100/día)      |
| **50-69%** | ⚠️ Limitado  | Lanzamiento muy gradual (25-50/día)   |
| **< 50%**  | ❌ Crítico   | NO lanzar campaña, investigar errores |

### Tiempos de Respuesta

| Tiempo    | Estado       | Acción                        |
| --------- | ------------ | ----------------------------- |
| **< 2s**  | ✅ Excelente | Sistema rápido                |
| **2-5s**  | ⚠️ Aceptable | Dentro de límites             |
| **5-10s** | ⚠️ Lento     | Usuarios pueden impacientarse |
| **> 10s** | ❌ Crítico   | Optimización necesaria        |

### Errores Comunes

#### 1. **Rate Limit Exceeded**

```
Error: Alto volumen de registros en este momento...
```

**Causa**: Supabase Free tiene límites de requests/segundo

**Soluciones**:

- ✅ Sistema de reintentos ya implementado
- Lanzamiento gradual de campaña
- Upgrade a Supabase Pro ($25/mes)

#### 2. **Network Timeout**

```
Error: fetch failed / ETIMEDOUT
```

**Causa**: Servidor sobrecargado o problema de red

**Soluciones**:

- Verificar status de Vercel
- Revisar logs en Vercel Dashboard
- Aumentar maxDuration en vercel.json

#### 3. **Email Already Registered**

```
Error: Este correo ya está registrado
```

**Causa**: Script ejecutado previamente sin limpiar

**Solución**:

```bash
node scripts/limpiar-usuarios-prueba.js
```

---

## 🎯 Escenarios de Testing

### Test Básico (10 usuarios)

**Simula**: Campaña pequeña, tráfico bajo

```bash
node scripts/load-test-registro.js
```

### Test Moderado (25 usuarios)

**Simula**: Primera hora después de enviar 200 emails

```bash
NUM_USUARIOS=25 node scripts/load-test-registro.js
```

### Test Alto (50 usuarios)

**Simula**: Pico máximo de campaña masiva

```bash
NUM_USUARIOS=50 node scripts/load-test-registro.js
```

### Test Extremo (100 usuarios)

**Simula**: Campaña viral o lanzamiento en medios

```bash
NUM_USUARIOS=100 node scripts/load-test-registro.js
```

⚠️ **Advertencia**: Solo ejecutar si plan Pro o para ver límites máximos

---

## 🔍 Monitoreo Durante el Test

### 1. Dashboard de Supabase

**URL**: https://supabase.com/dashboard/project/[tu-proyecto]

Monitorear:

- **Auth → Users**: Ver usuarios creándose en tiempo real
- **Database → Tables**: Tamaño de tabla `users`
- **Reports → API**: Requests por segundo
- **Settings → Billing**: Uso de recursos

### 2. Dashboard de Vercel

**URL**: https://vercel.com/[tu-usuario]/[tu-proyecto]

Monitorear:

- **Deployments → Logs**: Ver logs de API en tiempo real
- **Analytics → Functions**: Tiempo de ejecución
- **Speed Insights**: Performance del frontend

### 3. Consola del Script

El script muestra en tiempo real:

```
✅ [Usuario 1] Registrado exitosamente en 2341ms
⏳ [Usuario 2] Reintenando... (intento 1/3)
✅ [Usuario 2] Registrado exitosamente en 4523ms
❌ [Usuario 3] Error: Rate limit exceeded
```

---

## 🧹 Limpieza Automática

El script guarda automáticamente los emails creados en:

```
scripts/usuarios-prueba-creados.json
```

Para limpiar:

```bash
node scripts/limpiar-usuarios-prueba.js
```

Esto elimina:

- ✅ Usuarios de `auth.users` (Supabase Auth)
- ✅ Usuarios de tabla `users` (por cascada)
- ✅ Asignaciones en `user_despachos` (por cascada)
- ✅ Archivo `usuarios-prueba-creados.json`

---

## 📈 Benchmarks Recomendados

### Antes de Lanzar Campaña

1. **Test Inicial** (10 usuarios)

   ```bash
   node scripts/load-test-registro.js
   ```

   Objetivo: Verificar que sistema básico funciona

2. **Test Realista** (25 usuarios)

   ```bash
   NUM_USUARIOS=25 node scripts/load-test-registro.js
   ```

   Objetivo: Simular tráfico esperado

3. **Test Límite** (50 usuarios)
   ```bash
   NUM_USUARIOS=50 node scripts/load-test-registro.js
   ```
   Objetivo: Ver cuándo empieza a fallar

### Después de Cada Mejora

```bash
# Test rápido
NUM_USUARIOS=10 node scripts/load-test-registro.js

# Limpiar
node scripts/limpiar-usuarios-prueba.js
```

---

## ⚙️ Configuración Avanzada

### Variables de Entorno

```bash
# URL de producción (requerido)
PRODUCTION_URL=https://lexhoy.vercel.app

# Número de usuarios a crear (opcional, default: 10)
NUM_USUARIOS=25

# Delay entre grupos en ms (opcional, default: 0 = simultáneo)
DELAY_MS=1000
```

### Ejemplo con todas las opciones

```bash
PRODUCTION_URL=https://lexhoy.vercel.app \
NUM_USUARIOS=30 \
DELAY_MS=500 \
node scripts/load-test-registro.js
```

---

## 🐛 Troubleshooting

### "Error: fetch failed"

**Causa**: URL incorrecta o producción no disponible

**Solución**:

```bash
# Verificar URL
curl https://tu-proyecto.vercel.app/api/health

# O verificar en navegador
open https://tu-proyecto.vercel.app
```

### "No se puede limpiar usuarios"

**Causa**: Falta SUPABASE_SERVICE_ROLE_KEY

**Solución**:

```bash
# Verificar .env.local tiene:
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### "Too many users created"

**Causa**: Has creado muchos usuarios de prueba

**Solución**:

```bash
# Limpiar todo
node scripts/limpiar-usuarios-prueba.js

# O manualmente en Supabase Dashboard
```

---

## 📝 Notas Importantes

1. **Solo usar en producción**: El script usa la URL de producción real
2. **Limpiar después**: Siempre ejecutar script de limpieza
3. **No abusar**: Respetar límites de Supabase
4. **Emails temporales**: Los emails generados son únicos y aleatorios
5. **Monitorear costos**: Verificar uso en Supabase Dashboard

---

## 🤝 Mejores Prácticas

### Antes del Test

- ✅ Verificar que producción está estable
- ✅ Avisar al equipo que harás un test
- ✅ Tener Dashboard de Supabase abierto
- ✅ Guardar snapshot de base de datos (opcional)

### Durante el Test

- ✅ Monitorear logs en tiempo real
- ✅ Tomar screenshots de resultados
- ✅ Anotar observaciones

### Después del Test

- ✅ Ejecutar script de limpieza
- ✅ Analizar resultados
- ✅ Documentar hallazgos
- ✅ Planificar mejoras si es necesario

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs en Vercel Dashboard
2. Revisar logs en Supabase Dashboard
3. Verificar variables de entorno
4. Ejecutar script de limpieza y reintentar
