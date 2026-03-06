# Historias de Usuario — Rundurance

Formato compatible con Jira. Cada HU tiene: Summary, Description, Acceptance Criteria, Epic, Priority, Story Points.

Para importar a Jira, usar el archivo `jira_import.csv` que acompana este documento.

---

## EPIC 1: Gestion de Atletas (Backend)

### HU-01: Listar atletas del entrenador

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver la lista de mis atletas para saber a quienes estoy entrenando |
| **Tipo** | Historia |
| **Epic** | Gestion de Atletas |
| **Prioridad** | Alta |
| **Story Points** | 2 |
| **Archivos** | `src/models/athleteModel.js`, `src/controllers/athleteController.js`, `src/routes/athletes.js` |

**Descripcion:**
Implementar el endpoint `GET /api/athletes` que devuelva todos los atletas activos del entrenador autenticado.

**Criterios de Aceptacion:**
- [ ] El modelo `findAllByTrainer(trainerId)` ejecuta un SELECT filtrando por `trainer_id` y `is_active = TRUE`
- [ ] El controlador `getAll` obtiene el `trainer_id` de `req.trainer` y llama al modelo
- [ ] La ruta `GET /` esta protegida con el middleware `auth`
- [ ] Devuelve un array JSON con los atletas ordenados alfabeticamente
- [ ] Si no hay atletas, devuelve un array vacio `[]`
- [ ] Si no hay token, devuelve 401

---

### HU-02: Ver detalle de un atleta

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver el detalle de un atleta para revisar su informacion completa |
| **Tipo** | Historia |
| **Epic** | Gestion de Atletas |
| **Prioridad** | Alta |
| **Story Points** | 1 |
| **Archivos** | `src/models/athleteModel.js`, `src/controllers/athleteController.js`, `src/routes/athletes.js` |

**Descripcion:**
Implementar el endpoint `GET /api/athletes/:id` que devuelva la informacion completa de un atleta.

**Criterios de Aceptacion:**
- [ ] El modelo `findById(athleteId)` ejecuta un SELECT por `athlete_id`
- [ ] El controlador `getOne` obtiene el ID de `req.params.id`
- [ ] Si el atleta no existe, devuelve 404 con mensaje `Atleta no encontrado`
- [ ] Si existe, devuelve el objeto JSON del atleta
- [ ] La ruta esta protegida con `auth`

---

### HU-03: Crear un nuevo atleta

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero registrar un nuevo atleta para empezar a gestionar su entrenamiento |
| **Tipo** | Historia |
| **Epic** | Gestion de Atletas |
| **Prioridad** | Alta |
| **Story Points** | 3 |
| **Archivos** | `src/models/athleteModel.js`, `src/controllers/athleteController.js`, `src/routes/athletes.js` |

**Descripcion:**
Implementar el endpoint `POST /api/athletes` que permita crear un atleta vinculado al entrenador autenticado.

**Criterios de Aceptacion:**
- [ ] El modelo `create(data)` ejecuta un INSERT con los campos: `trainer_id`, `first_name`, `last_name`, `document`, `email`, `birth_date`
- [ ] El controlador valida que `first_name`, `last_name`, `document` y `email` son obligatorios (400 si faltan)
- [ ] El `trainer_id` se toma de `req.trainer.trainer_id` (no del body)
- [ ] Si el email o documento ya existe, devuelve 409 (duplicado)
- [ ] Si todo esta bien, devuelve 201 con el atleta creado
- [ ] La ruta esta protegida con `auth`

---

### HU-04: Editar informacion de un atleta

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero editar los datos de un atleta para mantener su informacion actualizada |
| **Tipo** | Historia |
| **Epic** | Gestion de Atletas |
| **Prioridad** | Media |
| **Story Points** | 2 |
| **Archivos** | `src/models/athleteModel.js`, `src/controllers/athleteController.js`, `src/routes/athletes.js` |

**Descripcion:**
Implementar el endpoint `PUT /api/athletes/:id` que permita actualizar los datos de un atleta existente.

