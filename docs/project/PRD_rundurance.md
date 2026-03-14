# Documento de Requisitos del Producto (PRD)

## Rundurance — Plataforma de Gestión de Entrenadores con IA

**Versión:** 1.1
**Fecha:** 2026-03-05
**Estado:** Borrador

---

## 1. Resumen

### 1.1 Visión del Producto

Rundurance es una plataforma web integral que elimina el agotamiento del entrenador automatizando el análisis de datos de entrenamiento, centralizando la gestión de atletas y proporcionando un portal de progreso premium — para que los entrenadores puedan escalar su negocio sin sacrificar la personalización.

### 1.2 Planteamiento del Problema

Los entrenadores de resistencia de alto rendimiento dedican ~70% de su tiempo al análisis de datos y tareas administrativas (feedback manual, facturación, revisión de sesiones) y solo ~30% realmente entrenando. Herramientas existentes como TrainingPeaks ofrecen datos crudos pero no tienen capa de interpretación. Esto lleva a:

- Fatiga mental por la entrega manual de feedback uno a uno
- Falta de personalización a escala
- Gestión financiera desorganizada que frena el crecimiento del negocio
- Flujos repetitivos en Excel/hojas de cálculo con pobre interpretación de datos

### 1.3 Objetivos del Producto

1. Reducir el tiempo no dedicado al coaching en ≥50%
2. Automatizar el feedback de entrenamientos generado por IA alineado a los criterios personales del entrenador
3. Centralizar la gestión de atletas, planes de entrenamiento y facturación en una sola plataforma
4. Ofrecer a los atletas un portal de progreso motivador y de autoservicio

---

## 2. Usuarios Objetivo

### Usuario Primario: El Entrenador

**Persona: Mauricio**

- Edad: 25–30 | Ubicación: Medellín, Colombia
- Ocupación: Entrenador de running (10K, 21K, Maratón)
- Entrena atletas con planes 100% individualizados (su promesa de valor central)
- Tiene criterios técnicos fuertes para métricas (cadencia, potencia, HRV, ritmo)
- Actualmente abrumado por el análisis uno a uno y el feedback manual en audio
- Meta: Automatizar lo repetitivo sin perder su estándar técnico

**Segmento objetivo:** Entrenadores personales, academias de resistencia (running, ciclismo, triatlón) y coaches de fitness que buscan escalar sin sacrificar la calidad del análisis.

### Usuario Secundario: El Atleta

- Necesita visibilidad sobre su historial de entrenamiento y progreso
- Quiere entender el feedback, no solo recibirlo
- Se motiva con el seguimiento visual del progreso y la alineación con sus objetivos

---

## 3. Historias de Usuario

### Entrenador

| ID  | Como entrenador, quiero...                                           | Para que...                                                       |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| C1  | Subir un archivo .FIT de un entrenamiento completado                 | El sistema procese y almacene todas las métricas automáticamente  |
| C2  | Ver un dashboard resumen de todos mis atletas                        | Pueda identificar rápidamente quién necesita atención             |
| C3  | Recibir feedback generado por IA de cada entrenamiento               | No tenga que escribir análisis manual uno a uno                   |
| C4  | Crear y asignar planes de entrenamiento con archivos .ZWO            | Los atletas tengan sesiones estructuradas que seguir              |
| C5  | Ver gráficas ATL/CTL/TSB (Forma/Fatiga) por atleta                   | Detecte riesgo de sobreentrenamiento o subcarga temprano          |
| C6  | Recibir alertas de sesiones perdidas, sobreentrenamiento o pagos vencidos | No pierda eventos críticos en todo mi grupo de atletas       |
| C7  | Gestionar la facturación y estado de pagos por atleta                | Mantenga mis finanzas organizadas sin una herramienta separada    |
| C8  | Personalizar los parámetros del feedback de IA según mis criterios   | El feedback suene como yo, no como un bot genérico               |
| C10 | Exportar informes financieros en PDF                                 | Pueda compartir o archivar registros de facturación fácilmente    |
| C11 | Ver cuenta regresiva de competencias por atleta en el dashboard      | Sepa qué atletas tienen carreras próximas                         |
| C12 | Establecer y actualizar el estado del plan de entrenamiento por atleta | Tenga una vista rápida de dónde está cada atleta               |

### Atleta

| ID  | Como atleta, quiero...                                    | Para que...                                        |
| --- | --------------------------------------------------------- | -------------------------------------------------- |
| A1  | Ver mi historial de entrenamientos con métricas clave     | Entienda mi progreso a lo largo del tiempo         |
| A2  | Leer el feedback de mi entrenador después de cada sesión  | Sepa qué mejorar y me sienta apoyado               |
| A3  | Ver mis próximos entrenamientos planificados              | Sepa qué hacer cada día                            |
| A4  | Ver mi tendencia de fitness/fatiga (CTL/ATL/TSB)          | Entienda mi carga de entrenamiento visualmente     |

---

## 4. Requisitos Funcionales

### 4.1 Autenticación y Roles

