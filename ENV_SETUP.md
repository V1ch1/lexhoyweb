# Configuración de Variables de Entorno

## WordPress API - Acceso a Borradores

Para que la sección de Marketing pueda acceder a entradas en borrador de WordPress, necesitas configurar las siguientes variables de entorno:

### Paso 1: Crear Application Password en WordPress

1. Inicia sesión en tu WordPress (lexhoy.com/wp-admin)
2. Ve a **Usuarios → Perfil**
3. Baja hasta la sección **"Application Passwords"**
4. Crea un nuevo Application Password con el nombre: `NextJS Marketing API`
5. Copia la contraseña generada (solo se muestra una vez)

### Paso 2: Configurar Variables de Entorno

**¡Ya está configurado!** El archivo `.env.local` ya tiene las credenciales necesarias:

```bash
# WordPress Integration (Server-side only)
WORDPRESS_API_URL=https://lexhoy.com/wp-json/wp/v2
WORDPRESS_USERNAME=webhook_sync
WORDPRESS_APPLICATION_PASSWORD=WpLk9mrDGa6RK5g4MEYDR6VHnk
```

✅ Las variables `WORDPRESS_USERNAME` y `WORDPRESS_APPLICATION_PASSWORD` ya están configuradas y funcionando.

### Paso 3: Reiniciar el Servidor

Después de agregar las variables:

```bash
# Detener el servidor (Ctrl+C)
# Iniciar de nuevo
npm run dev
```

### Seguridad

⚠️ **IMPORTANTE:**
- Nunca subas el archivo `.env.local` a Git
- Usa un usuario con permisos mínimos (solo lectura de posts)
- Las credenciales solo se usan en el servidor (no se exponen al cliente)

### Verificación

Una vez configurado, deberías ver en los logs del servidor:

```
🔐 Usando autenticación para acceder a borradores
```

Y la página "Entradas en Proyecto" mostrará los borradores correctamente.
