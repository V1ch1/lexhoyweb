# LISTADO DE TAREAS PRIORIZADAS

Fecha: 10 de noviembre de 2025

---

## PRIORIDAD 1: SINCRONIZACION ALGOLIA (CRITICA)

### Tarea 1.1: Configurar credenciales Algolia
- [ ] Obtener ALGOLIA_APP_ID
- [ ] Obtener ALGOLIA_SEARCH_KEY
- [ ] Obtener ALGOLIA_ADMIN_KEY
- [ ] Anadir a .env.local

### Tarea 1.2: Crear servicio de Algolia
- [ ] Crear archivo lib/algoliaService.ts
- [ ] Implementar metodo sincronizarDespacho()
- [ ] Implementar metodo eliminarDespacho()
- [ ] Implementar metodo sincronizarTodos()
- [ ] Probar con despacho de prueba

### Tarea 1.3: Integrar en endpoints existentes
- [ ] Modificar app/api/despachos/[id]/route.ts (PUT)
- [ ] Modificar app/api/despachos/crear/route.ts (POST)
- [ ] Modificar app/api/despachos/[id]/route.ts (DELETE)
- [ ] Anadir campo sincronizado_algolia en tabla despachos

### Tarea 1.4: Cola de sincronizacion
- [ ] Crear migracion create_sync_queue.sql
- [ ] Crear lib/syncQueue.ts
- [ ] Implementar procesamiento automatico
- [ ] Crear endpoint para procesar cola manualmente

### Tarea 1.5: Panel de administracion
- [ ] Crear app/admin/sincronizacion/page.tsx
- [ ] Mostrar estado de sincronizacion
- [ ] Boton para forzar sincronizacion
- [ ] Ver logs de errores

---

## PRIORIDAD 2: SISTEMA DE LEADS (CRITICA)

### Tarea 2.1: Base de datos
- [ ] Crear migracion leads_marketplace.sql
- [ ] Crear migracion leads_compras.sql
- [ ] Crear migracion leads_interacciones.sql
- [ ] Ejecutar migraciones en Supabase

### Tarea 2.2: Configurar OpenAI
- [ ] Obtener OPENAI_API_KEY
- [ ] Anadir a .env.local
- [ ] Instalar dependencia: npm install openai

### Tarea 2.3: Servicio de IA
- [ ] Crear lib/leadAIService.ts
- [ ] Implementar procesarLead()
- [ ] Implementar validarAnonimizacion()
- [ ] Probar con consultas de ejemplo

### Tarea 2.4: API de captura
- [ ] Crear app/api/leads/capturar/route.ts
- [ ] Validar datos de entrada
- [ ] Procesar con IA
- [ ] Guardar en BD
- [ ] Notificar a super_admin
- [ ] Enviar email confirmacion a cliente

### Tarea 2.5: Panel admin - Aprobar leads
- [ ] Crear app/admin/leads/pendientes/page.tsx
- [ ] Listar leads pendientes
- [ ] Mostrar resumen anonimo
- [ ] Input para editar precio
- [ ] Boton aprobar
- [ ] Boton rechazar
- [ ] Boton ver consulta original (solo admin)

### Tarea 2.6: APIs de admin
- [ ] Crear app/api/admin/leads/aprobar/route.ts
- [ ] Crear app/api/admin/leads/rechazar/route.ts
- [ ] Validaciones de permisos
- [ ] Notificaciones

### Tarea 2.7: Marketplace - Interfaz
- [ ] Crear app/dashboard/leads/marketplace/page.tsx
- [ ] Listar leads publicados
- [ ] Filtros: especialidad, provincia, precio
- [ ] Cards con resumen anonimo
- [ ] Boton comprar lead

### Tarea 2.8: Marketplace - API
- [ ] Crear app/api/leads/marketplace/route.ts
- [ ] Endpoint GET con filtros
- [ ] Paginacion
- [ ] Ordenamiento

### Tarea 2.9: Sistema de compra
- [ ] Crear app/api/leads/comprar/route.ts
- [ ] Validar disponibilidad
- [ ] Validar no duplicados
- [ ] Registrar compra
- [ ] Revelar datos
- [ ] Notificar despacho
- [ ] Actualizar estado lead a "vendido"

### Tarea 2.10: Leads comprados
- [ ] Crear app/dashboard/leads/comprados/page.tsx
- [ ] Listar leads comprados por despacho
- [ ] Mostrar datos completos del cliente
- [ ] Formulario para registrar interacciones
- [ ] Historial de interacciones

---

## PRIORIDAD 3: MEJORAS Y OPTIMIZACIONES

### Tarea 3.1: Sistema de creditos (futuro)
- [ ] Tabla creditos_despacho
- [ ] Comprar creditos
- [ ] Usar creditos para comprar leads

### Tarea 3.2: Integracion de pagos (futuro)
- [ ] Configurar Stripe
- [ ] Endpoint de checkout
- [ ] Webhook de confirmacion
- [ ] Historial de pagos

### Tarea 3.3: Analytics
- [ ] Dashboard de metricas
- [ ] Leads por especialidad
- [ ] Conversion rate
- [ ] Revenue tracking

### Tarea 3.4: Notificaciones push
- [ ] Configurar Firebase
- [ ] Notificaciones de nuevos leads
- [ ] Notificaciones de compras

---

## ESTIMACION DE TIEMPOS

### Sincronizacion Algolia: 1-2 semanas
- Tarea 1.1: 1 hora
- Tarea 1.2: 4-6 horas
- Tarea 1.3: 3-4 horas
- Tarea 1.4: 4-5 horas
- Tarea 1.5: 3-4 horas

### Sistema de Leads: 3-4 semanas
- Tarea 2.1: 2-3 horas
- Tarea 2.2: 1 hora
- Tarea 2.3: 6-8 horas
- Tarea 2.4: 4-5 horas
- Tarea 2.5: 5-6 horas
- Tarea 2.6: 3-4 horas
- Tarea 2.7: 6-8 horas
- Tarea 2.8: 3-4 horas
- Tarea 2.9: 6-8 horas
- Tarea 2.10: 4-5 horas

### Total estimado: 4-6 semanas

---

## ORDEN DE EJECUCION RECOMENDADO

1. Configurar credenciales (Algolia + OpenAI)
2. Sincronizacion Algolia completa
3. Base de datos de leads
4. Servicio de IA
5. API de captura
6. Panel admin
7. Marketplace
8. Sistema de compra
9. Testing completo
10. Documentacion

---

## CHECKLIST ANTES DE EMPEZAR

- [ ] Revisar este documento completo
- [ ] Revisar RESUMEN_ESTADO_Y_PLAN.md
- [ ] Revisar ANALISIS_COMPLETO_PROYECTO.md
- [ ] Tener acceso a Supabase
- [ ] Tener acceso a WordPress
- [ ] Tener acceso a Algolia
- [ ] Obtener API key de OpenAI
- [ ] Configurar .env.local
- [ ] Hacer backup de BD

---

## PROXIMOS PASOS INMEDIATOS

### HOY
1. Obtener credenciales de Algolia
2. Crear lib/algoliaService.ts
3. Probar sincronizacion basica

### MANANA
1. Integrar en endpoints
2. Crear cola de sincronizacion
3. Testing

### ESTA SEMANA
1. Completar sincronizacion Algolia
2. Crear tablas de leads
3. Configurar OpenAI

---

Ultima actualizacion: 10 de noviembre de 2025
