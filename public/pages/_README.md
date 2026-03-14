# pages/ — Pantallas HTML

Cada archivo es una pantalla de la aplicación. Todas comparten el mismo patrón de diseño: navegación lateral (sidebar) a la izquierda, contenido principal a la derecha.

## Mapa de Páginas

| Página | Quién la usa | ¿Requiere login? | Endpoints del backend que llama |
|--------|-------------|-----------------|--------------------------------|
| index.html | Todos | No | Ninguno (landing estático) |
| login.html | Entrenador | No | `POST /api/auth/login` |
| dashboard.html | Entrenador | Sí | `GET /api/athletes`, alertas, datos de fitness |
| atletas.html | Entrenador | Sí | `GET/POST/PUT/DELETE /api/athletes` |
| sesiones.html | Entrenador | Sí | `POST /api/workouts/upload`, `GET /api/workouts/athlete/:id` |
| finance.html | Entrenador | Sí | `GET/POST/PUT /api/finances` |
| progreso.html | Entrenador | Sí | `GET /api/workouts/athlete/:id`, snapshots de fitness |
| configuracion.html | Entrenador | Sí | Configuración del perfil del entrenador |

## Lo que Necesita Cada Página (JavaScript)

Toda página protegida necesita esto al inicio de su `<script>`:

```javascript
// 1. Verificar si el usuario está logueado
import { checkAuth, apiGet } from './api.js';
checkAuth(); // redirige a login.html si no hay token

// 2. Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', async () => {
  const athletes = await apiGet('/athletes');
  // construir HTML con los datos...
});
```

Luego cada página carga sus datos específicos:
- **atletas.html** → llama `apiGet('/athletes')` y rellena la tabla
- **finance.html** → llama `apiGet('/finances')` y muestra el listado de pagos
- **sesiones.html** → llama `apiGet('/workouts/athlete/:id')` por cada atleta
- **dashboard.html** → llama múltiples endpoints para construir el resumen

## Layout Compartido

Todas las páginas (excepto index.html y login.html) comparten un **sidebar** con:
- Links de navegación: Dashboard, Atletas, Sesiones, Finanzas, Progreso, Configuración
- Nombre del entrenador al fondo (leído desde `sessionStorage`)

## Módulo Compartido: api.js

Todas las páginas importan `assets/js/api.js`, que centraliza:
- El token JWT (`sessionStorage.getItem('token')`)
- Las funciones `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- La función `checkAuth` (redirige si no hay sesión)
- La función `loadSidebar` (muestra el nombre del entrenador)
