import { apiGet, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

// All loaded sessions (flat array across all athletes)
let allSessions  = [];
let athletes     = [];
let currentPage  = 1;
const PAGE_SIZE  = 10;
let filteredSessions = [];

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  athletes = await loadAthletes();
  await loadSessions();
  bindUploadModal();
  bindFilter();
  bindPagination();
});

// ─── Data loaders ─────────────────────────────────────────────────────────────

async function loadAthletes() {
  try {
    const data = await apiGet('/athletes');
    populateAthleteSelects(data);
    return data;
  } catch {
    return [];
  }
}

async function loadSessions() {
  if (!athletes.length) {
    renderTable([]);
    return;
  }

  try {
    // Fan-out: fetch workouts for every athlete in parallel
    const results = await Promise.allSettled(
      athletes.map(a => apiGet(`/workouts/athlete/${a.athlete_id}?limit=50`))
    );

    allSessions = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        r.value.forEach(w => {
          allSessions.push({ ...w, athlete_name: `${athletes[i].first_name} ${athletes[i].last_name}` });
        });
      }
    });

    // Sort newest first
    allSessions.sort((a, b) => new Date(b.executed_at) - new Date(a.executed_at));

    renderStats(allSessions);
    renderTable(allSessions);
  } catch (err) {
    console.error(err);
  }
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderStats(sessions) {
  document.getElementById('stat-total').textContent    = sessions.length;
  document.getElementById('stat-feedback').textContent = sessions.filter(s => s.feedback).length;

  const withDist = sessions.filter(s => Number(s.distance_m) > 0);
  document.getElementById('stat-distance').textContent = withDist.length
    ? (withDist.reduce((s, w) => s + Number(w.distance_m), 0) / withDist.length / 1000).toFixed(1)
    : '—';

  const withHr = sessions.filter(s => Number(s.avg_heart_rate_bpm) > 0);
  document.getElementById('stat-hr').textContent = withHr.length
    ? Math.round(withHr.reduce((s, w) => s + Number(w.avg_heart_rate_bpm), 0) / withHr.length)
    : '—';
}

function renderTable(sessions) {
  filteredSessions = sessions;
  currentPage = 1;
  renderPage();
}

