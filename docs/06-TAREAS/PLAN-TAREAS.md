# Plan de Tareas - Aplicación LexHoy

**Fecha de creación:** 2025-12-02  
**Estado:** En progreso  
**Prioridad:** Alta

---

## 📋 Leyenda

- `[ ]` - Pendiente
- `[/]` - En progreso
- `[x]` - Completado
- `[!]` - Bloqueado
- `[?]` - Requiere decisión

**Estimaciones:**
- 🟢 Pequeña (< 4h)
- 🟡 Mediana (4-8h)
- 🔴 Grande (> 8h)

---

## Fase 1: Completar Funcionalidades Core

### 1.1 Integración de Leads con LexHoy.com

**Prioridad:** 🔴 CRÍTICA  
**Estimación:** 🔴 Grande (12-16h)  
**Dependencias:** Ninguna

#### Tareas:

- [ ] **1.1.1** Configurar webhook en WordPress 🟡
  - [ ] Instalar/configurar plugin "Contact Form 7 to API"
  - [ ] Configurar URL del webhook: `/api/webhook/lexhoy`
  - [ ] Configurar secret key en WordPress
  - [ ] Verificar secret key en `.env.local` y Vercel
  - **Criterio de aceptación:** Formulario envía datos al webhook

- [ ] **1.1.2** Probar flujo end-to-end 🟡
  - [ ] Completar formulario en LexHoy.com
  - [ ] Verificar recepción en webhook
  - [ ] Verificar procesamiento con IA
  - [ ] Verificar creación de lead en Supabase
  - [ ] Verificar notificaciones enviadas
  - **Criterio de aceptación:** Lead aparece en dashboard de admin

- [ ] **1.1.3** Validar procesamiento con IA 🟢
  - [ ] Probar con diferentes tipos de consultas
  - [ ] Verificar extracción de especialidad
  - [ ] Verificar determinación de urgencia
  - [ ] Ajustar prompts si es necesario
  - **Criterio de aceptación:** 90% de precisión en clasificación

- [ ] **1.1.4** Implementar manejo de errores 🟢
  - [ ] Webhook retorna errores apropiados
  - [ ] Logging de errores en Supabase
  - [ ] Retry logic para fallos temporales
  - [ ] Notificación a admin si falla
  - **Criterio de aceptación:** Errores manejados gracefully

### 1.2 Sistema de Notificaciones

**Prioridad:** 🔴 ALTA  
**Estimación:** 🟡 Mediana (6-8h)  
**Dependencias:** 1.1

#### Tareas:

- [ ] **1.2.1** Email notifications 🟡
  - [ ] Configurar Resend/SendGrid
  - [ ] Crear plantillas de email
    - [ ] Nuevo lead disponible
    - [ ] Lead asignado
    - [ ] Solicitud aprobada/rechazada
    - [ ] Verificación de email
  - [ ] Implementar servicio de email
  - [ ] Testing de envío de emails
  - **Criterio de aceptación:** Emails se envían correctamente

- [ ] **1.2.2** Notificaciones en dashboard 🟢
  - [ ] Crear tabla `notifications` en Supabase
  - [ ] Componente de notificaciones
  - [ ] Badge de notificaciones no leídas
  - [ ] Marcar como leída
  - [ ] **Criterio de aceptación:** Usuario ve notificaciones en tiempo real

- [ ] **1.2.3** Preferencias de notificaciones 🟢
  - [ ] UI para configurar preferencias
  - [ ] Guardar preferencias en BD
  - [ ] Respetar preferencias al enviar
  - [ ] **Criterio de aceptación:** Usuario puede desactivar notificaciones

### 1.3 Sistema de Compra de Leads (MVP)

**Prioridad:** 🔴 ALTA  
**Estimación:** 🔴 Grande (16-20h)  
**Dependencias:** 1.1, 1.2

#### Tareas:

