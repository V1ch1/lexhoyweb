# Guía de Auditoría Asistida - Plan A

**Fecha de inicio:** 2025-12-02  
**Estado:** 📋 Pendiente de iniciar  
**Tiempo estimado total:** 2-3 horas  
**Organizado en:** 6 sesiones de 30-45 min

---

## 🎯 Objetivo

Revisar manualmente TODAS las funcionalidades de la aplicación para:
1. Documentar qué funciona ✅
2. Identificar qué está roto ❌
3. Detectar qué falta ⚠️
4. Crear lista priorizada de correcciones

---

## 📋 Cómo Usar Esta Guía

### Al Empezar una Sesión

1. **Abre este archivo:**
   ```
   docs/06-TAREAS/GUIA-AUDITORIA-ASISTIDA.md
   ```

2. **Busca la próxima sesión pendiente** (marcada con `[ ]`)

3. **Abre también:**
   ```
   docs/06-TAREAS/AUDITORIA.md
   ```

4. **Sigue las instrucciones paso a paso**

5. **Marca los checks según pruebes**

### Al Terminar una Sesión

1. **Marca la sesión como completada** `[x]`
2. **Guarda ambos archivos** (esta guía + AUDITORIA.md)
3. **Commit de progreso:**
   ```bash
   git add docs/
   git commit -m "docs: progreso auditoría - sesión X completada"
   git push
   ```

### Al Retomar

1. **Abre este archivo**
2. **Busca la última sesión completada** `[x]`
3. **Continúa con la siguiente** `[ ]`

---

## 📅 Sesiones de Auditoría

### ✅ Checklist de Sesiones

- [x] **Sesión 1:** Autenticación (30 min)
- [ ] **Sesión 2:** Usuarios y Perfiles (30 min)
- [ ] **Sesión 3:** Despachos - Parte 1 (45 min)
- [ ] **Sesión 4:** Despachos - Parte 2 (45 min)
- [ ] **Sesión 5:** Leads y Admin (45 min)
- [ ] **Sesión 6:** UI/UX y Rendimiento (30 min)

---

## 🔐 SESIÓN 1: Autenticación (30 min)

### Preparación

1. Abre en el navegador: `http://localhost:3000`
2. Abre en VS Code: `docs/06-TAREAS/AUDITORIA.md`
3. Busca la sección: "Módulo de Autenticación"

### Pruebas Detalladas

#### 1.1 Registro de Usuario (10 min)

**Paso 1:** Ir a /register y verificar formulario

**Paso 2:** Completar con:
- Email: test-auditoria-[FECHA]@example.com
- Password: TestPass123!
- Nombre: Test
- Apellidos: Auditoría
- Teléfono: 612345678

**Paso 3:** Enviar y documentar resultado en AUDITORIA.md

**Paso 4:** Verificar en Supabase → Authentication → Users

**Paso 5:** Verificar en tabla users (rol='usuario', estado='pendiente')

#### 1.2 Login (10 min)

**Paso 1:** Ir a /login
**Paso 2:** Login con usuario recién creado
**Paso 3:** Verificar redirección a /dashboard
**Paso 4:** Probar logout

#### 1.3 Recuperación de Contraseña (5 min)

**Paso 1:** Ir a /forgot-password
**Paso 2:** Solicitar reset
**Paso 3:** Documentar (email puede no llegar en dev)

#### Resumen Sesión 1

Al terminar, completa en este archivo:

```
## Resumen Sesión 1
Fecha: 2025-12-02
Duración: 20 min
Funcionan: 5/5 probadas (100%)
Rotas: 0
Problemas críticos: Ninguno

Detalles:
- ✅ REG-1: Formulario de registro visible y completo
- ✅ REG-2: Validación de campos funciona correctamente
- ✅ REG-3: Registro exitoso con mensaje claro
- ✅ LOG-1: Formulario de login visible
- ✅ LOG-3: Manejo de errores (email no verificado + credenciales incorrectas)

Pendientes:
- REG-4: Email de verificación (requiere configuración SMTP)
- REG-5: Probar más casos de error
- LOG-2: Login exitoso (requiere usuario verificado)
- LOG-4: Checkbox "Recordarme"
- Recuperación de contraseña
- Logout
```

Marcar: `[x] Sesión 1: Autenticación`

Commit:
```bash
git add docs/
git commit -m "docs: auditoría sesión 1 completada"
git push
```

---

## 👤 SESIÓN 2: Usuarios y Perfiles (30 min)

### Pruebas

#### 2.1 Ver Perfil (5 min)
- Ir a /dashboard/settings
- Verificar datos mostrados
- Documentar en AUDITORIA.md → USR-1

#### 2.2 Editar Perfil (10 min)
- Cambiar nombre y teléfono
- Guardar y verificar
- Verificar en BD
- Documentar → USR-2

#### 2.3 Dashboard (10 min)
- Explorar /dashboard
- Intentar acceder a /dashboard/admin (debería bloquear)
- Documentar → USR-6

#### Resumen Sesión 2

```
## Resumen Sesión 2
Fecha: [FECHA]
Resultados: [completar]
```

Marcar: `[x] Sesión 2: Usuarios`

---

## 🏢 SESIÓN 3: Despachos Parte 1 (45 min)

