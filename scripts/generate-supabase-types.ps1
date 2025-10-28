# Script para generar tipos de Supabase
try {
    # Ejecutar el comando y capturar la salida
    $output = npx supabase gen types typescript --project-id oepcitgbnqylfpdryffx 2>&1
    
    # Verificar si hubo errores
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al generar tipos: $output"
        exit 1
    }
    
    # Guardar la salida en el archivo
    $output | Out-File -FilePath "types/supabase.ts" -Encoding utf8
    
    Write-Host "¡Tipos generados correctamente en types/supabase.ts!"
} catch {
    Write-Error "Error inesperado: $_"
    exit 1
}