- [ ] **1.3.1** Integrar Stripe 🟡
  - [ ] Crear cuenta de Stripe
  - [ ] Configurar API keys
  - [ ] Instalar Stripe SDK
  - [ ] Crear productos en Stripe
  - [ ] **Criterio de aceptación:** Stripe configurado y funcionando

- [ ] **1.3.2** Lógica de compra directa 🔴
  - [ ] API endpoint `/api/leads/[id]/purchase`
  - [ ] Verificar disponibilidad del lead
  - [ ] Procesar pago con Stripe
  - [ ] Asignar lead a despacho
  - [ ] Actualizar estado del lead
  - [ ] Enviar notificaciones
  - [ ] **Criterio de aceptación:** Despacho puede comprar lead

- [ ] **1.3.3** UI de compra 🟡
  - [ ] Botón "Comprar" en lead card
  - [ ] Modal de confirmación
  - [ ] Mostrar precio
  - [ ] Mostrar información del lead
  - [ ] Proceso de pago
  - [ ] Confirmación de compra
  - [ ] **Criterio de aceptación:** UX fluida y clara

- [ ] **1.3.4** Historial de compras 🟢
  - [ ] Página "Mis Leads Comprados"
  - [ ] Lista de leads adquiridos
  - [ ] Filtros y búsqueda
  - [ ] Detalles de cada lead
  - [ ] **Criterio de aceptación:** Despacho ve todos sus leads

- [ ] **1.3.5** Sistema de créditos (opcional) 🟡
  - [ ] Tabla `despacho_credits` en Supabase
  - [ ] Comprar paquetes de créditos
  - [ ] Usar créditos para comprar leads
  - [ ] Historial de transacciones
  - [ ] **Criterio de aceptación:** Sistema de créditos funcional

### 1.4 Analytics Básicos de Leads

**Prioridad:** 🟡 MEDIA  
**Estimación:** 🟡 Mediana (6-8h)  
**Dependencias:** 1.3

#### Tareas:

- [ ] **1.4.1** Dashboard de métricas 🟡
  - [ ] Total de leads recibidos
  - [ ] Leads comprados
  - [ ] Leads contactados
  - [ ] Leads cerrados
  - [ ] Tasa de conversión
  - [ ] **Criterio de aceptación:** Dashboard muestra métricas correctas

- [ ] **1.4.2** Gráficos básicos 🟢
  - [ ] Gráfico de leads por mes
  - [ ] Gráfico de conversión
  - [ ] Distribución por especialidad
  - [ ] **Criterio de aceptación:** Gráficos visualizan datos correctamente

- [ ] **1.4.3** Reportes simples 🟢
  - [ ] Exportar a CSV
  - [ ] Filtrar por fecha
  - [ ] Filtrar por estado
  - [ ] **Criterio de aceptación:** Usuario puede exportar datos

### 1.5 Testing Unitario

**Prioridad:** 🔴 ALTA  
**Estimación:** 🔴 Grande (12-16h)  
**Dependencias:** 1.1, 1.2, 1.3

#### Tareas:

- [ ] **1.5.1** Configurar Jest y Testing Library 🟢
  - [ ] Instalar dependencias
  - [ ] Configurar jest.config.js
  - [ ] Configurar jest.setup.js
  - [ ] **Criterio de aceptación:** Tests pueden ejecutarse

- [ ] **1.5.2** Tests de UserService 🟡
  - [ ] Test createUser
  - [ ] Test promoteToDespachoAdmin
  - [ ] Test demoteToUsuario
  - [ ] Test updateProfile
  - [ ] **Criterio de aceptación:** >80% cobertura

- [ ] **1.5.3** Tests de DespachoService 🟡
  - [ ] Test createDespacho
  - [ ] Test updateDespacho
  - [ ] Test assignOwner
  - [ ] Test syncWithWordPress
  - [ ] **Criterio de aceptación:** >80% cobertura

- [ ] **1.5.4** Tests de LeadService 🟡
  - [ ] Test processLeadWithAI
  - [ ] Test assignLeadToDespacho
  - [ ] Test purchaseLead
  - [ ] **Criterio de aceptación:** >80% cobertura

