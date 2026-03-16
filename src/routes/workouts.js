const express    = require('express');
const multer     = require('multer');
const auth       = require('../middleware/auth');
const controller = require('../controllers/workoutController');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/workouts/upload — coach uploads a .FIT file for an athlete
// Accepts any field name for the file (fit, file, fitfile, etc.)
router.post('/upload', auth, upload.any(), controller.upload);

// POST /api/workouts/:id/feedback — n8n callback with AI-generated feedback
// Protected by shared secret if N8N_WEBHOOK_SECRET is set; otherwise open (backwards-compatible)
router.post('/:id/feedback', (req, res, next) => {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret && req.headers['x-webhook-secret'] !== secret) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}, controller.saveFeedback);

// GET /api/workouts/stats/trainer — aggregate stats for the logged-in trainer
router.get('/stats/trainer', auth, controller.getTrainerStats);

// GET /api/workouts/athlete/:athleteId — list completed workouts for an athlete
router.get('/athlete/:athleteId', auth, controller.getByAthlete);

// GET /api/workouts/:id/analysis — full combined payload for n8n (athlete + session + laps + zwo_parsed + feedback)
router.get('/:id/analysis', auth, controller.getAnalysis);

// GET /api/workouts/:id — single workout with laps and feedback
router.get('/:id', auth, controller.getById);

module.exports = router;