### Preparación

**IMPORTANTE:** Necesitas ser super_admin

Opción A: Promocionar tu usuario
```sql
UPDATE users SET rol = 'super_admin' 
WHERE email = 'test-auditoria-[FECHA]@example.com';
```

Opción B: Usar blancocasal@gmail.com

### Pruebas

#### 3.1 Lista de Despachos (10 min)
- Ir a /dashboard/despachos
- Verificar lista
- Documentar → DES-1

#### 3.2 Detalle (10 min)
- Click en un despacho
- Verificar información completa
- Documentar → DES-2

#### 3.3 Sedes (10 min)
- Ver lista de sedes
- Verificar información
- Documentar → GES-3

#### 3.4 Búsqueda (10 min)
- Probar búsqueda por nombre
- Probar filtros
- Documentar → DES-3

#### Resumen Sesión 3

```
## Resumen Sesión 3
Fecha: [FECHA]
Resultados: [completar]
```

Marcar: `[x] Sesión 3: Despachos Parte 1`

---

## 🏢 SESIÓN 4: Despachos Parte 2 (45 min)

### Pruebas

#### 4.1 Añadir Sede (15 min)
- Ir a despacho del que eres owner
- Click "Añadir Sede"
- Completar formulario:
  - Nombre: Sede Test
  - Localidad: Madrid
  - Provincia: Madrid
  - Email: test@sede.com
  - Teléfono: 911111111
- Guardar y verificar
- Documentar → GES-4

#### 4.2 Editar Sede (10 min)
- Editar sede recién creada
- Cambiar nombre
- Verificar cambio
- Documentar → GES-5

#### 4.3 Cambiar Sede Principal (10 min)
- Cambiar sede principal
- Verificar que solo 1 es principal
- Documentar → GES-6

#### 4.4 Eliminar Sede (10 min)
- Eliminar sede de prueba
- Verificar que no permite si es única
- Documentar → GES-7

#### Resumen Sesión 4

```
## Resumen Sesión 4
Fecha: [FECHA]
Resultados: [completar]
```

Marcar: `[x] Sesión 4: Despachos Parte 2`

---

## 📊 SESIÓN 5: Leads y Admin (45 min)

### Pruebas

#### 5.1 Panel Admin (10 min)
- Ir a /dashboard/admin
- Explorar secciones
- Documentar → ADM-1

#### 5.2 Gestión Usuarios (15 min)
- Ir a /dashboard/admin/users
- Probar filtros
- Editar un usuario
- Documentar → ADM-3, ADM-4, ADM-5

#### 5.3 Solicitudes (10 min)
- Ir a /dashboard/admin/solicitudes
- Ver detalles
- Probar aprobar/rechazar si hay
- Documentar → ADM-13, ADM-14, ADM-15

#### 5.4 Marketplace Leads (10 min)
- Ir a /dashboard/leads
- Ver leads
- Probar filtros
- Documentar → LED-1, LED-2, LED-3

#### Resumen Sesión 5

```
## Resumen Sesión 5
Fecha: [FECHA]
Resultados: [completar]
```

Marcar: `[x] Sesión 5: Leads y Admin`

---

## 🎨 SESIÓN 6: UI/UX y Rendimiento (30 min)

### Pruebas

#### 6.1 Responsive (10 min)
- Abrir DevTools (F12)
- Probar Desktop, Tablet, Mobile
- Documentar → UI-1

#### 6.2 Navegación (10 min)
- Probar todos los links
- Verificar toasts
- Verificar loading states
- Documentar → UI-2, UI-4, UI-5

#### 6.3 Rendimiento (10 min)
- Medir tiempo de carga
- Verificar errores en consola
- Documentar → PERF-2

#### Resumen Final

```
## AUDITORÍA COMPLETA FINALIZADA

Fecha: [FECHA]
Tiempo total: [X] horas

Funcionan: X (X%)
Rotas: X (X%)
Parciales: X (X%)

Top 5 Problemas:
1. [problema]
2. [problema]
3. [problema]
4. [problema]
5. [problema]

Próximos pasos:
1. Revisar resumen
2. Priorizar correcciones
3. Actualizar PLAN-TAREAS.md
```

Marcar: `[x] Sesión 6: UI/UX`

---

## 📊 Progreso

```
Sesiones: 1/6

[x] Sesión 1: Autenticación
[ ] Sesión 2: Usuarios
[ ] Sesión 3: Despachos 1
[ ] Sesión 4: Despachos 2
[ ] Sesión 5: Leads/Admin
[ ] Sesión 6: UI/UX
```

---

## 🆘 Ayuda

**Si encuentras error:**
1. Documenta qué hiciste
2. Copia mensaje de error
3. Toma screenshot
4. Marca como ❌

**Si no puedes probar:**
1. Marca como ?
2. Añade nota explicando
3. Continúa

**Recuerda:**
- Tómate tu tiempo
- Documenta todo
- Commit al terminar sesión
- Puedes pausar cuando quieras

---

**¡Listo para empezar!**

Cuando estés listo:
1. Abre `docs/06-TAREAS/AUDITORIA.md`
2. Comienza con Sesión 1
3. Sigue las instrucciones paso a paso

¡Éxito! 🚀
