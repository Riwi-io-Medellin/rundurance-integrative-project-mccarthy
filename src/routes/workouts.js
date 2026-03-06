const express    = require('express');
const multer     = require('multer');
const auth       = require('../middleware/auth');
const controller = require('../controllers/workoutController');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage() });

// POST /api/workouts/upload — coach uploads a .FIT file for an athlete
// Accepts any field name for the file (fit, file, fitfile, etc.)
router.post('/upload', auth, upload.any(), controller.upload);

// POST /api/workouts/:id/feedback — n8n callback with AI-generated feedback (no auth)
router.post('/:id/feedback', controller.saveFeedback);

// GET /api/workouts/athlete/:athleteId — list completed workouts for an athlete
router.get('/athlete/:athleteId', auth, controller.getByAthlete);

module.exports = router;
