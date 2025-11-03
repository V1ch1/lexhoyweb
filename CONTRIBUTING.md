# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a LexHoy Portal! Esta guía te ayudará a empezar.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Estándares de Código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Mejoras](#sugerir-mejoras)

---

## 📜 Código de Conducta

### Nuestro Compromiso

Nos comprometemos a mantener un ambiente abierto, acogedor y respetuoso para todos.

### Comportamiento Esperado

- ✅ Ser respetuoso con diferentes puntos de vista
- ✅ Aceptar críticas constructivas
- ✅ Enfocarse en lo mejor para la comunidad
- ✅ Mostrar empatía hacia otros miembros

### Comportamiento Inaceptable

- ❌ Lenguaje o imágenes sexualizadas
- ❌ Comentarios insultantes o despectivos
- ❌ Acoso público o privado
- ❌ Publicar información privada sin permiso

---

## 🚀 Cómo Contribuir

### Tipos de Contribuciones

1. **Reportar Bugs** 🐛
2. **Sugerir Mejoras** 💡
3. **Mejorar Documentación** 📚
4. **Escribir Código** 💻
5. **Revisar Pull Requests** 👀

---

## ⚙️ Configuración del Entorno

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork

git clone https://github.com/TU-USUARIO/lexhoyweb.git
cd lexhoyweb
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### 4. Ejecutar en Desarrollo

```bash
pnpm dev
```

### 5. Crear Branch

```bash
git checkout -b feature/mi-nueva-funcionalidad
```

---

## 📝 Estándares de Código

### TypeScript

- ✅ Usar TypeScript para todo el código
- ✅ Tipado estricto habilitado
- ✅ No usar `any` sin justificación
- ✅ Interfaces para objetos complejos

```typescript
// ❌ Evitar
function getData(id: any) {
  return data[id];
}

// ✅ Preferir
function getData(id: string): DataType {
  return data[id];
}
```

### Naming Conventions

```typescript
// Componentes: PascalCase
export function UserProfile() {}

// Funciones: camelCase
function getUserData() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Interfaces: PascalCase con prefijo I (opcional)
interface UserData {}

// Types: PascalCase
type UserId = string;
```

### Estructura de Archivos

```
app/
├── (auth)/              # Grupo de rutas de autenticación
├── (dashboard)/         # Grupo de rutas de dashboard
├── api/                 # API routes
└── layout.tsx           # Layout principal

components/
├── ui/                  # Componentes UI reutilizables
├── forms/               # Componentes de formularios
└── [feature]/           # Componentes por feature

lib/
├── utils.ts             # Utilidades generales
├── validation.ts        # Validaciones
└── [service].ts         # Servicios específicos
```

### Componentes React

```typescript
// ✅ Componente funcional con TypeScript
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      {onEdit && (
        <button onClick={() => onEdit(user.id)}>
          Editar
        </button>
      )}
    </div>
  );
}
```

### Estilos con Tailwind

```typescript
// ✅ Usar Tailwind CSS
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold">Título</h2>
</div>

// ❌ Evitar estilos inline
<div style={{ display: 'flex', padding: '16px' }}>
```

### Validación de Datos

```typescript
// ✅ Siempre validar entrada de usuario
import { validateUUID, sanitizeString } from '@/lib/validation';

if (!validateUUID(userId)) {
  throw new ValidationError("ID inválido");
}

const cleanInput = sanitizeString(userInput);
```

---

## 🔍 Linting y Formato

### Antes de Commit

```bash
# Linting
pnpm lint

# Formato
pnpm format

# Type checking
pnpm type-check
```

### Configuración de ESLint

Ya configurado en `.eslintrc.json`:
- Next.js rules
- TypeScript rules
- React hooks rules

### Configuración de Prettier

Ya configurado en `.prettierrc`:
- Semi: true
- Single quotes: true
- Tab width: 2

---

## 🔄 Proceso de Pull Request

### 1. Asegúrate de que tu código:

- [ ] Compila sin errores (`pnpm build`)
- [ ] Pasa el linting (`pnpm lint`)
- [ ] Pasa type checking
- [ ] Tiene tests (si aplica)
- [ ] Está documentado

