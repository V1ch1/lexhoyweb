-- Crear bucket para imágenes de entradas en proyecto
INSERT INTO storage.buckets (id, name, public)
VALUES ('entradas-proyecto', 'entradas-proyecto', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket
-- Permitir que todos puedan leer las imágenes
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'entradas-proyecto');

-- Solo super admins pueden subir imágenes
CREATE POLICY "Super admins can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'entradas-proyecto'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.rol = 'super_admin'
  )
);

-- Solo super admins pueden actualizar imágenes
CREATE POLICY "Super admins can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'entradas-proyecto'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.rol = 'super_admin'
  )
);

-- Solo super admins pueden eliminar imágenes
CREATE POLICY "Super admins can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'entradas-proyecto'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.rol = 'super_admin'
  )
);