- [ ] **1.5.5** Tests de componentes 🟡
  - [ ] Test DespachoCard
  - [ ] Test LeadCard
  - [ ] Test UserProfile
  - [ ] **Criterio de aceptación:** >75% cobertura

---

## Fase 2: Mejoras y Optimización

### 2.1 Sistema de Valoraciones

**Prioridad:** 🟡 MEDIA  
**Estimación:** 🟡 Mediana (8-10h)  
**Dependencias:** 1.3

#### Tareas:

- [ ] **2.1.1** Valorar leads 🟢
  - [ ] UI para valorar lead (1-5 estrellas)
  - [ ] Guardar valoración en BD
  - [ ] Mostrar valoración promedio
  - [ ] **Criterio de aceptación:** Despacho puede valorar leads

- [ ] **2.1.2** Feedback de clientes 🟢
  - [ ] Campo de texto para feedback
  - [ ] Guardar feedback
  - [ ] Mostrar a admin
  - [ ] **Criterio de aceptación:** Feedback se guarda correctamente

- [ ] **2.1.3** Reputación de despachos 🟡
  - [ ] Calcular puntuación promedio
  - [ ] Mostrar en perfil de despacho
  - [ ] Badge de "Top Rated"
  - [ ] **Criterio de aceptación:** Reputación visible públicamente

### 2.2 Mejoras en Búsqueda y Filtros

**Prioridad:** 🟡 MEDIA  
**Estimación:** 🟡 Mediana (6-8h)  
**Dependencias:** Ninguna

#### Tareas:

- [ ] **2.2.1** Filtros avanzados 🟡
  - [ ] Filtro por múltiples especialidades
  - [ ] Filtro por rango de presupuesto
  - [ ] Filtro por urgencia
  - [ ] Filtro por fecha
  - [ ] **Criterio de aceptación:** Filtros funcionan correctamente

- [ ] **2.2.2** Búsqueda geolocalizada 🟢
  - [ ] Búsqueda por distancia
  - [ ] Ordenar por cercanía
  - [ ] Mapa de resultados
  - [ ] **Criterio de aceptación:** Búsqueda por ubicación funciona

- [ ] **2.2.3** Ordenamiento personalizado 🟢
  - [ ] Ordenar por fecha
  - [ ] Ordenar por precio
  - [ ] Ordenar por relevancia
  - [ ] **Criterio de aceptación:** Ordenamiento funciona

### 2.3 Testing de Integración

**Prioridad:** 🔴 ALTA  
**Estimación:** 🔴 Grande (10-12h)  
**Dependencias:** 1.5

#### Tareas:

- [ ] **2.3.1** Tests de autenticación 🟡
  - [ ] Test flujo de registro completo
  - [ ] Test flujo de login
  - [ ] Test recuperación de contraseña
  - [ ] Test verificación de email
  - [ ] **Criterio de aceptación:** Todos los flujos probados

- [ ] **2.3.2** Tests de despachos 🟡
  - [ ] Test creación y sincronización
  - [ ] Test gestión de sedes
  - [ ] Test solicitud de propiedad
  - [ ] **Criterio de aceptación:** Sincronización verificada

- [ ] **2.3.3** Tests de leads 🟡
  - [ ] Test procesamiento de webhook
  - [ ] Test compra de lead
  - [ ] Test asignación
  - [ ] **Criterio de aceptación:** Flujo completo probado

### 2.4 Optimización de Rendimiento

**Prioridad:** 🟡 MEDIA  
**Estimación:** 🟡 Mediana (6-8h)  
**Dependencias:** Ninguna

#### Tareas:

- [ ] **2.4.1** Implementar caching 🟢
  - [ ] Cache de despachos
  - [ ] Cache de leads
  - [ ] Invalidación de cache
  - [ ] **Criterio de aceptación:** Tiempos de carga mejorados

