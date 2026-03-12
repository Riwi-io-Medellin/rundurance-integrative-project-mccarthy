import { apiGet, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

async function loadProgress() {
  const tbody = document.getElementById('progress-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">Cargando...</td></tr>`;

  try {
    const athletes = await apiGet('/athletes');

    if (athletes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No hay atletas registrados.</td></tr>`;
      return;
    }

    // Fetch workouts for all athletes in parallel
    const workoutResults = await Promise.allSettled(
      athletes.map(a => apiGet(`/workouts/athlete/${a.athlete_id}?limit=50`))
    );

    // Build per-athlete data
    const athleteData = athletes.map((a, i) => {
      const workouts = workoutResults[i].status === 'fulfilled' ? workoutResults[i].value : [];
      const withDist = workouts.filter(w => w.distance_m > 0);
      const withHr   = workouts.filter(w => w.avg_heart_rate_bpm > 0);

      const avgDistKm = withDist.length
        ? (withDist.reduce((s, w) => s + w.distance_m, 0) / withDist.length / 1000).toFixed(1)
        : null;
      const avgHr = withHr.length
        ? Math.round(withHr.reduce((s, w) => s + w.avg_heart_rate_bpm, 0) / withHr.length)
        : null;
      const lastSession = workouts[0]?.executed_at
        ? new Date(workouts[0].executed_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
        : null;
      const hasFeedback = workouts.filter(w => w.feedback).length;

      return { athlete: a, workouts, avgDistKm, avgHr, lastSession, hasFeedback };
    });

    // Update header stats
    const totalSessions = athleteData.reduce((s, d) => s + d.workouts.length, 0);
    const el = id => document.getElementById(id);
    if (el('stat-sessions'))  el('stat-sessions').textContent  = totalSessions;
    if (el('stat-athletes'))  el('stat-athletes').textContent  = athletes.length;

    const allWithDist = athleteData.flatMap(d => d.workouts.filter(w => w.distance_m > 0));
    const globalAvgDist = allWithDist.length
      ? (allWithDist.reduce((s, w) => s + w.distance_m, 0) / allWithDist.length / 1000).toFixed(1)
      : '—';
    const allWithHr = athleteData.flatMap(d => d.workouts.filter(w => w.avg_heart_rate_bpm > 0));
    const globalAvgHr = allWithHr.length
      ? Math.round(allWithHr.reduce((s, w) => s + w.avg_heart_rate_bpm, 0) / allWithHr.length)
      : '—';

    if (el('stat-avg-distance')) el('stat-avg-distance').textContent = globalAvgDist !== '—' ? globalAvgDist + ' km' : '—';
    if (el('stat-avg-hr'))       el('stat-avg-hr').textContent       = globalAvgHr !== '—' ? globalAvgHr + ' bpm' : '—';

    // Render table rows
    tbody.innerHTML = athleteData.map(({ athlete, workouts, avgDistKm, avgHr, lastSession, hasFeedback }) => {
      const name = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Sin nombre';
      const sessionCount = workouts.length;
      const feedbackBadge = hasFeedback > 0
        ? `<span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">${hasFeedback} con IA</span>`
        : `<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">Sin feedback</span>`;

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="font-medium">${name}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="text-sm font-medium">${sessionCount}</span>
            <span class="text-xs text-slate-400 ml-1">sesiones</span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600">${avgDistKm ? avgDistKm + ' km' : '—'}</td>
          <td class="px-6 py-4 text-sm text-slate-600">${avgHr ? avgHr + ' bpm' : '—'}</td>
          <td class="px-6 py-4">
            ${feedbackBadge}
          </td>
          <td class="px-6 py-4 text-right">
            <a href="sesiones.html" class="text-sky-500 hover:text-sky-700 text-sm font-medium inline-flex items-center gap-1">
              <i class="bi bi-activity"></i> Ver sesiones
            </a>
          </td>
        </tr>`;
    }).join('');

  } catch (err) {
    console.error('Error loading progress:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-400">Error al cargar datos.</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', loadProgress);
