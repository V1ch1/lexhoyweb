# Flujos de gestión de despachos: Next.js ↔ WordPress ↔ Algolia

## 1. Fuente de la verdad
- Todos los despachos están en WordPress (WP).
- Algolia se sincroniza desde WP (solo datos públicos).
- Next.js es el panel de gestión y edición (no almacena despachos).

## 2. Flujos de usuario

### A. Despacho ya existe en WP y quiere actualizar datos
1. El despacho ve su ficha en el buscador (Algolia).
2. Contacta para actualizar datos.
3. Se le crea usuario/acceso en Next.js.
4. Se le asigna el despacho (relación usuario-despacho por ID).
5. Next.js trae los datos del despacho desde WP (GET /wp-json/wp/v2/despacho/{id} con autenticación).
6. El usuario edita y guarda cambios (PUT/PATCH a WP).
7. WP actualiza y sincroniza con Algolia.

### B. Despacho NO existe en WP y quiere darse de alta
1. El despacho se registra en Next.js (formulario de alta).
2. Rellena los datos de su despacho.
3. Next.js crea el despacho en WP (POST /wp-json/wp/v2/despacho con autenticación).
4. WP lo añade y sincroniza con Algolia.
5. El usuario queda vinculado a ese despacho para futuras ediciones.

### C. Despacho no hace nada (no contacta, no se registra)
- No aparece en el panel Next.js.
- No se trae ni gestiona nada de WP para él.

## 3. Resumen de integración Next.js ↔ WP
- Solo se traen datos de WP de los despachos gestionados (por ID).
- Para editar: GET y PUT/PATCH con autenticación.
- Para crear: POST con autenticación.
- Algolia se mantiene sincronizado desde WP.

## 4. Implementación en Next.js
- Formulario de alta de despacho (POST a WP).
- Formulario de edición de despacho (GET y PUT/PATCH a WP).
- Gestión de usuarios y vinculación usuario-despacho.
- Autenticación segura para llamadas a la API de WP.

---

Este documento resume los flujos y arquitectura para la gestión de despachos entre Next.js, WordPress y Algolia.