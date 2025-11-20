-- Función para incrementar contadores de forma atómica
CREATE OR REPLACE FUNCTION increment(table_name text, row_id uuid, column_name text, amount int)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + %L WHERE id = %L', table_name, column_name, column_name, amount, row_id);
END;
$$;
