require('dotenv').config();
const express  = require('express');
const path     = require('path');

const workoutsRouter  = require('./src/routes/workouts');
const authRouter      = require('./src/routes/auth');
const athletesRouter  = require('./src/routes/athletes');
const financesRouter  = require('./src/routes/finances');

const cors = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/workouts',  workoutsRouter);
app.use('/api/auth',      authRouter);
app.use('/api/athletes',  athletesRouter);
app.use('/api/finances',  financesRouter);

// Fallback: serve index for any unmatched route (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Rundurance corriendo en http://localhost:${PORT}`);
});
