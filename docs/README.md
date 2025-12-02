# 📚 Documentación LexHoy

**Versión:** 3.0  
**Última actualización:** 2025-12-02  
**Estado:** Activo

---

## ⚡ INICIO RÁPIDO

### 📅 Rutina Diaria

**1. Al empezar el día, abre:**
```
docs/06-TAREAS/PLAN-TAREAS.md
```

**2. Selecciona tu tarea y márcala como `[/]` (en progreso)**

**3. Consulta el módulo relevante:**
```
docs/03-MODULOS/[MODULO].md
```

**4. Al terminar, prueba con:**
```
docs/06-TAREAS/AUDITORIA.md
```

**5. Marca la tarea como `[x]` (completada)**

### 🎯 Documentos Clave

| Documento | Cuándo Usar | Importancia |
|-----------|-------------|-------------|
| [QUICK-START.md](00-INICIO/QUICK-START.md) | Primera vez | ⭐⭐⭐ |
| [PLAN-TAREAS.md](06-TAREAS/PLAN-TAREAS.md) | **Cada día** | ⭐⭐⭐⭐⭐ |
| [AUDITORIA.md](06-TAREAS/AUDITORIA.md) | Al probar | ⭐⭐⭐⭐ |
| [Módulos](03-MODULOS/) | Al desarrollar | ⭐⭐⭐⭐ |

---

## 📂 Estructura de Documentación

La documentación está organizada por módulos para facilitar su mantenimiento y consulta:

```
docs/
├── README.md                           # Este archivo - Índice principal
│
├── 00-INICIO/                          # Documentación de inicio
│   ├── VISION-GENERAL.md              # Visión general del proyecto
│   ├── QUICK-START.md                 # Guía de inicio rápido
│   └── GLOSARIO.md                    # Términos y definiciones
│
├── 01-ARQUITECTURA/                    # Arquitectura del sistema
│   ├── STACK-TECNOLOGICO.md           # Stack y tecnologías
│   ├── ESTRUCTURA-PROYECTO.md         # Estructura de carpetas
│   ├── FLUJO-DATOS.md                 # Flujo de datos
│   └── INTEGRACIONES.md               # Integraciones externas
│
├── 02-BASE-DATOS/                      # Base de datos
│   ├── ESQUEMA.md                     # Esquema completo
│   ├── TABLAS.md                      # Descripción de tablas
│   └── MIGRACIONES.md                 # Guía de migraciones
│
├── 03-MODULOS/                         # Documentación por módulo
│   ├── USUARIOS.md                    # Módulo de usuarios
│   ├── DESPACHOS.md                   # Módulo de despachos
│   ├── LEADS.md                       # Módulo de leads
│   ├── MARKETING.md                   # Módulo de marketing
│   └── ADMIN.md                       # Panel de administración
│
├── 04-API/                             # Documentación de API
│   ├── ENDPOINTS.md                   # Lista de endpoints
│   ├── AUTENTICACION.md               # Autenticación y autorización
│   └── EJEMPLOS.md                    # Ejemplos de uso
│
├── 05-DESARROLLO/                      # Guías de desarrollo
│   ├── SETUP.md                       # Configuración del entorno
│   ├── TESTING.md                     # Guía de testing
│   ├── DEPLOYMENT.md                  # Guía de deployment
│   └── CONTRIBUTING.md                # Guía de contribución
│
├── 06-TAREAS/                          # Gestión de tareas
│   ├── PLAN-TAREAS.md                 # Plan maestro de tareas
│   ├── AUDITORIA.md                   # Checklist de auditoría
│   └── ROADMAP.md                     # Roadmap del proyecto
│
└── 99-ARCHIVO/                         # Documentación obsoleta
    └── (documentos antiguos)
```

---

## 🚀 Inicio Rápido

### Para Desarrolladores Nuevos

1. **Lee primero:**
   - [Visión General](00-INICIO/VISION-GENERAL.md)
   - [Quick Start](00-INICIO/QUICK-START.md)
   - [Setup de Desarrollo](05-DESARROLLO/SETUP.md)

2. **Familiarízate con:**
   - [Stack Tecnológico](01-ARQUITECTURA/STACK-TECNOLOGICO.md)
   - [Estructura del Proyecto](01-ARQUITECTURA/ESTRUCTURA-PROYECTO.md)
   - [Esquema de Base de Datos](02-BASE-DATOS/ESQUEMA.md)

3. **Comienza a desarrollar:**
   - [Guía de Contribución](05-DESARROLLO/CONTRIBUTING.md)
   - [Testing](05-DESARROLLO/TESTING.md)

### Para Product Managers

1. **Estado del proyecto:**
   - [Plan de Tareas](06-TAREAS/PLAN-TAREAS.md)
   - [Roadmap](06-TAREAS/ROADMAP.md)

2. **Funcionalidades:**
   - [Módulo de Usuarios](03-MODULOS/USUARIOS.md)
   - [Módulo de Despachos](03-MODULOS/DESPACHOS.md)
   - [Módulo de Leads](03-MODULOS/LEADS.md)

### Para QA/Testing

1. **Auditoría:**
   - [Checklist de Auditoría](06-TAREAS/AUDITORIA.md)
   - [Guía de Testing](05-DESARROLLO/TESTING.md)

---

## 📖 Guía de Documentos por Categoría