- [ ] **2.4.2** Lazy loading 🟢
  - [ ] Lazy load de imágenes
  - [ ] Lazy load de componentes
  - [ ] Infinite scroll en listas
  - [ ] **Criterio de aceptación:** Carga inicial más rápida

- [ ] **2.4.3** Optimización de queries 🟡
  - [ ] Índices en BD
  - [ ] Queries optimizadas
  - [ ] Paginación eficiente
  - [ ] **Criterio de aceptación:** Queries <100ms

### 2.5 Mejoras de UX

**Prioridad:** 🟢 BAJA  
**Estimación:** 🟡 Mediana (6-8h)  
**Dependencias:** Ninguna

#### Tareas:

- [ ] **2.5.1** Animaciones 🟢
  - [ ] Transiciones suaves
  - [ ] Loading states
  - [ ] Skeleton screens
  - [ ] **Criterio de aceptación:** UX más fluida

- [ ] **2.5.2** Feedback visual 🟢
  - [ ] Toasts mejorados
  - [ ] Confirmaciones visuales
  - [ ] Estados de error claros
  - [ ] **Criterio de aceptación:** Usuario siempre sabe qué pasa

- [ ] **2.5.3** Accesibilidad 🟡
  - [ ] ARIA labels
  - [ ] Navegación por teclado
  - [ ] Contraste de colores
  - [ ] Screen reader support
  - [ ] **Criterio de aceptación:** WCAG 2.1 AA compliance

---

## Fase 3: Funcionalidades Avanzadas

### 3.1 Sistema de Subastas de Leads

**Prioridad:** 🟢 BAJA  
**Estimación:** 🔴 Grande (20-24h)  
**Dependencias:** 1.3

#### Tareas:

- [ ] **3.1.1** Lógica de pujas 🔴
  - [ ] Tabla `lead_bids` en Supabase
  - [ ] API para crear puja
  - [ ] Validar puja mínima
  - [ ] Actualizar puja más alta
  - [ ] **Criterio de aceptación:** Sistema de pujas funcional

- [ ] **3.1.2** Temporizador de subasta 🟡
  - [ ] Countdown timer
  - [ ] Auto-cierre de subasta
  - [ ] Asignación automática al ganador
  - [ ] **Criterio de aceptación:** Subasta se cierra automáticamente

- [ ] **3.1.3** Notificaciones en tiempo real 🟡
  - [ ] WebSocket o Server-Sent Events
  - [ ] Notificar nueva puja
  - [ ] Notificar cuando eres superado
  - [ ] Notificar ganador
  - [ ] **Criterio de aceptación:** Notificaciones instantáneas

- [ ] **3.1.4** UI de subastas 🟡
  - [ ] Vista de subasta activa
  - [ ] Historial de pujas
  - [ ] Formulario de puja
  - [ ] Indicador de tiempo restante
  - [ ] **Criterio de aceptación:** UX clara e intuitiva

### 3.2 Marketing Automation

**Prioridad:** 🟢 BAJA  
**Estimación:** 🔴 Grande (16-20h)  
**Dependencias:** 1.2

#### Tareas:

- [ ] **3.2.1** Campañas de email 🔴
  - [ ] Crear campaña
  - [ ] Diseñar email
  - [ ] Segmentar audiencia
  - [ ] Programar envío
  - [ ] Tracking de aperturas/clicks
  - [ ] **Criterio de aceptación:** Campaña se envía correctamente

- [ ] **3.2.2** Segmentación 🟡
  - [ ] Crear segmentos
  - [ ] Filtros avanzados
  - [ ] Guardar segmentos
  - [ ] **Criterio de aceptación:** Segmentación precisa

- [ ] **3.2.3** A/B testing 🟡
  - [ ] Crear variantes
  - [ ] Distribuir tráfico
  - [ ] Medir resultados
  - [ ] Declarar ganador
  - [ ] **Criterio de aceptación:** A/B test funcional

### 3.3 Mensajería Interna

**Prioridad:** 🟢 BAJA  
**Estimación:** 🔴 Grande (16-20h)  
**Dependencias:** Ninguna

#### Tareas:

