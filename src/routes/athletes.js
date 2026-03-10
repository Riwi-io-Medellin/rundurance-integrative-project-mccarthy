const express    = require('express');
const auth       = require('../middleware/auth');
const controller = require('../controllers/athleteController');

const router = express.Router();

// =============================================================================
// ATHLETE ROUTES — TODO LIST
// =============================================================================
// This file connects URL paths to controller functions.
// Look at src/routes/auth.js and src/routes/workouts.js for examples.
//
// HOW ROUTES WORK (MVC pattern):
//   When someone calls GET /api/athletes, Express runs the function you assign here.
//   The 'auth' middleware protects routes — only logged-in coaches can access them.
//
// PATTERN:
//   router.get('/path',    auth, controller.functionName);
//   router.post('/path',   auth, controller.functionName);
//   router.put('/path',    auth, controller.functionName);
//   router.delete('/path', auth, controller.functionName);
// =============================================================================

// TODO 1: GET /api/athletes — List all athletes of the logged-in coach

router.get('/', auth, controller.getAll);

// TODO 2: GET /api/athletes/:id — Get one athlete by ID

router.get('/:id', auth, controller.getOne);


// TODO 3: POST /api/athletes — Create a new athlete

router.post('/', auth, controller.create);



// TODO 4: PUT /api/athletes/:id — Update an athlete
// router.put('/:id', auth, controller.update);

// TODO 5: DELETE /api/athletes/:id — Deactivate an athlete (soft delete)
// router.delete('/:id', auth, controller.deactivate);

module.exports = router;
