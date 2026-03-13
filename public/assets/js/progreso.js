import { apiGet, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

let progressData = [];

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

    // Fetch workouts and plans for all athletes in parallel
    const [workoutResults, planResults] = await Promise.all([
      Promise.allSettled(athletes.map(a => apiGet(`/workouts/athlete/${a.athlete_id}?limit=50`))),
      Promise.allSettled(athletes.map(a => apiGet(`/plans/athlete/${a.athlete_id}`))),
    ]);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    // Build per-athlete data
    progressData = athletes.map((a, i) => {
      const workouts = workoutResults[i].status === 'fulfilled' ? workoutResults[i].value : [];
      const plans = planResults[i].status === 'fulfilled' ? planResults[i].value : [];

      // Weekly volume (last 7 days)
      const recentWorkouts = workouts.filter(w => new Date(w.executed_at) >= sevenDaysAgo);
      const weeklyVolumeKm = recentWorkouts.reduce((s, w) => s + (w.distance_m || 0), 0) / 1000;

      // Average HR (all workouts)
      const withHr = workouts.filter(w => w.avg_heart_rate_bpm > 0);
      const avgHr = withHr.length
        ? Math.round(withHr.reduce((s, w) => s + w.avg_heart_rate_bpm, 0) / withHr.length)
        : null;

      // Training load (average of recent workouts)
      const withLoad = recentWorkouts.filter(w => w.training_load > 0);
      const avgLoad = withLoad.length
        ? Math.round(withLoad.reduce((s, w) => s + Number(w.training_load), 0) / withLoad.length)
        : null;

      // Compliance: completed vs planned workouts (past dates only)
      const plannedCount = plans.reduce((s, p) =>
        s + (p.planned_workouts || []).filter(pw => new Date(pw.scheduled_date) <= now).length, 0);
      const compliance = plannedCount > 0 ? Math.round((workouts.length / plannedCount) * 100) : null;

      const hasFeedback = workouts.filter(w => w.feedback).length;

      return { athlete: a, workouts, weeklyVolumeKm, avgHr, avgLoad, compliance, hasFeedback };
    });

    // Update header stats
    const totalSessions = progressData.reduce((s, d) => s + d.workouts.length, 0);
    const el = id => document.getElementById(id);
    if (el('stat-sessions')) el('stat-sessions').textContent = totalSessions;
    if (el('stat-athletes')) el('stat-athletes').textContent = athletes.length;

    // Global avg distance (weekly)
    const totalWeeklyKm = progressData.reduce((s, d) => s + d.weeklyVolumeKm, 0);
    const globalAvgWeekly = progressData.length
      ? (totalWeeklyKm / progressData.length).toFixed(1)
      : '—';
    if (el('stat-avg-distance')) el('stat-avg-distance').textContent = globalAvgWeekly !== '—' ? globalAvgWeekly + ' km' : '—';

    const allWithHr = progressData.flatMap(d => d.workouts.filter(w => w.avg_heart_rate_bpm > 0));
    const globalAvgHr = allWithHr.length
      ? Math.round(allWithHr.reduce((s, w) => s + w.avg_heart_rate_bpm, 0) / allWithHr.length)
      : '—';
    if (el('stat-avg-hr')) el('stat-avg-hr').textContent = globalAvgHr !== '—' ? globalAvgHr + ' bpm' : '—';

    // Render table rows
    tbody.innerHTML = progressData.map(({ athlete, workouts, weeklyVolumeKm, avgHr, avgLoad, compliance, hasFeedback }) => {
      const name = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Sin nombre';
      const sessionCount = workouts.length;

      // Compliance badge
      let complianceBadge;
      if (compliance !== null) {
        const color = compliance >= 80 ? 'emerald' : compliance >= 50 ? 'amber' : 'red';
        complianceBadge = `<span class="text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-700 font-medium">${compliance}%</span>`;
      } else {
        complianceBadge = `<span class="text-sm font-medium">${sessionCount}</span><span class="text-xs text-slate-400 ml-1">sesiones</span>`;
      }

      // Weekly volume
      const volumeText = weeklyVolumeKm > 0 ? weeklyVolumeKm.toFixed(1) + ' km' : '—';

      // Training load badge
      let loadBadge;
      if (avgLoad != null && avgLoad > 0) {
        if (avgLoad > 300) loadBadge = `<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">${avgLoad}</span>`;
        else if (avgLoad >= 100) loadBadge = `<span class="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">${avgLoad}</span>`;
        else loadBadge = `<span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">${avgLoad}</span>`;
      } else {
        loadBadge = `<span class="text-sm text-slate-400">—</span>`;
      }

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
            ${complianceBadge}
          </td>
          <td class="px-6 py-4 text-sm text-slate-600">${volumeText}</td>
          <td class="px-6 py-4 text-sm text-slate-600">${avgHr ? avgHr + ' bpm' : '—'}</td>
          <td class="px-6 py-4">
            ${loadBadge}
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

function exportCsv() {
  if (progressData.length === 0) { alert('No hay datos para exportar'); return; }

  const headers = ['Atleta', 'Sesiones', 'Cumplimiento %', 'Vol. semanal (km)', 'FC media (bpm)', 'Carga prom.', 'Feedback IA'];
  const csvRows = [headers.join(',')];

  progressData.forEach(({ athlete, workouts, weeklyVolumeKm, avgHr, avgLoad, compliance, hasFeedback }) => {
    csvRows.push([
      `"${(athlete.first_name || '')} ${(athlete.last_name || '')}"`,
      workouts.length,
      compliance ?? '',
      weeklyVolumeKm.toFixed(1),
      avgHr || '',
      avgLoad || '',
      hasFeedback,
    ].join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rundurance_progreso_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  loadProgress();

  document.getElementById('search-progress')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#progress-tbody tr');
    rows.forEach(row => {
      const name = row.cells?.[0]?.textContent.toLowerCase() ?? '';
      row.classList.toggle('hidden', term && !name.includes(term));
    });
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);
});
