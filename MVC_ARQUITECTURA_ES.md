# Arquitectura MVC — Por que construimos Rundurance de esta forma

## Que es MVC?

MVC significa **Modelo - Vista - Controlador**. Es una forma de organizar el codigo separandolo en tres responsabilidades:

| Capa | Responsabilidad | En Rundurance |
|------|----------------|---------------|
| **Modelo** | Habla con la base de datos | `src/models/` |
| **Vista** | Lo que el usuario ve | `public/pages/` (archivos HTML) |
| **Controlador** | Conecta los dos — recibe peticiones, procesa logica, devuelve respuestas | `src/controllers/` |

Piensen en un restaurante:
- **Modelo** = la cocina (prepara la comida / los datos)
- **Vista** = la mesa y el plato (como se le presenta la comida al cliente)
- **Controlador** = el mesero (recibe el pedido, lo lleva a la cocina, entrega la comida)

El cliente (navegador) nunca entra a la cocina (base de datos). El mesero (controlador) se encarga de todo en el medio.

---

## Por que MVC? Por que no un solo archivo grande?

Imaginen que ponen todo en `server.js` — rutas, consultas a la base de datos, validaciones, respuestas HTML — todo en 2,000 lineas. Ahora imaginen:

- Dev 1 necesita cambiar como se guardan los atletas en la base de datos
- Dev 2 necesita cambiar la pagina HTML de atletas
- Dev 3 necesita agregar una nueva ruta para finanzas

Los tres estarian editando el **mismo archivo** al **mismo tiempo**. Conflictos de merge por todos lados. Nadie sabe donde esta nada. Un error de dedo rompe todo.

Con MVC, cada desarrollador trabaja en un **archivo diferente** con un **alcance claro**:

```
Dev 1 → src/models/athleteModel.js      (solo consultas a la BD)
Dev 2 → public/pages/atletas.html        (solo la pagina HTML)
Dev 3 → src/routes/finances.js           (solo el mapeo de URLs)
         src/controllers/financeController.js (solo la logica)
         src/models/financeModel.js       (solo las consultas)
```

Sin conflictos. Limites claros. Cada archivo tiene UN solo trabajo.

---

## El Ciclo de Vida Completo de una Peticion

Tracemos que pasa cuando un entrenador abre la pagina de Atletas y el navegador llama a `GET /api/athletes`:

```
NAVEGADOR (public/pages/atletas.html)
  │
  │  JavaScript ejecuta: fetch('/api/athletes', { headers: { Authorization: 'Bearer xxx' } })
  │
  ▼
SERVIDOR (server.js)
  │
  │  Express recibe la peticion
  │  Encuentra /api/athletes → athletesRouter
  │
  ▼
RUTA (src/routes/athletes.js)
  │
  │  router.get('/', auth, controller.getAll)
  │  Primero ejecuta el middleware 'auth', luego ejecuta 'controller.getAll'
  │
  ▼
MIDDLEWARE (src/middleware/auth.js)
  │
  │  Lee el header Authorization
  │  Verifica el token JWT
  │  Asigna req.trainer = { trainer_id: 1, email: '...', role: 'coach' }
  │  Llama next() → continua al controlador
  │
  ▼
CONTROLADOR (src/controllers/athleteController.js)
  │
  │  async function getAll(req, res) {
  │    const trainerId = req.trainer.trainer_id;   // quien esta preguntando?
  │    const athletes = await athleteModel.findAllByTrainer(trainerId);
  │    return res.json(athletes);                   // envia JSON de vuelta
  │  }
  │
  ▼
MODELO (src/models/athleteModel.js)
  │
  │  async function findAllByTrainer(trainerId) {
  │    const { rows } = await db.query(
  │      'SELECT * FROM athlete WHERE trainer_id = $1 AND is_active = TRUE',
  │      [trainerId]
  │    );
  │    return rows;
  │  }
  │
  ▼
BASE DE DATOS (PostgreSQL)
  │
  │  Ejecuta la consulta SQL
  │  Devuelve filas: [{ athlete_id: 1, first_name: 'Juan', ... }, ...]
  │
  ▼
... luego los datos viajan de VUELTA hacia arriba:

  MODELO devuelve filas → CONTROLADOR las recibe → envia res.json(athletes) → NAVEGADOR recibe JSON

NAVEGADOR (public/pages/atletas.html)
  │
  │  const athletes = await res.json();
  │  // Recorre los atletas, crea filas HTML para la tabla, las muestra en pantalla
```