- **FR-01:** Los entrenadores inician sesión con email + contraseña (auth basada en JWT)
- **FR-02:** Los atletas pueden opcionalmente tener acceso de login (contraseña nullable en el esquema)
- **FR-03:** Acceso basado en roles: `coach`, `admin`; el portal del atleta es de solo lectura

### 4.2 Gestión de Atletas

- **FR-04:** El entrenador puede crear, editar y desactivar perfiles de atletas
- **FR-05:** Cada atleta está vinculado a un entrenador
- **FR-06:** El perfil del atleta incluye: nombre, documento, email, fecha de nacimiento
- **FR-06b:** Cada perfil de atleta incluye un campo opcional de **fecha de próxima competencia**
- **FR-06c:** El perfil del atleta muestra un **bloque de estado del plan** con el estado actual: `pendiente`, `cargado`, `completado` o `programado`

### 4.3 Gestión de Planes de Entrenamiento

- **FR-07:** El entrenador crea planes con categoría (Resistencia, Velocidad, Fuerza, Recuperación), fechas y descripción
- **FR-08:** Los planes contienen sesiones planificadas individuales (`planned_workout`) con fecha programada, nombre, descripción, archivo `.ZWO` opcional (almacenado en S3), duración y distancia planificadas
- **FR-09:** El entrenador puede subir archivos `.ZWO` de entrenamientos estructurados por sesión

### 4.4 Subida y Procesamiento de Archivos .FIT

- **FR-11:** El sistema parsea el archivo `.FIT` y extrae todas las métricas (ver Modelo de Datos §6)
- **FR-12:** Las métricas parseadas se almacenan en `completed_workout` y `completed_workout_lap`
- **FR-13:** El archivo `.FIT` crudo se almacena en S3; los datos de track GPS se descartan de la BD
- **FR-14:** El sistema intenta asociar el entrenamiento completado con una sesión planificada por fecha

### 4.5 Feedback con IA

- **FR-15:** Después de procesar un archivo `.FIT`, un flujo n8n dispara el análisis con IA
- **FR-16:** La IA genera texto de feedback basado en métricas del entrenamiento + parámetros definidos por el entrenador
- **FR-17:** El feedback se almacena en `workout_feedback` con `source = 'ai'`
- **FR-18:** El entrenador puede agregar o sobreescribir el feedback manualmente (`source = 'coach'`)
- **FR-19:** El entrenador puede configurar los criterios de análisis de su agente de IA (tono, métricas clave, umbrales)

### 4.6 Dashboard del Entrenador

- **FR-20:** El dashboard muestra todos los atletas activos con indicadores de estado clave
- **FR-21:** Se muestran alertas activas: sobreentrenamiento, sesiones perdidas, pagos vencidos y cuenta regresiva de competencias próximas
- **FR-22:** La vista por atleta muestra: entrenamientos recientes, próximo plan, gráfica de tendencia ATL/CTL/TSB, estado de pago
- **FR-23:** Datos ATL/CTL/TSB obtenidos de la tabla semanal `athlete_fitness_snapshot`

### 4.7 Portal del Atleta

- **FR-24:** El atleta ve su propio historial de entrenamientos, métricas y feedback
- **FR-25:** El atleta ve sus próximas sesiones planificadas
- **FR-26:** El atleta puede ver su gráfica de tendencia CTL/ATL/TSB
- **FR-27:** El atleta no puede editar ningún dato; el portal es de solo lectura

### 4.8 Gestión Financiera

- **FR-28:** El entrenador crea registros de pago por atleta con monto, fecha de vencimiento y notas
- **FR-29:** Estados de pago: `pendiente`, `pagado`, `vencido`
- **FR-30:** El entrenador marca pagos como pagados (establece timestamp `paid_at`)
- **FR-31:** La vista de finanzas muestra el estado de facturación de todos los atletas de un vistazo
- **FR-32:** Lógica de período de gracia:
  - Días 0–5 después de `due_date` sin `paid_at` → el estado permanece `pendiente`
  - Después de 5 días sin `paid_at` → el estado transiciona automáticamente a `vencido`
- **FR-33:** El sistema envía una **notificación de WhatsApp** a atletas con pagos en estado `pendiente` como recordatorio
- **FR-34:** El entrenador puede exportar informes financieros como **PDF** desde la vista de Finanzas

---

## 5. Requisitos No Funcionales

| ID     | Requisito                                                                          |
| ------ | ---------------------------------------------------------------------------------- |
| NFR-01 | La app debe ser responsiva (móvil + escritorio)                                    |
| NFR-02 | La subida de archivos .FIT debe completar el procesamiento en < 30 segundos        |
| NFR-03 | La generación de feedback con IA debe completarse en < 60 segundos de la subida    |
| NFR-04 | Todos los datos de atletas deben estar aislados por entrenador (sin filtración)    |
| NFR-05 | Contraseñas almacenadas solo como valores hasheados (bcrypt)                       |
| NFR-06 | Archivos .FIT y .ZWO almacenados en AWS S3; solo las claves S3 en la BD            |
| NFR-07 | La plataforma debe soportar al menos 50 atletas concurrentes por entrenador        |

---