- [ ] **3.3.1** Chat en tiempo real 🔴
  - [ ] Configurar WebSocket
  - [ ] Tabla `messages` en Supabase
  - [ ] Enviar mensaje
  - [ ] Recibir mensaje
  - [ ] **Criterio de aceptación:** Chat funciona en tiempo real

- [ ] **3.3.2** Historial de mensajes 🟡
  - [ ] Listar conversaciones
  - [ ] Ver historial completo
  - [ ] Buscar en mensajes
  - [ ] **Criterio de aceptación:** Historial accesible

- [ ] **3.3.3** Notificaciones de chat 🟢
  - [ ] Badge de mensajes no leídos
  - [ ] Notificación de nuevo mensaje
  - [ ] Marcar como leído
  - [ ] **Criterio de aceptación:** Usuario notificado de mensajes

### 3.4 Analytics Avanzados

**Prioridad:** 🟡 MEDIA  
**Estimación:** 🔴 Grande (12-16h)  
**Dependencias:** 1.4

#### Tareas:

- [ ] **3.4.1** Dashboards interactivos 🔴
  - [ ] Integrar Chart.js o Recharts
  - [ ] Gráficos interactivos
  - [ ] Drill-down en datos
  - [ ] **Criterio de aceptación:** Dashboards informativos

- [ ] **3.4.2** Reportes exportables 🟡
  - [ ] Exportar a PDF
  - [ ] Exportar a Excel
  - [ ] Reportes personalizados
  - [ ] **Criterio de aceptación:** Reportes se generan correctamente

- [ ] **3.4.3** Predicciones con IA 🟡
  - [ ] Predecir conversión de leads
  - [ ] Recomendar precio óptimo
  - [ ] Identificar patrones
  - [ ] **Criterio de aceptación:** Predicciones razonables

---

## Fase 4: Escalabilidad y Mobile

### 4.1 Optimización para Escala

**Prioridad:** 🟡 MEDIA  
**Estimación:** 🔴 Grande (16-20h)  
**Dependencias:** Todas las anteriores

#### Tareas:

- [ ] **4.1.1** CDN 🟢
  - [ ] Configurar Vercel CDN
  - [ ] Optimizar assets
  - [ ] Cache headers
  - [ ] **Criterio de aceptación:** Assets servidos desde CDN

- [ ] **4.1.2** Database optimization 🟡
  - [ ] Índices adicionales
  - [ ] Particionamiento de tablas
  - [ ] Connection pooling
  - [ ] **Criterio de aceptación:** Queries optimizadas

- [ ] **4.1.3** Microservicios (opcional) 🔴
  - [ ] Separar servicios críticos
  - [ ] API Gateway
  - [ ] Load balancing
  - [ ] **Criterio de aceptación:** Arquitectura escalable

### 4.2 Testing E2E Completo

**Prioridad:** 🔴 ALTA  
**Estimación:** 🔴 Grande (16-20h)  
**Dependencias:** Todas las funcionalidades

#### Tareas:

- [ ] **4.2.1** Configurar Playwright 🟢
  - [ ] Instalar Playwright
  - [ ] Configurar playwright.config.ts
  - [ ] Setup de fixtures
  - [ ] **Criterio de aceptación:** Playwright configurado

- [ ] **4.2.2** Tests de flujos críticos 🔴
  - [ ] Test registro completo
  - [ ] Test solicitud de despacho
  - [ ] Test compra de lead
  - [ ] Test gestión de sedes
  - [ ] **Criterio de aceptación:** Todos los flujos probados

- [ ] **4.2.3** Tests de carga 🟡
  - [ ] Configurar k6 o Artillery
  - [ ] Test de carga de API
  - [ ] Test de carga de BD
  - [ ] **Criterio de aceptación:** Sistema soporta carga esperada

- [ ] **4.2.4** Tests de seguridad 🟡
  - [ ] Test de autenticación
  - [ ] Test de autorización
  - [ ] Test de inyección SQL
  - [ ] Test de XSS
  - [ ] **Criterio de aceptación:** Vulnerabilidades identificadas y corregidas