**Criterios de Aceptacion:**
- [ ] El modelo `update(athleteId, data)` ejecuta un UPDATE con SET y `updated_at = NOW()`
- [ ] El controlador obtiene el `athleteId` de `req.params.id` y los datos de `req.body`
- [ ] Devuelve el atleta actualizado con `RETURNING *`
- [ ] La ruta esta protegida con `auth`

---

### HU-05: Desactivar un atleta

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero desactivar un atleta que ya no entreno para que no aparezca en mi lista |
| **Tipo** | Historia |
| **Epic** | Gestion de Atletas |
| **Prioridad** | Media |
| **Story Points** | 1 |
| **Archivos** | `src/models/athleteModel.js`, `src/controllers/athleteController.js`, `src/routes/athletes.js` |

**Descripcion:**
Implementar el endpoint `DELETE /api/athletes/:id` que desactive un atleta (soft delete, no eliminar de la BD).

**Criterios de Aceptacion:**
- [ ] El modelo `deactivate(athleteId)` ejecuta UPDATE SET `is_active = FALSE`
- [ ] No se elimina el registro de la base de datos
- [ ] Devuelve mensaje de confirmacion `Atleta desactivado`
- [ ] La ruta esta protegida con `auth`

---

## EPIC 2: Gestion Financiera (Backend)

### HU-06: Listar pagos del entrenador

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver todos los pagos de mis atletas para controlar mis finanzas |
| **Tipo** | Historia |
| **Epic** | Gestion Financiera |
| **Prioridad** | Alta |
| **Story Points** | 3 |
| **Archivos** | `src/models/financeModel.js`, `src/controllers/financeController.js`, `src/routes/finances.js` |

**Descripcion:**
Implementar el endpoint `GET /api/finances` que devuelva todos los pagos del entrenador autenticado, incluyendo nombre del atleta. Antes de devolver los datos, ejecutar la logica de vencimiento automatico.

**Criterios de Aceptacion:**
- [ ] El modelo `findAllByTrainer(trainerId)` hace JOIN entre `payment` y `athlete` para incluir `first_name` y `last_name`
- [ ] El modelo `updateOverduePayments()` cambia a `vencido` los pagos con mas de 5 dias vencidos sin pagar
- [ ] El controlador llama PRIMERO a `updateOverduePayments()` y LUEGO a `findAllByTrainer()`
- [ ] Devuelve array de pagos ordenados por `due_date DESC`
- [ ] La ruta esta protegida con `auth`

---

### HU-07: Ver pagos de un atleta especifico

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver los pagos de un atleta especifico para revisar su historial |
| **Tipo** | Historia |
| **Epic** | Gestion Financiera |
| **Prioridad** | Media |
| **Story Points** | 1 |
| **Archivos** | `src/models/financeModel.js`, `src/controllers/financeController.js`, `src/routes/finances.js` |

**Descripcion:**
Implementar el endpoint `GET /api/finances/athlete/:athleteId` que devuelva los pagos de un atleta.

**Criterios de Aceptacion:**
- [ ] El modelo `findByAthlete(athleteId)` ejecuta SELECT WHERE `athlete_id = $1` ORDER BY `due_date DESC`
- [ ] El controlador obtiene `athleteId` de `req.params.athleteId`
- [ ] Devuelve array de pagos del atleta
- [ ] La ruta esta protegida con `auth`

---

### HU-08: Registrar un nuevo pago

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero crear un registro de pago para llevar control de la facturacion de mis atletas |
| **Tipo** | Historia |
| **Epic** | Gestion Financiera |
| **Prioridad** | Alta |
| **Story Points** | 2 |
| **Archivos** | `src/models/financeModel.js`, `src/controllers/financeController.js`, `src/routes/finances.js` |

**Descripcion:**
Implementar el endpoint `POST /api/finances` que permita crear un registro de pago para un atleta.