## 6. Resumen del Modelo de Datos

Basado en el esquema PostgreSQL confirmado:

| Tabla                      | Propósito                                                         |
| -------------------------- | ----------------------------------------------------------------- |
| `trainer`                  | Cuentas de entrenadores y roles                                   |
| `athlete`                  | Atletas vinculados a un entrenador                                |
| `workout_category`         | Categorías de planes (Resistencia, Velocidad, etc.)               |
| `workout_plan`             | Bloques de entrenamiento asignados a un atleta                    |
| `planned_workout`          | Sesiones individuales dentro de un plan (soporte .ZWO)            |
| `completed_workout`        | Sesiones ejecutadas desde subida de .FIT con métricas completas   |
| `completed_workout_lap`    | Desglose por vuelta de entrenamientos completados                 |
| `workout_feedback`         | Feedback escrito por IA o por el entrenador por sesión            |
| `athlete_fitness_snapshot` | Snapshots semanales ATL/CTL/TSB por atleta                        |
| `athlete_alert`            | Alertas activas para el dashboard del entrenador                  |
| `payment`                  | Seguimiento de facturación mensual por atleta                     |

**Métricas clave almacenadas por entrenamiento completado:** duración, distancia, FC media/máxima, ritmo promedio, cadencia, desnivel total, carga de entrenamiento, calorías, efecto de entrenamiento aeróbico/anaeróbico, RPE, potencia Stryd, oscilación vertical, tiempo de apoyo, longitud de zancada, ratio vertical.

---

## 7. Arquitectura Técnica

### Stack

| Capa                          | Tecnología                                          |
| ----------------------------- | --------------------------------------------------- |
| Frontend                      | HTML5, CSS3, Tailwind, Bootstrap Icons, Vanilla JS  |
| Backend                       | Node.js + Express                                   |
| Base de datos                 | PostgreSQL                                          |
| Automatización / Orquestación IA | n8n (webhooks, ETL, disparadores de agentes IA)  |
| Almacenamiento de archivos    | AWS S3 (.FIT, .ZWO)                                 |
| Parser .FIT                   | `fit-file-parser` (Node.js)                         |

### Flujo de Datos

```
Dispositivo Garmin/COROS del Atleta
    ↓ exporta archivo .FIT
El entrenador sube el .FIT a Rundurance
    ↓
El backend parsea el .FIT → almacena métricas en PostgreSQL
    ↓
Se dispara webhook de n8n → el agente de IA analiza las métricas
    ↓
El feedback de la IA se almacena → visible para el entrenador y el atleta
```

### Integración con TrainingPeaks

- La API de TrainingPeaks está restringida (requiere registro de partner + OAuth 2.0)
- **Enfoque actual:** Exportación manual de `.FIT` / `.TCX` desde TrainingPeaks o Garmin Connect

---

## 8. Funcionalidades y Alcance

### MVP (v1.0) — En Alcance

- [x] Autenticación y perfil del entrenador
- [x] Gestión CRUD de atletas
- [x] Creación de planes con sesiones planificadas + subida de .ZWO
- [x] Subida de archivos .FIT y parseo automático de métricas
- [x] Almacenamiento de datos por sesión y por vuelta
- [x] Generación de feedback con IA via pipeline n8n
- [x] Dashboard del entrenador con resumen de atletas y alertas
- [x] Visualización de gráficas ATL/CTL/TSB
- [x] Portal del atleta de solo lectura
- [x] Gestión de pagos y facturación
- [x] Lógica de período de gracia de 5 días en pagos (`pendiente` → `vencido`)
- [x] Notificaciones de recordatorio de pago por WhatsApp (via n8n)
- [x] Exportación de informes financieros en PDF
- [x] Alerta de cuenta regresiva de competencia por atleta
- [x] Bloque de estado del plan de entrenamiento en el perfil del atleta

---

## 9. Métricas de Éxito

| Métrica                                  | Objetivo                                         |
| ---------------------------------------- | ------------------------------------------------ |
| Tiempo dedicado al análisis manual por entrenador | Reducido en ≥50%                        |
| Tiempo de entrega del feedback por sesión | < 60 segundos (IA) vs. horas (manual)           |
| NPS del entrenador                       | ≥ 8/10 después de 30 días                        |
| Atletas con login en el portal           | ≥70% de tasa de activación                       |
| Detección de pagos vencidos              | 100% marcados automáticamente antes del seguimiento manual |

---

## 10. Supuestos y Restricciones

- Los entrenadores exportan archivos `.FIT` manualmente desde Garmin Connect o TrainingPeaks (sin sincronización automática en el lanzamiento)
- Todos los usuarios son hispanohablantes (mercado colombiano inicialmente)
- n8n está autoalojado y gestionado por el equipo
- Los costos de AWS S3 son aceptables a la escala actual
- Los atletas usan dispositivos Garmin como fuente principal de datos (Stryd como medidor de potencia opcional); Garmin representa ~80–90% de todos los datos de entrenamientos
- Las notificaciones de WhatsApp se entregan via automatización de n8n (sin integración directa de WhatsApp Business API en el lanzamiento)
