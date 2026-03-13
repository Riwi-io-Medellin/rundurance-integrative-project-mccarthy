const { XMLParser } = require('fast-xml-parser');

/**
 * Parses a .ZWO file buffer (Zwift XML workout) into a structured JSON object.
 *
 * @param {Buffer} buffer - raw .ZWO file buffer
 * @returns {object} parsed workout plan
 *   {
 *     name, description, author, sport_type,
 *     total_duration_s,
 *     intervals: [
 *       { type, duration_s, power_pct?, power_low_pct?, power_high_pct?,
 *         repeat?, on_duration_s?, off_duration_s?, on_power_pct?, off_power_pct? }
 *     ]
 *   }
 */
function parseZwo(buffer) {
  const xml = buffer.toString('utf8');

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const doc = parser.parse(xml);

  const wf = doc.workout_file ?? doc.WorkoutFile ?? {};

  const name        = wf.name        ?? wf.Name        ?? null;
  const description = wf.description ?? wf.Description ?? null;
  const author      = wf.author      ?? wf.Author      ?? null;
  const sportType   = wf.sportType   ?? wf.SportType   ?? 'run';

  const workoutNode = wf.workout ?? wf.Workout ?? {};

  const intervals = [];
  let totalDuration = 0;

  // Each key in workoutNode is a block type; values can be a single object or an array
  for (const [blockType, raw] of Object.entries(workoutNode)) {
    const blocks = Array.isArray(raw) ? raw : [raw];

    for (const block of blocks) {
      const interval = parseBlock(blockType, block);
      if (interval) {
        intervals.push(interval);
        totalDuration += getBlockDuration(interval);
      }
    }
  }

  return {
    name,
    description,
    author,
    sport_type: String(sportType).toLowerCase(),
    total_duration_s: totalDuration || null,
    intervals,
  };
}

// ─── Block parsers ────────────────────────────────────────────────────────────

function parseBlock(type, attrs) {
  const t = type.toLowerCase();

  switch (t) {
    case 'warmup':
    case 'cooldown':
      return {
        type:           capitalize(t),
        duration_s:     num(attrs.Duration ?? attrs.duration),
        power_low_pct:  num(attrs.PowerLow ?? attrs.powerlow),
        power_high_pct: num(attrs.PowerHigh ?? attrs.powerhigh),
      };

    case 'steadystate':
      return {
        type:      'SteadyState',
        duration_s: num(attrs.Duration ?? attrs.duration),
        power_pct:  num(attrs.Power ?? attrs.power),
        cadence:    num(attrs.Cadence ?? attrs.cadence) ?? undefined,
      };

    case 'ramp':
      return {
        type:           'Ramp',
        duration_s:     num(attrs.Duration ?? attrs.duration),
        power_low_pct:  num(attrs.PowerLow ?? attrs.powerlow),
        power_high_pct: num(attrs.PowerHigh ?? attrs.powerhigh),
      };

    case 'intervalst':
      return {
        type:          'IntervalsT',
        repeat:        num(attrs.Repeat ?? attrs.repeat),
        on_duration_s: num(attrs.OnDuration ?? attrs.onduration),
        off_duration_s:num(attrs.OffDuration ?? attrs.offduration),
        on_power_pct:  num(attrs.OnPower ?? attrs.onpower),
        off_power_pct: num(attrs.OffPower ?? attrs.offpower),
      };

    case 'freeride':
      return {
        type:      'FreeRide',
        duration_s: num(attrs.Duration ?? attrs.duration),
      };

    default:
      return null;
  }
}

function getBlockDuration(interval) {
  if (interval.type === 'IntervalsT') {
    const repeat  = interval.repeat  ?? 1;
    const onDur   = interval.on_duration_s  ?? 0;
    const offDur  = interval.off_duration_s ?? 0;
    return repeat * (onDur + offDur);
  }
  return interval.duration_s ?? 0;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function num(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = { parseZwo };
