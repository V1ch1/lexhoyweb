-- Tabla para solicitudes de despacho
CREATE TABLE IF NOT EXISTS solicitudes_despacho (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  despacho_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
);

-- Relación con usuarios (asumiendo tabla usuarios con id TEXT)
-- ALTER TABLE solicitudes_despacho ADD FOREIGN KEY (user_id) REFERENCES usuarios(id);

-- Ejemplo de consulta de solicitudes por usuario
-- SELECT * FROM solicitudes_despacho WHERE user_id = ? ORDER BY fecha DESC;