**Criterios de Aceptacion:**
- [ ] El modelo `create(data)` ejecuta INSERT con campos: `athlete_id`, `trainer_id`, `amount`, `due_date`, `notes`
- [ ] El controlador valida que `athlete_id`, `amount` y `due_date` son obligatorios (400 si faltan)
- [ ] El `trainer_id` se toma de `req.trainer.trainer_id`
- [ ] El pago se crea con status por defecto `pendiente`
- [ ] Devuelve 201 con el pago creado
- [ ] La ruta esta protegida con `auth`

---

### HU-09: Marcar un pago como pagado

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero marcar un pago como pagado para actualizar el estado financiero del atleta |
| **Tipo** | Historia |
| **Epic** | Gestion Financiera |
| **Prioridad** | Alta |
| **Story Points** | 1 |
| **Archivos** | `src/models/financeModel.js`, `src/controllers/financeController.js`, `src/routes/finances.js` |

**Descripcion:**
Implementar el endpoint `PUT /api/finances/:id/pay` que marque un pago como `pagado`.

**Criterios de Aceptacion:**
- [ ] El modelo `markAsPaid(paymentId)` ejecuta UPDATE SET `status = 'pagado'`, `paid_at = NOW()`
- [ ] El controlador obtiene `paymentId` de `req.params.id`
- [ ] Devuelve el pago actualizado
- [ ] La ruta esta protegida con `auth`

---

### HU-10: Transicion automatica de pagos vencidos

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero que los pagos vencidos se marquen automaticamente para no tener que revisarlos manualmente |
| **Tipo** | Historia |
| **Epic** | Gestion Financiera |
| **Prioridad** | Alta |
| **Story Points** | 2 |
| **Archivos** | `src/models/financeModel.js` |

**Descripcion:**
Implementar la funcion `updateOverduePayments()` que aplique la regla de gracia de 5 dias: si un pago lleva mas de 5 dias despues del `due_date` sin `paid_at`, su status cambia de `pendiente` a `vencido`.

**Criterios de Aceptacion:**
- [ ] La consulta filtra por `status = 'pendiente'` AND `paid_at IS NULL` AND `due_date < NOW() - INTERVAL '5 days'`
- [ ] Solo se actualiza el status a `vencido`, no se elimina nada
- [ ] Se actualiza `updated_at = NOW()`
- [ ] Se ejecuta automaticamente cada vez que se consulta la lista de pagos (HU-06)

---

## EPIC 3: Frontend — Login

### HU-11: Conectar formulario de login con la API

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero iniciar sesion con mi email y contrasena para acceder a mi dashboard |
| **Tipo** | Historia |
| **Epic** | Frontend Login |
| **Prioridad** | Alta |
| **Story Points** | 2 |
| **Archivos** | `public/pages/login.html` |

**Descripcion:**
Agregar JavaScript al formulario de login para que envie las credenciales a `POST /api/auth/login`, guarde el token en `localStorage` y redirija al dashboard.

**Criterios de Aceptacion:**
- [ ] Al hacer submit del formulario se previene la recarga de la pagina (`e.preventDefault()`)
- [ ] Se envian `email` y `password` como JSON a `POST /api/auth/login`
- [ ] Si la respuesta es OK: se guarda el token en `localStorage` y se redirige a `dashboard.html`
- [ ] Si hay error: se muestra un mensaje al usuario (alerta o texto en pantalla)
- [ ] Si el usuario ya tiene un token valido, redirigir directamente al dashboard

---

## EPIC 4: Frontend — Pagina de Atletas

### HU-12: Mostrar lista de atletas en la pagina

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver mis atletas en una tabla para tener una vista rapida de todos |
| **Tipo** | Historia |
| **Epic** | Frontend Atletas |
| **Prioridad** | Alta |
| **Story Points** | 3 |
| **Archivos** | `public/pages/atletas.html` |

**Descripcion:**
Agregar JavaScript que al cargar la pagina llame a `GET /api/athletes`, recorra la respuesta y llene la tabla HTML con los datos de los atletas.