### 00 - Inicio

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| VISION-GENERAL.md | Qué es LexHoy, objetivos, usuarios | Al empezar |
| QUICK-START.md | Guía rápida de 5 minutos | Primer día |
| GLOSARIO.md | Términos técnicos y de negocio | Cuando surjan dudas |

### 01 - Arquitectura

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| STACK-TECNOLOGICO.md | Next.js, Supabase, WordPress, etc. | Setup inicial |
| ESTRUCTURA-PROYECTO.md | Organización de carpetas y archivos | Al navegar el código |
| FLUJO-DATOS.md | Cómo fluyen los datos en el sistema | Al diseñar features |
| INTEGRACIONES.md | WordPress, Algolia, OpenAI | Al trabajar con integraciones |

### 02 - Base de Datos

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| ESQUEMA.md | Diagrama y relaciones completas | Al trabajar con BD |
| TABLAS.md | Descripción detallada de cada tabla | Al crear queries |
| MIGRACIONES.md | Cómo hacer cambios en la BD | Al modificar esquema |

### 03 - Módulos

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| USUARIOS.md | Roles, permisos, autenticación | Al trabajar con usuarios |
| DESPACHOS.md | Ownership, sedes, sincronización | Al trabajar con despachos |
| LEADS.md | Procesamiento, marketplace, compra | Al trabajar con leads |
| MARKETING.md | Campañas, emails, analytics | Al trabajar con marketing |
| ADMIN.md | Panel de administración | Al trabajar en admin |

### 04 - API

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| ENDPOINTS.md | Lista completa de endpoints | Al consumir API |
| AUTENTICACION.md | Cómo autenticar requests | Al crear endpoints |
| EJEMPLOS.md | Ejemplos de uso de la API | Al integrar |

### 05 - Desarrollo

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| SETUP.md | Configurar entorno local | Primer día |
| TESTING.md | Cómo escribir y ejecutar tests | Al desarrollar |
| DEPLOYMENT.md | Cómo hacer deploy | Al publicar cambios |
| CONTRIBUTING.md | Estándares de código y commits | Antes de contribuir |

### 06 - Tareas

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| PLAN-TAREAS.md | Todas las tareas pendientes | Al planificar sprints |
| AUDITORIA.md | Checklist de verificación | Al probar |
| ROADMAP.md | Visión a futuro del proyecto | Al planificar |

---

## 🔄 Mantenimiento de Documentación

### Cuándo Actualizar

- ✅ **Al añadir features:** Actualiza el módulo correspondiente
- ✅ **Al cambiar BD:** Actualiza ESQUEMA.md y TABLAS.md
- ✅ **Al crear endpoints:** Actualiza ENDPOINTS.md
- ✅ **Al completar tareas:** Marca en PLAN-TAREAS.md
- ✅ **Al encontrar bugs:** Documenta en AUDITORIA.md

### Cómo Actualizar

1. Edita el documento correspondiente
2. Actualiza la fecha en el header
3. Si es un cambio importante, actualiza este README
4. Commit con mensaje descriptivo

---

## 📊 Estado Actual del Proyecto

**Última auditoría:** 2025-12-02

### Módulos Implementados

- ✅ **Autenticación:** 100% - Funcional
- ✅ **Usuarios:** 90% - Funcional con mejoras pendientes
- ✅ **Despachos:** 95% - Funcional, falta testing
- ⚠️ **Leads:** 60% - Parcialmente implementado
- ⚠️ **Marketing:** 20% - Estructura básica
- ✅ **Admin:** 85% - Funcional

### Prioridades Actuales

1. 🔴 Completar integración de leads con LexHoy.com
2. 🔴 Implementar sistema de compra de leads
3. 🟡 Crear suite de testing completa
4. 🟡 Mejorar módulo de marketing

---

## 🔗 Enlaces Rápidos

### Documentación Externa

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Algolia Docs](https://www.algolia.com/doc/)

### Repositorios

- **Frontend/Backend:** [github.com/V1ch1/lexhoyweb](https://github.com/V1ch1/lexhoyweb)
- **WordPress:** LexHoy.com

### Ambientes

- **Producción:** https://lexhoyweb.vercel.app
- **WordPress:** https://lexhoy.com
- **Staging:** (pendiente)

---

## 💡 Consejos

### Para encontrar información rápido:

1. **¿Cómo funciona X?** → Busca en `03-MODULOS/`
2. **¿Qué endpoint usar?** → Ve a `04-API/ENDPOINTS.md`
3. **¿Cómo configurar?** → Lee `05-DESARROLLO/SETUP.md`
4. **¿Qué hacer ahora?** → Revisa `06-TAREAS/PLAN-TAREAS.md`
5. **¿Estructura de BD?** → Consulta `02-BASE-DATOS/ESQUEMA.md`

### Atajos de búsqueda:

```bash
# Buscar en toda la documentación
grep -r "término" docs/

# Buscar solo en módulos
grep -r "término" docs/03-MODULOS/

# Ver estructura
tree docs/
```

---

## 📝 Changelog de Documentación

### 2025-12-02 - v3.0
- ✨ Reorganización completa en estructura modular
- 🗑️ Archivado de documentación obsoleta
- ✅ Creación de documentos por módulo
- 📚 Nuevo sistema de navegación

### 2025-11-03 - v2.0
- Documentación de despachos y sedes
- Plan de tareas inicial

### 2025-10-XX - v1.0
- Documentación inicial del proyecto

---

**Mantenido por:** José Ramón Blanco Casal  
**Contribuidores:** Antigravity AI  
**Licencia:** Privado
