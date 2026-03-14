# db/ — Conexión a la Base de Datos

Esta carpeta tiene un solo archivo: `connection.js`. Crea y exporta el **pool de conexiones** a PostgreSQL.

## ¿Qué es un Pool de Conexiones?

En lugar de abrir una nueva conexión a la base de datos por cada consulta (lento), un pool mantiene varias conexiones abiertas y las reutiliza. Es como un equipo de meseros: en lugar de contratar uno nuevo por cada mesa, tienes un equipo que se turna.

## Cómo Funciona

```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

- Lee `DATABASE_URL` del archivo `.env`
- Formato: `postgres://usuario:contraseña@host:5432/nombre_base_datos`
- Exporta una función `query` que usan todos los modelos

## Cómo lo Usan los Modelos

Cada modelo importa este archivo y llama a `db.query()`:

```javascript
const db = require('../db/connection');

const { rows } = await db.query('SELECT * FROM athlete WHERE athlete_id = $1', [id]);
```

## Conexión con Otras Carpetas

```
db/connection.js es usado por:
  └── models/ → cada archivo de modelo importa db para ejecutar consultas
```

Este es el ÚNICO archivo que se conecta a PostgreSQL. Ningún otro archivo debe crear conexiones a la base de datos directamente.
