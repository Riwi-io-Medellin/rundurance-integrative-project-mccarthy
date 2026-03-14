# public/ — Frontend (Lo que el usuario ve)

Todo lo que está dentro de `public/` se envía directamente al navegador. Este es el código del **lado del cliente** — páginas HTML, imágenes y archivos JavaScript.

## Estructura de Carpetas

```
public/
├── pages/              → Páginas HTML (las pantallas que el usuario ve)
│   ├── index.html      → Página de inicio (pública, sin login)
│   ├── login.html      → Formulario de login
│   ├── dashboard.html  → Vista principal del entrenador (resumen de atletas, alertas)
│   ├── atletas.html    → Gestión de atletas (crear, editar, listar)
│   ├── sesiones.html   → Subida y revisión de sesiones completadas
│   ├── progreso.html   → Gráficas de progreso/fitness (ATL/CTL/TSB)
│   ├── finance.html    → Control de pagos y facturación
│   └── configuracion.html → Configuración del entrenador
└── assets/
    ├── js/             → Un archivo JS por página HTML
    └── images/         → Logo, favicon, imágenes decorativas
```

## Cómo el Frontend se Conecta al Backend

Las páginas HTML usan **`fetch()` de JavaScript** para llamar a la API del backend:

```javascript
// Ejemplo: obtener todos los atletas del backend
const token = sessionStorage.getItem('token');
const res = await fetch('/api/athletes', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const athletes = await res.json();
```

Conceptos clave:
1. **El login guarda un token:** Cuando el entrenador inicia sesión, el backend devuelve un JWT. El frontend lo guarda en `sessionStorage`.
2. **Cada petición envía el token:** Los endpoints protegidos necesitan el header `Authorization: Bearer <token>`.
3. **El frontend lee JSON y actualiza el HTML:** El backend devuelve datos como JSON. JavaScript los recibe y modifica la página (inserta filas en tablas, actualiza textos, etc.).

## Cómo Express Sirve Estos Archivos

En `server.js`:
```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

Esta línea le dice a Express: "sirve todo lo que está en `public/` como archivos estáticos." Así, `public/pages/login.html` es accesible en `http://localhost:3000/pages/login.html`.

## Stack Tecnológico

- **HTML** — estructura de las páginas
- **Tailwind CSS** (cargado desde CDN) — estilos con clases utilitarias como `class="text-sm font-bold bg-white"`
- **Bootstrap Icons** (cargado desde CDN) — iconos como `<i class="bi bi-people"></i>`
- **Vanilla JavaScript** — sin React, sin Vue; solo JS puro con `fetch()` para las llamadas a la API

## Conexión con el Backend

```
public/ (navegador)  ←→  src/ (servidor)

pages/login.html         →  POST /api/auth/login
pages/atletas.html       →  GET/POST/PUT/DELETE /api/athletes
pages/sesiones.html      →  POST /api/workouts/upload
pages/dashboard.html     →  GET /api/athletes (+ alertas, datos de fitness)
pages/finance.html       →  GET/POST/PUT /api/finances
```

El frontend y el backend están completamente separados. Solo se comunican a través de peticiones HTTP (llamadas fetch) y respuestas JSON.
