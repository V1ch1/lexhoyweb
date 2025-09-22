# 🚀 Instrucciones para Probar el Dashboard de Administración

## ✅ **Pasos Completados:**
- ✅ Sistema de roles implementado
- ✅ Página de administración `/admin/users` creada
- ✅ Login modificado para funcionar con Supabase
- ✅ UserService con método `getUserByEmail` agregado

## 📋 **Pasos para Probar:**

### **1. Ejecutar el Script SQL (CRÍTICO)**

1. **Primero, modifica el email en el SQL:**
   - Abre `lib/supabase-roles.sql`
   - En la línea 178, cambia `'tu-email@ejemplo.com'` por tu email real
   - Ejemplo: `'miguel@lexhoy.com'`

2. **Ejecuta el script en Supabase:**
   - Ve a tu dashboard de Supabase
   - Ve a "SQL Editor"
   - Copia y pega todo el contenido de `supabase-roles.sql`
   - Haz clic en "Run this query"
   - Confirma cuando pregunte por las operaciones "destructivas"

### **2. Probar el Login y Dashboard**

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Ve al login:**
   - http://localhost:3000/login

3. **Haz login con tu email:**
   - Email: El mismo que pusiste en el SQL
   - Contraseña: Cualquier cosa (por ahora no se valida)
   - Haz clic en "Iniciar Sesión"

4. **Deberías ser redirigido automáticamente a:**
   - http://localhost:3000/admin/users

### **3. Qué Verás en el Dashboard:**

**Pestañas disponibles:**
- 👥 **Usuarios**: Lista de usuarios registrados con roles y estados
- 📝 **Solicitudes**: Solicitudes de registro pendientes de aprobación  
- ➕ **Crear Usuario**: Formulario para crear usuarios manualmente

**Funcionalidades:**
- ✅ Ver todos los usuarios con información detallada
- ✅ Estados visuales con badges de colores
- ✅ Información de despachos asignados
- ✅ Aprobar usuarios pendientes
- ✅ Crear nuevos usuarios con roles específicos
- ✅ Gestionar solicitudes de registro

### **4. Si Algo No Funciona:**

**Error de conexión con Supabase:**
- Verifica que las variables de entorno estén en `.env.local`
- Comprueba que el script SQL se ejecutó correctamente

**No puedes acceder a /admin/users:**
- Verifica que tu email en el SQL sea exactamente el mismo que usas en el login
- Comprueba que el rol se estableció como 'super_admin' en la base de datos

**Error "Usuario no encontrado":**
- El email en el login debe coincidir exactamente con el del SQL
- Verifica que el script SQL se ejecutó sin errores

## 🎯 **Siguiente Fase:**

Una vez que confirmes que todo funciona:

1. **Autenticación Real**: Implementar Supabase Auth completo
2. **Dashboard de Despachos**: Crear gestión de despachos
3. **Sistema de Leads**: Implementar captura y gestión de leads
4. **Integración Algolia**: Conectar con la base de 10.000+ despachos

## 📞 **¿Necesitas Ayuda?**

Si encuentras algún problema:
1. Comparte el error específico que ves
2. Confirma qué pasos completaste exitosamente
3. Verifica el estado de las tablas en Supabase Dashboard

¡El sistema está listo para probar! 🚀