**Criterios de Aceptacion:**
- [ ] Al cargar la pagina se verifica si hay token en `localStorage` (si no, redirigir a login)
- [ ] Se llama a `GET /api/athletes` con el header `Authorization: Bearer <token>`
- [ ] Se muestra cada atleta en una fila de la tabla con: nombre, email, documento, fecha de nacimiento
- [ ] Si no hay atletas se muestra un mensaje indicandolo
- [ ] Si el token es invalido (401), se redirige al login

---

### HU-13: Formulario para crear atleta desde la pagina

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero agregar un atleta desde la pagina web para no tener que usar Postman |
| **Tipo** | Historia |
| **Epic** | Frontend Atletas |
| **Prioridad** | Alta |
| **Story Points** | 3 |
| **Archivos** | `public/pages/atletas.html` |

**Descripcion:**
Agregar un formulario (o modal) en la pagina de atletas que permita ingresar los datos de un nuevo atleta y enviarlo a `POST /api/athletes`.

**Criterios de Aceptacion:**
- [ ] El formulario tiene campos para: nombre, apellido, documento, email, fecha de nacimiento
- [ ] Al hacer submit, se envia un POST a `/api/athletes` con los datos en JSON
- [ ] Si la respuesta es 201: se cierra el formulario y se recarga la lista de atletas
- [ ] Si hay error 409 (duplicado): se muestra mensaje "El email o documento ya existe"
- [ ] Si hay error 400: se muestra mensaje indicando campos faltantes

---

### HU-14: Editar atleta desde la pagina

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero editar un atleta desde la pagina para corregir o actualizar su informacion |
| **Tipo** | Historia |
| **Epic** | Frontend Atletas |
| **Prioridad** | Media |
| **Story Points** | 3 |
| **Archivos** | `public/pages/atletas.html` |

**Descripcion:**
Agregar un boton de editar en cada fila de la tabla que abra un formulario prellenado con los datos actuales del atleta, y al guardar envie `PUT /api/athletes/:id`.

**Criterios de Aceptacion:**
- [ ] Cada fila de la tabla tiene un boton de "Editar"
- [ ] Al hacer click se abre un formulario con los datos actuales del atleta
- [ ] Al guardar se envia PUT a `/api/athletes/:id` con los datos actualizados
- [ ] Se recarga la lista de atletas despues de guardar exitosamente

---

### HU-15: Desactivar atleta desde la pagina

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero desactivar un atleta desde la pagina para quitarlo de mi lista activa |
| **Tipo** | Historia |
| **Epic** | Frontend Atletas |
| **Prioridad** | Media |
| **Story Points** | 1 |
| **Archivos** | `public/pages/atletas.html` |

**Descripcion:**
Agregar un boton de eliminar/desactivar en cada fila que llame a `DELETE /api/athletes/:id`.

**Criterios de Aceptacion:**
- [ ] Cada fila tiene un boton de "Desactivar" o "Eliminar"
- [ ] Al hacer click se muestra una confirmacion ("Estas seguro?")
- [ ] Si confirma, se envia DELETE a `/api/athletes/:id`
- [ ] Se recarga la lista despues de desactivar exitosamente
- [ ] El atleta desaparece de la lista (ya no esta activo)

---

## EPIC 5: Frontend — Dashboard

### HU-16: Mostrar resumen de atletas en el dashboard

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver un resumen de mis atletas en el dashboard para tener una vista general rapida |
| **Tipo** | Historia |
| **Epic** | Frontend Dashboard |
| **Prioridad** | Alta |
| **Story Points** | 3 |
| **Archivos** | `public/pages/dashboard.html` |

**Descripcion:**
Agregar JavaScript que cargue los atletas desde la API y muestre tarjetas o un resumen con el conteo total y la informacion basica de cada atleta.

