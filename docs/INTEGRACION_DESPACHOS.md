# Esquema de Integración de Despachos: WordPress, Algolia y Next.js

## Diagrama General

```
+-------------------+         REST API (autenticada)         +-------------------+
|                   | <------------------------------------> |                   |
|   Next.js (LexHoy)|                                        |   WordPress (CPT) |
|     Frontend SPA  |                                        |   "despacho"      |
|                   | <------------------------------------> |                   |
+-------------------+         (GET, POST, PUT, DELETE)       +-------------------+
         |                                                           |
         |                                                           |
         |                                                           v
         |                                                +-------------------+
         |                                                |                   |
         |                                                |     Algolia       |
         |                                                |   (buscador)      |
         |                                                |                   |
         |                                                +-------------------+
         |                                                        ^
         |                                                        |
         +--------------------------------------------------------+
                        (WordPress actualiza Algolia
                         automáticamente tras cambios)
```

## Flujo recomendado

1. **Lectura de datos**  
   Next.js obtiene los despachos desde la REST API de WordPress (endpoint personalizado para el CPT).
2. **Edición/Alta/Baja**  
   Next.js envía los cambios (crear, editar, eliminar) a WordPress usando la REST API autenticada.
3. **Sincronización con Algolia**  
   WordPress, tras cada cambio, actualiza Algolia (mediante tu plugin o webhook).
4. **Búsqueda**  
   Next.js puede usar Algolia para búsquedas rápidas, pero nunca para edición.

## Notas clave

- **WordPress es la fuente de la verdad.**
- **Algolia solo para búsqueda, nunca para edición.**
- **Autenticación:** Usa JWT, OAuth o Application Passwords para proteger los endpoints de edición.
- **Extensibilidad:** Puedes añadir webhooks para otras integraciones futuras.

---

## Siguiente paso

- Definir endpoints REST para el CPT de despachos en WordPress.
- Implementar autenticación segura para edición desde Next.js.
- Garantizar que WordPress actualiza Algolia tras cada cambio.