### 4.3 App Móvil (React Native)

**Prioridad:** 🟢 BAJA  
**Estimación:** 🔴 Muy Grande (40-60h)  
**Dependencias:** Todas las funcionalidades core

#### Tareas:

- [ ] **4.3.1** Setup de React Native 🟡
  - [ ] Inicializar proyecto
  - [ ] Configurar navegación
  - [ ] Configurar estado global
  - [ ] **Criterio de aceptación:** App básica funciona

- [ ] **4.3.2** Pantallas principales 🔴
  - [ ] Login/Registro
  - [ ] Dashboard
  - [ ] Lista de leads
  - [ ] Detalle de lead
  - [ ] Perfil de despacho
  - [ ] **Criterio de aceptación:** Pantallas implementadas

- [ ] **4.3.3** Push notifications 🟡
  - [ ] Configurar Firebase
  - [ ] Enviar notificaciones
  - [ ] Manejar notificaciones
  - [ ] **Criterio de aceptación:** Notificaciones funcionan

- [ ] **4.3.4** Publicar en stores 🟡
  - [ ] Build de producción
  - [ ] Publicar en App Store
  - [ ] Publicar en Google Play
  - [ ] **Criterio de aceptación:** App disponible en stores

---

## Tareas de Documentación

### Documentación Técnica

- [x] **DOC-1** Documentación maestra completa 🔴
- [ ] **DOC-2** Guía de contribución 🟢
- [ ] **DOC-3** Guía de deployment 🟢
- [ ] **DOC-4** Troubleshooting guide 🟡
- [ ] **DOC-5** API documentation (Swagger) 🟡

### Documentación de Usuario

- [ ] **DOC-6** Manual de usuario 🟡
- [ ] **DOC-7** FAQs 🟢
- [ ] **DOC-8** Video tutoriales 🔴
- [ ] **DOC-9** Guía de inicio rápido 🟢

---

## Tareas de Deployment

### Configuración de Entornos

- [x] **DEP-1** Entorno de desarrollo configurado
- [ ] **DEP-2** Entorno de staging 🟡
- [ ] **DEP-3** Entorno de producción 🟡
- [ ] **DEP-4** CI/CD pipeline 🟡

### Monitoreo y Logging

- [ ] **DEP-5** Configurar Sentry 🟢
- [ ] **DEP-6** Configurar analytics (Google Analytics/Plausible) 🟢
- [ ] **DEP-7** Configurar uptime monitoring 🟢
- [ ] **DEP-8** Configurar alertas 🟢

---

## Resumen de Progreso

### Por Fase

- **Fase 1:** 0/25 tareas completadas (0%)
- **Fase 2:** 0/20 tareas completadas (0%)
- **Fase 3:** 0/15 tareas completadas (0%)
- **Fase 4:** 0/15 tareas completadas (0%)

### Por Prioridad

- **🔴 CRÍTICA:** 0/5 completadas
- **🔴 ALTA:** 0/15 completadas
- **🟡 MEDIA:** 0/25 completadas
- **🟢 BAJA:** 0/30 completadas

### Total General

**0/75 tareas completadas (0%)**

---

## Notas

- Este documento debe actualizarse semanalmente
- Marcar tareas como completadas cuando pasen todos los tests
- Añadir nuevas tareas según surjan necesidades
- Priorizar según feedback de usuarios

---

## Fase 5: Mejoras de Responsive Design

### 5.1 Responsive - Páginas Públicas

**Prioridad:** 🔴 ALTA  
**Estimación:** 🟡 Mediana (6-8h)  
**Dependencias:** Ninguna

#### Tareas:

- [x] **5.1.1** Planificación de mejoras responsive 🟢
  - [x] Analizar estructura actual de navegación
  - [x] Identificar páginas públicas a mejorar
  - [x] Crear plan de tareas detallado
  - **Criterio de aceptación:** Plan documentado y aprobado

