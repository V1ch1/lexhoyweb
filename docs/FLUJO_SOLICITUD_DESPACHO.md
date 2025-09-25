# Flujo de Solicitud y Creación de Despacho

## 1. Solicitud de despacho

- El usuario solicita vinculación a un despacho (nuevo o existente).
- Se sincroniza y crea el despacho en Supabase (si no existe) usando `/api/sync-despacho`.
- Se crea una entrada en la tabla `solicitudes_despacho` con estado `pendiente` y el ID del despacho.

## 2. Visualización y edición

- El admin puede ver y editar el despacho en el front en cualquier estado.
- El usuario solo puede ver y editar el despacho cuando la solicitud ha sido aprobada y el despacho está asignado a él.
- El despacho puede tener estado `borrador` o `pendiente` hasta que el super admin lo apruebe.

## 3. Aprobación o denegación

- El super admin revisa la solicitud y el despacho ya creado.
- Si aprueba, cambia el estado a `aprobado` y asigna el despacho al usuario.
- Si deniega, cambia el estado a `rechazado`.

## Ventajas

- El usuario ve y puede completar el despacho antes de la aprobación.
- El admin puede revisar y editar datos antes de aprobar.
- No hay errores de sincronización tardía ni datos incompletos al aprobar.

---

**Este flujo garantiza que los datos del despacho estén siempre disponibles y editables antes de la aprobación final.**
