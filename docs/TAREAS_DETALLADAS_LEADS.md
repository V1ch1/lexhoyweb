# TAREAS DETALLADAS - SISTEMA DE LEADS CON IA

Fecha: 10 de noviembre de 2025

## OBJETIVO

Implementar sistema completo de leads donde:
1. Formularios de lexhoy.com capturan consultas
2. IA procesa y anonimiza datos
3. Admin revisa y aprueba con precio
4. Despachos compran leads
5. Datos se revelan tras compra

## FASE 1: BASE DE DATOS

### Crear tabla leads_marketplace
### Crear tabla leads_compras  
### Crear tabla leads_interacciones

## FASE 2: SERVICIO DE IA

### Implementar lib/leadAIService.ts
- Procesar lead con OpenAI
- Generar resumen anonimo
- Detectar especialidad
- Evaluar urgencia y complejidad
- Sugerir precio

## FASE 3: API DE CAPTURA

### Endpoint /api/leads/capturar
- Recibir formularios
- Validar datos
- Procesar con IA
- Guardar en BD
- Notificar admin

## FASE 4: PANEL ADMIN

### Pagina /admin/leads/pendientes
- Listar leads pendientes
- Ver resumen anonimo
- Editar precio
- Aprobar o rechazar

## FASE 5: MARKETPLACE

### Pagina /dashboard/leads/marketplace
- Listar leads publicados
- Filtros
- Comprar leads

### Pagina /dashboard/leads/comprados
- Ver leads comprados
- Datos completos del cliente