### 2. Commit Messages

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: añadir validación de email"

# Fixes
git commit -m "fix: corregir error en login"

# Docs
git commit -m "docs: actualizar README"

# Style
git commit -m "style: formatear código con prettier"

# Refactor
git commit -m "refactor: simplificar lógica de autenticación"

# Test
git commit -m "test: añadir tests para UserService"

# Chore
git commit -m "chore: actualizar dependencias"
```

### 3. Crear Pull Request

```bash
git push origin feature/mi-nueva-funcionalidad
```

Luego en GitHub:
1. Click en "New Pull Request"
2. Completar template de PR
3. Asignar reviewers
4. Esperar review

### 4. Template de Pull Request

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He actualizado la documentación
- [ ] He añadido tests
- [ ] Todos los tests pasan
- [ ] Build exitoso
```

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. Busca si el bug ya fue reportado
2. Verifica que sea reproducible
3. Recopila información del entorno

### Template de Bug Report

```markdown
## Descripción del Bug
Descripción clara y concisa del bug

## Pasos para Reproducir
1. Ir a '...'
2. Click en '...'
3. Ver error

## Comportamiento Esperado
Qué debería pasar

## Comportamiento Actual
Qué pasa realmente

## Screenshots
Si aplica, añadir screenshots

## Entorno
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

## Información Adicional
Cualquier otro contexto relevante
```

---

## 💡 Sugerir Mejoras

### Template de Feature Request

```markdown
## Problema a Resolver
Descripción del problema que esta feature resolvería

## Solución Propuesta
Descripción clara de cómo funcionaría

## Alternativas Consideradas
Otras soluciones que consideraste

## Información Adicional
Mockups, ejemplos, etc.
```

---

## 🧪 Testing

### Escribir Tests

```typescript
// tests/userService.test.ts
import { UserService } from '@/lib/userService';

describe('UserService', () => {
  it('should validate email correctly', () => {
    const service = new UserService();
    expect(service.validateEmail('test@example.com')).toBe(true);
    expect(service.validateEmail('invalid')).toBe(false);
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests específicos
pnpm test userService

# Con coverage
pnpm test:coverage
```

---

## 📚 Documentación

### Comentarios en Código

```typescript
/**
 * Valida un email usando regex
 * @param email - Email a validar
 * @returns true si es válido, false si no
 * @example
 * validateEmail('test@example.com') // true
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### Actualizar Documentación

Si tu cambio afecta:
- API → Actualizar `docs/API.md`
- Base de datos → Actualizar `docs/DATABASE_SCHEMA.md`
- Flujos → Actualizar `docs/implementacion/`
- README → Actualizar según corresponda

---

## 🎯 Áreas de Contribución

### Prioridad Alta 🔴

- Mejorar tests
- Documentar APIs
- Corregir bugs críticos
- Mejorar seguridad

### Prioridad Media 🟡

- Refactorizar código
- Mejorar performance
- Añadir features
- Mejorar UX

### Prioridad Baja 🟢

- Mejorar estilos
- Actualizar dependencias
- Limpiar código
- Mejorar documentación

---

## 🏆 Reconocimiento

Los contribuidores serán reconocidos en:
- README.md (sección de contribuidores)
- Release notes
- Página de créditos (próximamente)

---

## 📞 Contacto

¿Preguntas sobre contribución?
- **GitHub Discussions**: Para preguntas generales
- **GitHub Issues**: Para bugs y features
- **Email**: dev@lexhoy.com

---

## 📖 Recursos Útiles

### Documentación del Proyecto
- [README](README.md)
- [Documentación Completa](docs/README.md)
- [Guía de Deployment](DEPLOYMENT.md)
- [Política de Seguridad](SECURITY.md)

### Tecnologías Usadas
- [Next.js 15](https://nextjs.org/docs)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase](https://supabase.com/docs)

---

**¡Gracias por contribuir a LexHoy Portal!** 🎉

**Última actualización**: 3 de noviembre de 2025  
**Versión**: 1.0.0