---

## Por que agregamos capas extras mas alla del MVC puro

El MVC puro solo tiene tres capas. Rundurance agrega algunas mas porque los proyectos reales las necesitan:

### Rutas (`src/routes/`)

En MVC clasico, el controlador tambien se encarga del mapeo de URLs. Lo separamos porque:
- Las rutas son faciles de leer de un vistazo ("que endpoints existen?")
- Puedes agregar/quitar endpoints sin tocar la logica de negocio
- Varias rutas pueden apuntar a la misma funcion del controlador

### Middleware (`src/middleware/`)

Codigo que se ejecuta **antes** del controlador en multiples rutas. Sin middleware, tendrias que copiar y pegar la verificacion del JWT en cada funcion del controlador. Con middleware, lo escribes una vez y lo reutilizas:

```javascript
// Sin middleware (MAL — codigo repetido en cada controlador)
async function getAll(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // ... ahora si hacer el trabajo real
}

// Con middleware (BIEN — auth se ejecuta antes del controlador, una sola vez)
router.get('/', auth, controller.getAll);
// Para cuando getAll se ejecuta, req.trainer ya existe
```

### Servicios (`src/services/`)

Herramientas especializadas que no son consultas a la base de datos ni manejadores de peticiones. Resuelven un problema tecnico especifico:

- **fitParser** — sabe como leer archivos binarios .FIT de relojes Garmin
- **s3** — sabe como subir/descargar archivos de Amazon S3
- **n8n** — sabe como llamar al webhook de feedback con IA

Sin servicios, el controlador de workouts tendria 300+ lineas con la logica de parseo .FIT, la logica de subida a S3 y la logica del webhook todo mezclado. Al extraerlos en servicios, el controlador queda limpio y enfocado:

```javascript
// El controlador queda simple — delega a los servicios
const { summary, laps } = await parseFit(file.buffer);      // servicio
const fitS3Key = await uploadFitFile(buffer, athleteId);     // servicio
triggerFeedback(athlete, summary, laps, fitS3Key, id);       // servicio
```

### Conexion a la Base de Datos (`src/db/`)

Un solo lugar que administra el pool de conexiones a PostgreSQL. Todos los modelos lo importan. Esto significa:
- Si cambiamos la URL de la base de datos, cambiamos UN archivo
- Si cambiamos de PostgreSQL a otra base de datos, cambiamos UN archivo
- Los modelos no necesitan saber COMO conectarse — solo llaman `db.query()`

---

## El Mapa de Carpetas (Como se conecta todo)