**Criterios de Aceptacion:**
- [ ] Verificacion de token al cargar la pagina
- [ ] Se llama a `GET /api/athletes` y se muestra el numero total de atletas activos
- [ ] Se muestra una tarjeta o fila por atleta con su nombre
- [ ] El nombre del entrenador se muestra en el sidebar (puede obtenerse del token o guardarse en login)

---

### HU-17: Mostrar nombre real del entrenador en el sidebar

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver mi nombre real en el sidebar en lugar de un nombre generico |
| **Tipo** | Historia |
| **Epic** | Frontend Dashboard |
| **Prioridad** | Baja |
| **Story Points** | 1 |
| **Archivos** | `public/pages/dashboard.html`, `public/pages/atletas.html`, `public/pages/finance.html` |

**Descripcion:**
Al hacer login, guardar el nombre del entrenador en `localStorage` junto al token. En cada pagina, leer ese nombre y mostrarlo en el sidebar.

**Criterios de Aceptacion:**
- [ ] Al hacer login exitoso se guarda `trainer.first_name` y `trainer.last_name` en `localStorage`
- [ ] Cada pagina con sidebar lee el nombre de `localStorage` y lo muestra
- [ ] Si no hay nombre guardado, mostrar "Entrenador" como fallback

---

## EPIC 6: Frontend — Pagina de Finanzas

### HU-18: Mostrar tabla de pagos en la pagina de finanzas

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero ver todos los pagos en una tabla para controlar mis cobros |
| **Tipo** | Historia |
| **Epic** | Frontend Finanzas |
| **Prioridad** | Alta |
| **Story Points** | 3 |
| **Archivos** | `public/pages/finance.html` |

**Descripcion:**
Agregar JavaScript que al cargar la pagina llame a `GET /api/finances` y llene la tabla con los pagos, incluyendo el nombre del atleta y el estado con colores.

**Criterios de Aceptacion:**
- [ ] Verificacion de token al cargar
- [ ] Se llama a `GET /api/finances` y se muestran los pagos en la tabla
- [ ] Cada fila muestra: nombre del atleta, monto, fecha de vencimiento, estado
- [ ] El estado se muestra con colores: verde = `pagado`, amarillo = `pendiente`, rojo = `vencido`
- [ ] Si no hay pagos se muestra un mensaje indicandolo

---

### HU-19: Formulario para crear pago desde la pagina

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero registrar un pago desde la pagina para no tener que usar Postman |
| **Tipo** | Historia |
| **Epic** | Frontend Finanzas |
| **Prioridad** | Alta |
| **Story Points** | 3 |
| **Archivos** | `public/pages/finance.html` |

**Descripcion:**
Agregar un formulario que permita crear un pago seleccionando el atleta, monto, fecha de vencimiento y notas opcionales.

**Criterios de Aceptacion:**
- [ ] El formulario tiene un selector de atleta (cargado desde `GET /api/athletes`), campo de monto, fecha y notas
- [ ] Al hacer submit se envia POST a `/api/finances` con los datos
- [ ] Si la respuesta es 201: se cierra el formulario y se recarga la tabla
- [ ] Si hay error 400: se muestra mensaje indicando campos faltantes

---

### HU-20: Marcar pago como pagado desde la pagina

| Campo | Valor |
|-------|-------|
| **Summary** | Como entrenador quiero marcar un pago como pagado con un click para actualizar el estado rapidamente |
| **Tipo** | Historia |
| **Epic** | Frontend Finanzas |
| **Prioridad** | Alta |
| **Story Points** | 2 |
| **Archivos** | `public/pages/finance.html` |

**Descripcion:**
Agregar un boton "Marcar como pagado" en cada fila de pago pendiente que llame a `PUT /api/finances/:id/pay`.

**Criterios de Aceptacion:**
- [ ] Solo los pagos con estado `pendiente` o `vencido` muestran el boton
- [ ] Al hacer click se envia PUT a `/api/finances/:id/pay`
- [ ] Se recarga la tabla despues de marcar exitosamente
- [ ] El estado del pago cambia a `pagado` (verde) en la tabla