- [x] **5.1.2** Componente de menú hamburguesa 🟡
  - [x] Diseñar icono hamburguesa animado
  - [x] Implementar menú lateral deslizante (slide-in)
  - [x] Añadir overlay de fondo oscuro
  - [x] Animaciones de apertura/cierre
  - **Criterio de aceptación:** Menú hamburguesa funcional y animado ✅

- [x] **5.1.3** Actualizar Navbar.tsx responsive 🟡
  - [x] Ocultar navegación central en móvil (md:flex)
  - [x] Mostrar hamburguesa en móvil
  - [x] Incluir enlaces a páginas en menú móvil
  - [x] Incluir botones Login/Register en menú móvil
  - [x] Mantener logo visible en todas las resoluciones
  - [x] Gestionar estado de usuario autenticado en móvil
  - **Criterio de aceptación:** Navbar totalmente responsive ✅

- [x] **5.1.4** Verificar responsive en páginas públicas 🟢
  - [x] Página principal (`/`)
  - [x] Sobre Nosotros (`/sobre-nosotros`)
  - [x] Servicios (`/servicios`)
  - [x] Contacto (`/contacto`)
  - [x] Login (`/login`)
  - [x] Register (`/register`)
  - [x] Forgot Password (`/forgot-password`)
  - [x] Reset Password (`/reset-password`)
  - **Criterio de aceptación:** Todas las páginas se ven bien en móvil ✅

### 5.2 Responsive - Dashboard

**Prioridad:** 🔴 ALTA  
**Estimación:** 🔴 Grande (12-16h)  
**Dependencias:** 5.1

#### Tareas:

- [ ] **5.2.1** Analizar estructura del dashboard 🟢
  - [ ] Revisar `Sidebar.tsx`
  - [ ] Revisar `NavbarDashboard.tsx`
  - [ ] Identificar componentes que necesitan ajustes
  - [ ] Listar todas las páginas del dashboard
  - **Criterio de aceptación:** Análisis completo documentado

- [ ] **5.2.2** Implementar sidebar responsive 🔴
  - [ ] Sidebar colapsable en móvil
  - [ ] Hamburguesa para abrir/cerrar sidebar
  - [ ] Overlay cuando sidebar está abierto en móvil
  - [ ] Transiciones suaves
  - [ ] Persistir estado de sidebar (localStorage)
  - [ ] Ajustar ancho del contenido principal
  - **Criterio de aceptación:** Sidebar funciona perfectamente en móvil

- [ ] **5.2.3** Ajustar NavbarDashboard responsive 🟡
  - [ ] Adaptar para móvil
  - [ ] Botón hamburguesa integrado
  - [ ] Notificaciones responsive
  - [ ] Menú de usuario responsive
  - **Criterio de aceptación:** NavbarDashboard responsive

- [ ] **5.2.4** Ajustar tablas y componentes 🔴
  - [ ] Hacer tablas scrollables horizontalmente en móvil
  - [ ] Ajustar cards y grids para móvil
  - [ ] Revisar formularios en móvil
  - [ ] Ajustar modales para móvil
  - [ ] Breadcrumbs responsive
  - **Criterio de aceptación:** Todos los componentes responsive

- [ ] **5.2.5** Verificar páginas del dashboard 🔴
  - [ ] Dashboard principal
  - [ ] Gestión de despachos
  - [ ] Gestión de leads
  - [ ] Aprobar leads (admin)
  - [ ] Configuración de perfil
  - [ ] Configuración de despacho
  - [ ] Páginas de admin
  - **Criterio de aceptación:** Todas las páginas responsive

- [ ] **5.2.6** Testing responsive completo 🟡
  - [ ] Probar en diferentes resoluciones
  - [ ] Probar en dispositivos reales
  - [ ] Probar orientación portrait/landscape
  - [ ] Verificar touch interactions
  - **Criterio de aceptación:** Funciona en todos los dispositivos

---

**Última actualización:** 2025-12-04  
**Próxima revisión:** 2025-12-11