```
server.js                          ← Punto de entrada. Inicia Express, monta las rutas.
│
├── src/
│   ├── routes/                    ← Mapeo URL → funcion
│   │   ├── auth.js                    POST /api/auth/register, /login
│   │   ├── workouts.js                POST /api/workouts/upload, /:id/feedback
│   │   ├── athletes.js                GET/POST/PUT/DELETE /api/athletes
│   │   └── finances.js                GET/POST/PUT /api/finances
│   │
│   ├── middleware/                 ← Se ejecuta entre la ruta y el controlador
│   │   └── auth.js                    Verifica JWT, asigna req.trainer
│   │
│   ├── controllers/               ← Manejadores de peticiones (el cerebro)
│   │   ├── authController.js          Registro, login
│   │   ├── workoutController.js       Subir .FIT, guardar feedback, listar workouts
│   │   ├── athleteController.js       CRUD atletas (TODO)
│   │   └── financeController.js       Gestion de pagos (TODO)
│   │
│   ├── models/                    ← Consultas a la base de datos (SQL)
│   │   ├── userModel.js               Consultas de entrenador (findByEmail, create)
│   │   ├── workoutModel.js            Consultas de workout/lap/feedback
│   │   ├── athleteModel.js            Consultas de atletas (TODO)
│   │   └── financeModel.js            Consultas de pagos (TODO)
│   │
│   ├── services/                  ← Integraciones con sistemas externos
│   │   ├── fitParser.js               Binario .FIT → JSON
│   │   ├── s3.js                      Subida/descarga AWS S3
│   │   └── n8n.js                     Webhook de feedback con IA
│   │
│   └── db/                        ← Conexion a la base de datos
│       └── connection.js              Pool de PostgreSQL
│
└── public/                        ← Frontend (se envia al navegador)
    ├── pages/                     ← Pantallas HTML
    │   ├── index.html                 Pagina de inicio (landing)
    │   ├── login.html                 Formulario de login
    │   ├── dashboard.html             Vista general del entrenador
    │   ├── atletas.html               Gestion de atletas
    │   ├── finance.html               Facturacion/pagos
    │   ├── progreso.html              Graficos de fitness
    │   ├── app.html                   Portal del atleta
    │   └── configuracion.html         Configuracion
    └── assets/
        └── images/                    Logo, favicon
```

---

## Las 5 Reglas de Oro

1. **Los modelos nunca tocan `req` ni `res`.** Reciben datos simples (un numero, un string, un objeto) y devuelven datos simples. No saben nada de HTTP.

2. **Los controladores nunca escriben SQL.** Llaman funciones del modelo. Si necesitas una consulta nueva, agregala al modelo.

3. **Las rutas nunca contienen logica.** Son una sola linea: conectar una URL con una funcion del controlador (con middleware opcional).

4. **Los servicios nunca tocan la base de datos.** Manejan herramientas externas (S3, n8n, parseo de archivos). Si un servicio necesita datos de la BD, el controlador debe obtenerlos primero y pasarselos.

5. **El frontend nunca llama a la base de datos.** Usa `fetch()` para llamar endpoints de la API. El backend es lo unico que habla con PostgreSQL.

---

## Como Agregar una Nueva Funcionalidad (Paso a Paso)

Digamos que necesitas agregar "listar pagos de un atleta." Sigue este orden:

**Paso 1: Modelo** — Escribe la consulta SQL
```javascript
// src/models/financeModel.js
async function findByAthlete(athleteId) {
  const { rows } = await db.query(
    'SELECT * FROM payment WHERE athlete_id = $1 ORDER BY due_date DESC',
    [athleteId]
  );
  return rows;
}
```

**Paso 2: Controlador** — Maneja la peticion, llama al modelo
```javascript
// src/controllers/financeController.js
async function getByAthlete(req, res) {
  try {
    const athleteId = parseInt(req.params.athleteId, 10);
    const payments = await financeModel.findByAthlete(athleteId);
    return res.json(payments);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Error al obtener pagos' });
  }
}
```

**Paso 3: Ruta** — Conecta la URL
```javascript
// src/routes/finances.js
router.get('/athlete/:athleteId', auth, controller.getByAthlete);
```

**Paso 4: Frontend** — Llama a la API y muestra los datos
```javascript
// Dentro de public/pages/finance.html <script>
const res = await apiFetch('/api/finances/athlete/5');
const payments = await res.json();
// Construir filas HTML de la tabla con el array de pagos
```

Siempre construyan de **abajo hacia arriba**: primero el Modelo (se puede probar con Postman), luego el Controlador, luego la Ruta, luego el Frontend. Cada capa se construye sobre la de abajo.