function renderPage() {
  const tbody = document.getElementById('sessions-tbody');
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  document.getElementById('sessions-summary').textContent = `${filteredSessions.length} sesión${filteredSessions.length !== 1 ? 'es' : ''}`;

  if (!filteredSessions.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">No hay sesiones registradas</td></tr>`;
    renderPagination(0, 1);
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredSessions.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = page.map(s => {
    const date        = s.executed_at ? new Date(s.executed_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const distKm      = s.distance_m  ? (s.distance_m / 1000).toFixed(2) + ' km' : '—';
    const dur         = s.duration_s  ? formatDuration(s.duration_s) : '—';
    const hr          = s.avg_heart_rate_bpm ? `${s.avg_heart_rate_bpm} bpm` : '—';
    const pace        = s.avg_pace_sec_per_km ? formatPace(s.avg_pace_sec_per_km) : '—';
    const feedbackBadge = s.feedback
      ? `<span class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700"><i class="bi bi-check-circle me-1"></i>IA</span>`
      : `<span class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-400">Pendiente</span>`;

    return `
      <tr class="hover:bg-slate-50 cursor-pointer transition-colors" data-id="${s.completed_workout_id}" onclick="showDetail(${s.completed_workout_id})">
        <td class="px-6 py-4">
          <div class="font-medium text-sm">${s.athlete_name}</div>
        </td>
        <td class="px-6 py-4 text-sm text-slate-600">${date}</td>
        <td class="px-6 py-4 text-sm">${distKm}</td>
        <td class="px-6 py-4 text-sm">${dur}</td>
        <td class="px-6 py-4 text-sm">${hr}</td>
        <td class="px-6 py-4 text-sm">${pace}</td>
        <td class="px-6 py-4">${feedbackBadge}</td>
      </tr>`;
  }).join('');

  renderPagination(totalPages, currentPage);
}

function renderPagination(totalPages, page) {
  const container = document.getElementById('pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  let buttons = '';
  for (let i = 1; i <= totalPages; i++) {
    const active = i === page;
    buttons += `<button data-page="${i}" class="w-8 h-8 rounded-md text-sm font-medium transition-colors ${active ? 'bg-sky-400 text-white' : 'text-slate-600 hover:bg-slate-100'}">${i}</button>`;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between">
      <p class="text-xs text-slate-400">${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredSessions.length)} de ${filteredSessions.length}</p>
      <div class="flex items-center gap-1">
        <button data-page="prev" ${prevDisabled ? 'disabled' : ''} class="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <i class="bi bi-chevron-left text-xs"></i>
        </button>
        ${buttons}
        <button data-page="next" ${nextDisabled ? 'disabled' : ''} class="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <i class="bi bi-chevron-right text-xs"></i>
        </button>
      </div>
    </div>`;
}

function bindPagination() {
  document.getElementById('pagination')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;

    const val = btn.dataset.page;
    const totalPages = Math.ceil(filteredSessions.length / PAGE_SIZE);

    if (val === 'prev') currentPage = Math.max(1, currentPage - 1);
    else if (val === 'next') currentPage = Math.min(totalPages, currentPage + 1);
    else currentPage = Number(val);

    renderPage();
  });
}

// ─── Session detail ───────────────────────────────────────────────────────────

window.showDetail = async function (id) {
  // Highlight selected row
  document.querySelectorAll('#sessions-tbody tr').forEach(r => r.classList.remove('bg-sky-50'));
  document.querySelector(`tr[data-id="${id}"]`)?.classList.add('bg-sky-50');

  const panel = document.getElementById('detail-content');
  panel.innerHTML = `<div class="py-8 text-slate-400 text-sm">Cargando...</div>`;

  try {
    const w = await apiGet(`/workouts/${id}`);

    const date     = w.executed_at ? new Date(w.executed_at).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    const distKm   = w.distance_m  ? (w.distance_m / 1000).toFixed(2) : '—';
    const dur      = w.duration_s  ? formatDuration(w.duration_s) : '—';
    const pace     = w.avg_pace_sec_per_km ? formatPace(w.avg_pace_sec_per_km) : '—';
    const athleteName = `${w.first_name ?? ''} ${w.last_name ?? ''}`.trim();

    const metrics = [
      { icon: 'bi-speedometer2',  label: 'Distancia',  value: distKm !== '—' ? distKm + ' km' : '—', color: 'violet' },
      { icon: 'bi-clock',         label: 'Duración',   value: dur,                                     color: 'sky'    },
      { icon: 'bi-heart-pulse',   label: 'FC Prom.',   value: w.avg_heart_rate_bpm ? `${w.avg_heart_rate_bpm} bpm` : '—', color: 'rose'  },
      { icon: 'bi-lightning',     label: 'Ritmo prom.', value: pace,                                   color: 'amber'  },
      { icon: 'bi-activity',      label: 'Cadencia',   value: w.avg_cadence_spm ? `${w.avg_cadence_spm} spm` : '—', color: 'emerald' },
      { icon: 'bi-bar-chart',     label: 'Carga',      value: w.training_load ?? '—',                 color: 'blue'   },
    ];

    const metricsHtml = metrics.map(m => `
      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div class="w-8 h-8 rounded-md bg-${m.color}-500/10 flex items-center justify-center text-${m.color}-500 text-sm shrink-0">
          <i class="${m.icon}"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400">${m.label}</p>
          <p class="text-sm font-semibold">${m.value}</p>
        </div>
      </div>`).join('');

    // Laps table
    const lapsHtml = w.laps && w.laps.length
      ? `<div class="mt-4">
           <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Splits</p>
           <div class="overflow-x-auto">
             <table class="w-full text-xs">
               <thead>
                 <tr class="text-slate-400 border-b border-slate-200">
                   <th class="pb-2 text-left font-medium">#</th>
                   <th class="pb-2 text-left font-medium">Dist.</th>
                   <th class="pb-2 text-left font-medium">Tiempo</th>
                   <th class="pb-2 text-left font-medium">FC</th>
                   <th class="pb-2 text-left font-medium">Ritmo</th>
                 </tr>
               </thead>
               <tbody class="divide-y divide-slate-100">
                 ${w.laps.map(l => {
                   const lapDist = l.total_distance_m ? (l.total_distance_m / 1000).toFixed(2) + ' km' : '—';
                   const lapDur  = l.duration_s ? formatDuration(l.duration_s) : '—';
                   const lapHr   = l.avg_heart_rate_bpm ? `${l.avg_heart_rate_bpm}` : '—';
                   const lapPace = l.avg_speed_km_h > 0 ? formatPace(Math.round(3600 / l.avg_speed_km_h)) : '—';
                   return `<tr>
                     <td class="py-1.5 text-slate-500">${l.lap_number}</td>
                     <td class="py-1.5">${lapDist}</td>
                     <td class="py-1.5">${lapDur}</td>
                     <td class="py-1.5">${lapHr}</td>
                     <td class="py-1.5">${lapPace}</td>
                   </tr>`;
                 }).join('')}
               </tbody>
             </table>
           </div>
         </div>`
      : '';

    // Feedback block
    const feedbackHtml = w.feedback
      ? `<div class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
           <div class="flex items-center gap-2 mb-2">
             <i class="bi bi-robot text-emerald-600"></i>
             <p class="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Retroalimentación IA</p>
             <span class="ml-auto px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">${w.feedback_source ?? 'ai'}</span>
           </div>
           <p class="text-sm text-slate-700 whitespace-pre-line leading-relaxed">${w.feedback}</p>
         </div>`
      : `<div class="mt-4 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
           <i class="bi bi-hourglass-split text-lg mb-1 block"></i>
           Feedback IA pendiente de generación
         </div>`;

    panel.innerHTML = `
      <div class="w-full text-left">
        <div class="mb-4">
          <p class="font-semibold text-base">${athleteName}</p>
          <p class="text-xs text-slate-400 mt-0.5 capitalize">${date}</p>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${metricsHtml}
        </div>
        ${lapsHtml}
        ${feedbackHtml}
      </div>`;

  } catch (err) {
    panel.innerHTML = `<p class="text-sm text-red-500">Error al cargar la sesión</p>`;
    console.error(err);
  }
};

// ─── Upload modal ─────────────────────────────────────────────────────────────

function bindUploadModal() {
  const modal  = document.getElementById('modal-upload');
  const form   = document.getElementById('form-upload');
  const errDiv = document.getElementById('upload-error');

  document.getElementById('btn-upload').addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('modal-close').addEventListener('click',  () => closeModal());
  document.getElementById('modal-cancel').addEventListener('click', () => closeModal());

  function closeModal() {
    modal.classList.add('hidden');
    form.reset();
    errDiv.classList.add('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errDiv.classList.add('hidden');

    const athleteId = document.getElementById('upload-athlete').value;
    const file      = document.getElementById('upload-file').files[0];
    const btn       = document.getElementById('btn-submit-upload');

    if (!athleteId || !file) return;

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Subiendo...';

    try {
      const fd = new FormData();
      fd.append('fit', file);
      fd.append('athlete_id', athleteId);
      const zwoFile = document.getElementById('upload-zwo').files[0];
      if (zwoFile) fd.append('zwo', zwoFile);

      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/workouts/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      closeModal();
      showToast('Sesión subida correctamente. Procesando feedback IA...', 'emerald');
      await loadSessions();
    } catch (err) {
      errDiv.textContent = err.message;
      errDiv.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Subir';
    }
  });
}

// ─── Athlete filter ───────────────────────────────────────────────────────────

function bindFilter() {
  document.getElementById('filter-athlete').addEventListener('change', e => {
    const id = e.target.value;
    const filtered = id ? allSessions.filter(s => String(s.athlete_id) === id) : allSessions;
    renderTable(filtered);
  });
}

function populateAthleteSelects(athletes) {
  const filterSel = document.getElementById('filter-athlete');
  const uploadSel = document.getElementById('upload-athlete');

  athletes.forEach(a => {
    const name = `${a.first_name} ${a.last_name}`;
    filterSel.insertAdjacentHTML('beforeend', `<option value="${a.athlete_id}">${name}</option>`);
    uploadSel.insertAdjacentHTML('beforeend', `<option value="${a.athlete_id}">${name}</option>`);
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(secPerKm) {
  if (!secPerKm) return '—';
  const min = Math.floor(secPerKm / 60);
  const sec = String(Math.round(secPerKm % 60)).padStart(2, '0');
  return `${min}:${sec} /km`;
}

function showToast(msg, color = 'sky') {
  const t = document.getElementById('toast');
  const colorMap = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', red: 'bg-red-500' };
  t.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${colorMap[color] || 'bg-slate-700'}`;
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 4000);
}
