const FitParser = require('fit-file-parser').default;
const zlib      = require('zlib');

/**
 * Parses a .FIT binary buffer (also accepts gzip-compressed .fit.gz).
 * Returns { summary, laps } — GPS records are intentionally discarded.
 *
 * @param {Buffer} buffer - Raw .FIT or gzip-compressed .FIT buffer
 * @returns {Promise<{ summary: object, laps: object[] }>}
 */
async function parseFit(buffer) {
  // Auto-detect gzip magic bytes (1f 8b) and decompress
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    buffer = await new Promise((res, rej) =>
      zlib.gunzip(buffer, (err, decompressed) => err ? rej(err) : res(decompressed))
    );
  }

  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      // cascade mode (default): data.activity.sessions[i].laps[j].records[k]
    });

    parser.parse(buffer, (error, data) => {
      if (error) return reject(error);

      // Detect workout plan files and reject them with a helpful message
      const fileType = data.file_id?.type ?? data.file_ids?.[0]?.type;
      if (fileType === 'workout') {
        return reject(new Error('Este archivo es un plan de entrenamiento, no una actividad completada. Sube el archivo .FIT grabado por tu dispositivo Garmin después de correr.'));
      }

      // Support both cascade mode (Garmin) and flat mode (COROS, etc.)
      const session = data.activity?.sessions?.[0] ?? data.sessions?.[0];
      if (!session) return reject(new Error('No se encontró sesión en el archivo .FIT. Asegúrate de subir un archivo de actividad (no un plan de entrenamiento).'));

      const summary = extractSummary(session);
      // Cascade mode: laps nested in session; flat mode: laps at top level
      const lapSource = (session.laps?.length ? session.laps : null) ?? data.laps ?? [];
      const laps = lapSource.map((lap, index) => extractLap(lap, index + 1));

      resolve({ summary, laps });
    });
  });
}

function extractSummary(session) {
  const speed = session.enhanced_avg_speed ?? session.avg_speed; // km/h (Garmin uses enhanced_, COROS uses avg_speed)
  return {
    executed_at:                  session.start_time,
    duration_s:                   Math.round(session.total_timer_time ?? 0),
    distance_m:                   toMeters(session.total_distance),
    avg_heart_rate_bpm:           session.avg_heart_rate ?? null,
    max_heart_rate_bpm:           session.max_heart_rate ?? null,
    avg_pace_sec_per_km:          speed > 0 ? Math.round(3600 / speed) : null,
    avg_cadence_spm:              session.avg_cadence ?? null,
    total_ascent_m:               session.total_ascent ?? null,
    training_load:                session.training_load_peak ?? null,
    total_calories:               session.total_calories ?? null,
    aerobic_training_effect:      session.total_training_effect ?? null,
    anaerobic_training_effect:    session.total_anaerobic_training_effect ?? null,
    workout_rpe:                  session.workout_rpe ?? null,
    workout_feel:                 session.workout_feel ?? null,
    avg_vertical_oscillation_mm:  session.avg_vertical_oscillation ?? null,
    avg_stance_time_ms:           session.avg_stance_time ?? null,
    avg_step_length_mm:           session.avg_step_length ?? null,
    avg_vertical_ratio:           session.avg_vertical_ratio ?? null,
    // Stryd power — derived from lap averages if not on session
    avg_power_w:                  session.avg_power ?? null,
    max_power_w:                  session.max_power ?? null,
    avg_form_power_w:             null, // populated from laps if needed
  };
}

function extractLap(lap, lapNumber) {
  return {
    lap_number:                   lapNumber,
    start_time:                   lap.start_time ?? null,
    total_distance_m:             toMeters(lap.total_distance),
    duration_s:                   lap.total_timer_time ?? null,
    avg_speed_km_h:               lap.enhanced_avg_speed ?? lap.avg_speed ?? null,
    total_calories:               lap.total_calories ?? null,
    avg_heart_rate_bpm:           lap.avg_heart_rate ?? null,
    max_heart_rate_bpm:           lap.max_heart_rate ?? null,
    avg_cadence_spm:              lap.avg_cadence ?? null,
    avg_power_w:                  lap['Lap Power'] ?? null,
    avg_form_power_w:             null,
    total_ascent_m:               lap.total_ascent ?? null,
    avg_vertical_oscillation_mm:  lap.avg_vertical_oscillation ?? null,
    avg_stance_time_ms:           lap.avg_stance_time ?? null,
    intensity:                    lap.intensity ?? null,
    lap_trigger:                  lap.lap_trigger ?? null,
  };
}

// FIT distance comes in km (with lengthUnit: 'km'), convert to meters
function toMeters(km) {
  if (km == null) return null;
  return Math.round(km * 1000 * 100) / 100;
}

module.exports = { parseFit };
