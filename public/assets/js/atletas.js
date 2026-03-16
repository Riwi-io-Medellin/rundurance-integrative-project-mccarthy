import { apiGet, apiPost, apiPatch, apiDelete, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

let currentEditId = null;
let currentPlanEditId = null;
let currentPwEditId = null;
let currentDetailAthleteId = null;

let allAthleteRows = [];
let athCurrentPage = 1;
const ATH_PAGE_SIZE = 10;

// ── Render table ──────────────────────────────────────────────────────────────

function renderAthletes(athletes) {
  allAthleteRows = athletes;
  athCurrentPage = 1;
  renderAthletesPage();
}

function renderAthletesPage() {
  const tbody = document.getElementById('athletes-tbody');
  const countEl = document.getElementById('athletes-count');
  const summaryEl = document.getElementById('athletes-summary');

  if (!tbody || !countEl || !summaryEl) return;

  countEl.textContent = String(allAthleteRows.length);
  summaryEl.textContent = `${allAthleteRows.length} atleta${allAthleteRows.length === 1 ? '' : 's'} activos`;

  if (allAthleteRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No hay atletas registrados aún.</td></tr>`;
    renderAthPagination(0, 1);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(allAthleteRows.length / ATH_PAGE_SIZE));
  if (athCurrentPage > totalPages) athCurrentPage = totalPages;
  const start = (athCurrentPage - 1) * ATH_PAGE_SIZE;
  const page = allAthleteRows.slice(start, start + ATH_PAGE_SIZE);

  tbody.innerHTML = page
    .map((athlete) => {
      const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Sin nombre';
      const birthDate = athlete.birth_date ? athlete.birth_date.substring(0, 10) : '';
      const lastSession = athlete.lastSessionDate
        ? `<span class="text-sm text-slate-600">${athlete.lastSessionDate}</span>`
        : `<span class="text-sm text-slate-400">Sin sesiones</span>`;
      const sessionBadge = athlete.sessionCount > 0
        ? `<span class="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">${athlete.sessionCount} sesiones</span>`
        : `<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">Sin sesiones</span>`;

      const alertCount = athlete.overdueCount || 0;
      const alertBadge = alertCount > 0
        ? `<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">${alertCount} vencido${alertCount > 1 ? 's' : ''}</span>`
        : `<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">—</span>`;

      const load = athlete.latestTrainingLoad;
      let loadBadge;
      if (load != null && load > 0) {
        if (load > 300) loadBadge = `<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">Alta</span>`;
        else if (load >= 100) loadBadge = `<span class="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Moderada</span>`;
        else loadBadge = `<span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">Baja</span>`;
      } else {
        loadBadge = `<span class="text-sm text-slate-400">—</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 font-medium">${fullName}</td>
          <td class="px-6 py-4">${sessionBadge}</td>
          <td class="px-6 py-4">${lastSession}</td>
          <td class="px-6 py-4">${alertBadge}</td>
          <td class="px-6 py-4">${loadBadge}</td>
          <td class="px-6 py-4 text-right">
            <div class="inline-flex items-center gap-3">
              <button class="text-sky-500 hover:text-sky-700 text-sm font-medium inline-flex items-center gap-1 btn-detail"
                data-athlete-id="${athlete.athlete_id}">
                <i class="bi bi-eye"></i> Detalle
              </button>
              <button class="text-slate-400 hover:text-slate-700 text-sm inline-flex items-center btn-edit"
                data-athlete-id="${athlete.athlete_id}"
                data-first-name="${athlete.first_name || ''}"
                data-last-name="${athlete.last_name || ''}"
                data-document="${athlete.document || ''}"
                data-email="${athlete.email || ''}"
                data-birth-date="${birthDate}"
                data-phone="${athlete.phone || ''}"
                title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="text-red-400 hover:text-red-600 text-sm inline-flex items-center btn-delete"
                data-athlete-id="${athlete.athlete_id}"
                data-name="${fullName}"
                title="Eliminar">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  renderAthPagination(totalPages, athCurrentPage);
}

function renderAthPagination(totalPages, page) {
  const container = document.getElementById('ath-pagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  let buttons = '';
  for (let i = 1; i <= totalPages; i++) {
    const active = i === page;
    buttons += `<button data-page="${i}" class="w-8 h-8 rounded-md text-sm font-medium transition-colors ${active ? 'bg-sky-400 text-white' : 'text-slate-600 hover:bg-slate-100'}">${i}</button>`;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between">
      <p class="text-xs text-slate-400">${(page - 1) * ATH_PAGE_SIZE + 1}–${Math.min(page * ATH_PAGE_SIZE, allAthleteRows.length)} de ${allAthleteRows.length}</p>
      <div class="flex items-center gap-1">
        <button data-page="prev" ${prevDisabled ? 'disabled' : ''} class="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><i class="bi bi-chevron-left text-xs"></i></button>
        ${buttons}
        <button data-page="next" ${nextDisabled ? 'disabled' : ''} class="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><i class="bi bi-chevron-right text-xs"></i></button>
      </div>
    </div>`;
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function renderDetail(athlete) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Sin nombre';
  const birthDate = athlete.birth_date
    ? new Date(athlete.birth_date).toLocaleDateString('es-CO')
    : '—';
  const memberSince = athlete.created_at
    ? new Date(athlete.created_at).toLocaleDateString('es-CO')
    : '—';

  panel.innerHTML = `
    <div class="w-full text-left flex flex-col gap-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 text-2xl shrink-0">
          <i class="bi bi-person-circle"></i>
        </div>
        <div>
          <p class="font-semibold text-base">${fullName}</p>
          <p class="text-xs text-slate-400">${athlete.email || '—'}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-3 text-sm">
        <div class="flex justify-between border-b border-slate-100 pb-2">
          <span class="text-slate-400">Documento</span>
          <span class="font-medium">${athlete.document || '—'}</span>
        </div>
        <div class="flex justify-between border-b border-slate-100 pb-2">
          <span class="text-slate-400">Fecha de nacimiento</span>
          <span class="font-medium">${birthDate}</span>
        </div>
        <div class="flex justify-between border-b border-slate-100 pb-2">
          <span class="text-slate-400">Teléfono</span>
          <span class="font-medium">${athlete.phone || '—'}</span>
        </div>
        <div class="flex justify-between border-b border-slate-100 pb-2">
          <span class="text-slate-400">Miembro desde</span>
          <span class="font-medium">${memberSince}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Estado</span>
          <span class="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Activo</span>
        </div>
      </div>

      <!-- Plans section -->
      <div class="border-t border-slate-200 pt-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-slate-700">Planes de entrenamiento</h4>
          <button class="text-sky-500 hover:text-sky-700 text-xs font-medium inline-flex items-center gap-1 btn-new-plan"
            data-athlete-id="${athlete.athlete_id}">
            <i class="bi bi-plus-lg"></i> Nuevo plan
          </button>
        </div>
        <div id="plans-list" class="flex flex-col gap-2">
          <p class="text-xs text-slate-400">Cargando planes...</p>
        </div>
      </div>
    </div>
  `;

  loadPlansForAthlete(athlete.athlete_id);

  panel.querySelector('.btn-new-plan')?.addEventListener('click', () => {
    openPlanModal(athlete.athlete_id);
  });
}

async function loadPlansForAthlete(athleteId) {
  const container = document.getElementById('plans-list');
  if (!container) return;

  try {
    const plans = await apiGet(`/plans/athlete/${athleteId}`);

    if (plans.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400">No hay planes asignados.</p>`;
      return;
    }

    container.innerHTML = plans.map(plan => {
      const startDate = plan.start_date ? new Date(plan.start_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '';
      const endDate = plan.end_date ? new Date(plan.end_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : 'Sin fin';
      const workoutCount = (plan.planned_workouts || []).length;

      const workoutsHtml = (plan.planned_workouts || []).map(pw => {
        const pwDate = pw.scheduled_date ? new Date(pw.scheduled_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '';
        const pwDist = pw.planned_distance_m ? (pw.planned_distance_m / 1000).toFixed(1) + ' km' : '';
        const pwDur = pw.planned_duration_s ? Math.round(pw.planned_duration_s / 60) + ' min' : '';
        const meta = [pwDist, pwDur].filter(Boolean).join(' · ');
        return `
          <div class="flex items-center justify-between py-1.5 pl-3 text-xs border-l-2 border-slate-200">
            <div>
              <span class="text-slate-500">${pwDate}</span>
              <span class="font-medium ml-1">${pw.name || 'Sesión'}</span>
              ${meta ? `<span class="text-slate-400 ml-1">(${meta})</span>` : ''}
            </div>
            <div class="flex items-center gap-1">
              <button class="text-slate-400 hover:text-slate-600 btn-edit-pw" data-plan-id="${plan.workout_plan_id}" data-pw-id="${pw.planned_workout_id}"
                data-date="${pw.scheduled_date?.substring(0, 10) || ''}" data-name="${pw.name || ''}" data-description="${pw.description || ''}"
                data-duration="${pw.planned_duration_s || ''}" data-distance="${pw.planned_distance_m || ''}" title="Editar">
                <i class="bi bi-pencil text-xs"></i>
              </button>
              <button class="text-red-400 hover:text-red-600 btn-delete-pw" data-plan-id="${plan.workout_plan_id}" data-pw-id="${pw.planned_workout_id}" title="Eliminar">
                <i class="bi bi-trash3 text-xs"></i>
              </button>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="border border-slate-200 rounded-lg p-3">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium">${plan.name}</p>
              <p class="text-xs text-slate-400">${startDate} — ${endDate} · ${workoutCount} sesiones</p>
              ${plan.description ? `<p class="text-xs text-slate-500 mt-1">${plan.description}</p>` : ''}
            </div>
            <div class="flex items-center gap-1">
              <button class="text-slate-400 hover:text-slate-600 btn-edit-plan" data-plan-id="${plan.workout_plan_id}"
                data-athlete-id="${plan.athlete_id}" data-name="${plan.name}" data-description="${plan.description || ''}"
                data-start-date="${plan.start_date?.substring(0, 10) || ''}" data-end-date="${plan.end_date?.substring(0, 10) || ''}" title="Editar plan">
                <i class="bi bi-pencil text-sm"></i>
              </button>
              <button class="text-red-400 hover:text-red-600 btn-delete-plan" data-plan-id="${plan.workout_plan_id}" title="Eliminar plan">
                <i class="bi bi-trash3 text-sm"></i>
              </button>
            </div>
          </div>
          ${workoutsHtml ? `<div class="mt-2 flex flex-col gap-0.5">${workoutsHtml}</div>` : ''}
          <button class="mt-2 text-sky-500 hover:text-sky-700 text-xs font-medium inline-flex items-center gap-1 btn-add-pw"
            data-plan-id="${plan.workout_plan_id}">
            <i class="bi bi-plus"></i> Agregar sesión
          </button>
        </div>`;
    }).join('');

    // Wire plan action buttons
    container.querySelectorAll('.btn-edit-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = btn.dataset;
        openPlanModal(d.athleteId, { planId: d.planId, name: d.name, description: d.description, startDate: d.startDate, endDate: d.endDate });
      });
    });

    container.querySelectorAll('.btn-delete-plan').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este plan?')) return;
        try {
          await apiDelete(`/plans/${btn.dataset.planId}`);
          loadPlansForAthlete(athleteId);
        } catch (err) { alert(err.message || 'Error al eliminar plan'); }
      });
    });

    container.querySelectorAll('.btn-add-pw').forEach(btn => {
      btn.addEventListener('click', () => openPlannedWorkoutModal(btn.dataset.planId));
    });

    container.querySelectorAll('.btn-edit-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = btn.dataset;
        openPlannedWorkoutModal(d.planId, {
          pwId: d.pwId, date: d.date, name: d.name, description: d.description,
          duration: d.duration, distance: d.distance,
        });
      });
    });

    container.querySelectorAll('.btn-delete-pw').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta sesión planificada?')) return;
        try {
          await apiDelete(`/plans/${btn.dataset.planId}/workouts/${btn.dataset.pwId}`);
          loadPlansForAthlete(athleteId);
        } catch (err) { alert(err.message || 'Error al eliminar sesión'); }
      });
    });

  } catch (err) {
    console.error('Error loading plans:', err);
    container.innerHTML = `<p class="text-xs text-red-400">Error al cargar planes.</p>`;
  }
}

async function openDetail(athleteId) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  currentDetailAthleteId = athleteId;
  panel.innerHTML = `<p class="text-slate-400 text-sm">Cargando...</p>`;

  try {
    const athlete = await apiGet(`/athletes/${athleteId}`);
    renderDetail(athlete);
  } catch (err) {
    panel.innerHTML = `<p class="text-red-400 text-sm">Error al cargar atleta.</p>`;
  }
}

// ── Plan Modal ────────────────────────────────────────────────────────────────

function openPlanModal(athleteId, plan = null) {
  currentPlanEditId = plan ? plan.planId : null;
  document.getElementById('modal-plan-title').textContent = plan ? 'Editar plan' : 'Nuevo plan';
  document.getElementById('plan-athlete-id').value = athleteId;
  document.getElementById('plan-name').value = plan ? plan.name : '';
  document.getElementById('plan-description').value = plan ? plan.description : '';
  document.getElementById('plan-start-date').value = plan ? plan.startDate : '';
  document.getElementById('plan-end-date').value = plan ? plan.endDate : '';
  document.getElementById('modal-plan').classList.remove('hidden');
}

function closePlanModal() {
  document.getElementById('modal-plan').classList.add('hidden');
  document.getElementById('form-plan').reset();
  currentPlanEditId = null;
}

async function submitPlanForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const body = {
    athlete_id: parseInt(document.getElementById('plan-athlete-id').value, 10),
    name: document.getElementById('plan-name').value.trim(),
    description: document.getElementById('plan-description').value.trim() || null,
    start_date: document.getElementById('plan-start-date').value,
    end_date: document.getElementById('plan-end-date').value || null,
  };

  try {
    if (currentPlanEditId) {
      await apiPatch(`/plans/${currentPlanEditId}`, body);
    } else {
      await apiPost('/plans', body);
    }
    closePlanModal();
    if (currentDetailAthleteId) loadPlansForAthlete(currentDetailAthleteId);
  } catch (err) {
    alert(err.message || 'Error al guardar plan');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}

// ── Planned Workout Modal ─────────────────────────────────────────────────────

function openPlannedWorkoutModal(planId, pw = null) {
  currentPwEditId = pw ? pw.pwId : null;
  document.getElementById('modal-pw-title').textContent = pw ? 'Editar sesión planificada' : 'Nueva sesión planificada';
  document.getElementById('pw-plan-id').value = planId;
  document.getElementById('pw-date').value = pw ? pw.date : '';
  document.getElementById('pw-name').value = pw ? pw.name : '';
  document.getElementById('pw-description').value = pw ? pw.description : '';
  document.getElementById('pw-duration').value = pw && pw.duration ? Math.round(Number(pw.duration) / 60) : '';
  document.getElementById('pw-distance').value = pw && pw.distance ? (Number(pw.distance) / 1000).toFixed(1) : '';
  document.getElementById('modal-planned-workout').classList.remove('hidden');
}

function closePlannedWorkoutModal() {
  document.getElementById('modal-planned-workout').classList.add('hidden');
  document.getElementById('form-planned-workout').reset();
  currentPwEditId = null;
}

async function submitPlannedWorkoutForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const planId = document.getElementById('pw-plan-id').value;
  const durationMin = document.getElementById('pw-duration').value;
  const distanceKm = document.getElementById('pw-distance').value;

  const body = {
    scheduled_date: document.getElementById('pw-date').value,
    name: document.getElementById('pw-name').value.trim() || null,
    description: document.getElementById('pw-description').value.trim() || null,
    planned_duration_s: durationMin ? Math.round(Number(durationMin) * 60) : null,
    planned_distance_m: distanceKm ? Math.round(Number(distanceKm) * 1000) : null,
  };

  try {
    if (currentPwEditId) {
      await apiPatch(`/plans/${planId}/workouts/${currentPwEditId}`, body);
    } else {
      await apiPost(`/plans/${planId}/workouts`, body);
    }
    closePlannedWorkoutModal();
    if (currentDetailAthleteId) loadPlansForAthlete(currentDetailAthleteId);
  } catch (err) {
    alert(err.message || 'Error al guardar sesión planificada');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}

// ── Athlete Modal (create / edit) ─────────────────────────────────────────────

function openModal(athlete = null) {
  currentEditId = athlete ? athlete.athleteId : null;
  document.getElementById('modal-athlete-title').textContent = athlete ? 'Editar atleta' : 'Nuevo atleta';
  document.getElementById('ath-first-name').value = athlete ? athlete.firstName : '';
  document.getElementById('ath-last-name').value  = athlete ? athlete.lastName  : '';
  document.getElementById('ath-document').value   = athlete ? athlete.document  : '';
  document.getElementById('ath-email').value      = athlete ? athlete.email     : '';
  document.getElementById('ath-birth-date').value = athlete ? athlete.birthDate : '';
  document.getElementById('ath-phone').value      = athlete ? athlete.phone     : '';
  document.getElementById('modal-athlete').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-athlete').classList.add('hidden');
  document.getElementById('form-athlete').reset();
  currentEditId = null;
}

async function submitAthleteForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const body = {
    first_name: document.getElementById('ath-first-name').value.trim(),
    last_name:  document.getElementById('ath-last-name').value.trim(),
    document:   document.getElementById('ath-document').value.trim(),
    email:      document.getElementById('ath-email').value.trim(),
    birth_date: document.getElementById('ath-birth-date').value || null,
    phone:      document.getElementById('ath-phone').value.trim() || null,
  };
  try {
    if (currentEditId) {
      await apiPatch(`/athletes/${currentEditId}`, body);
    } else {
      await apiPost('/athletes', body);
    }
    closeModal();
    await cargarAtletas();
  } catch (err) {
    alert(err.message || 'Error al guardar atleta');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteAthlete(athleteId, name) {
  if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
  try {
    await apiDelete(`/athletes/${athleteId}`);
    await cargarAtletas();
    const panel = document.getElementById('detail-panel');
    if (panel) panel.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 text-xl mb-2">
        <i class="bi bi-person"></i>
      </div>
      <p class="text-slate-400 text-sm">Selecciona un atleta<br/>para ver sus detalles</p>
    `;
  } catch (err) {
    alert(err.message || 'Error al eliminar atleta');
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────

async function cargarAtletas() {
  const tbody = document.getElementById('athletes-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="px-6 py-8 text-center text-slate-400">Cargando atletas...</td>
    </tr>
  `;

  try {
    const [atletas, payments, stats] = await Promise.all([
      apiGet('/athletes'),
      apiGet('/finances'),
      apiGet('/workouts/stats/trainer').catch(() => ({ sessions_today: 0, per_athlete: [] })),
    ]);

    // Build overdue count per athlete
    const overdueByAthlete = {};
    payments.filter(p => p.status === 'vencido').forEach(p => {
      overdueByAthlete[p.athlete_id] = (overdueByAthlete[p.athlete_id] || 0) + 1;
    });

    // Build training load map per athlete
    const statsMap = {};
    (stats.per_athlete || []).forEach(s => { statsMap[s.athlete_id] = s; });

    // Enrich with last session data
    const workoutResults = await Promise.allSettled(
      atletas.map(a => apiGet(`/workouts/athlete/${a.athlete_id}?limit=5`))
    );

    const enriched = atletas.map((a, i) => {
      const workouts = workoutResults[i].status === 'fulfilled' ? workoutResults[i].value : [];
      const lastWorkout = workouts[0];
      const athleteStats = statsMap[a.athlete_id];
      return {
        ...a,
        lastSessionDate: lastWorkout?.executed_at
          ? new Date(lastWorkout.executed_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
          : null,
        sessionCount: workouts.length,
        overdueCount: overdueByAthlete[a.athlete_id] || 0,
        latestTrainingLoad: athleteStats?.latest_training_load ?? null,
      };
    });

    renderAthletes(enriched);

    // Update stat cards
    const el = id => document.getElementById(id);
    const totalOverdue = payments.filter(p => p.status === 'vencido').length;
    if (el('stat-alerts')) el('stat-alerts').textContent = totalOverdue;
    if (el('stat-sessions-today')) el('stat-sessions-today').textContent = stats.sessions_today || 0;

  } catch (error) {
    console.error('Error al cargar atletas:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-red-500">No se pudo cargar atletas. Ver consola.</td>
      </tr>
    `;
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  cargarAtletas();

  // Pagination
  document.getElementById('ath-pagination')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    const val = btn.dataset.page;
    const totalPages = Math.ceil(allAthleteRows.length / ATH_PAGE_SIZE);
    if (val === 'prev') athCurrentPage = Math.max(1, athCurrentPage - 1);
    else if (val === 'next') athCurrentPage = Math.min(totalPages, athCurrentPage + 1);
    else athCurrentPage = Number(val);
    renderAthletesPage();
  });

  document.getElementById('athletes-tbody').addEventListener('click', (e) => {
    const detailBtn = e.target.closest('.btn-detail');
    if (detailBtn) { openDetail(detailBtn.dataset.athleteId); return; }

    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const d = editBtn.dataset;
      openModal({
        athleteId: d.athleteId,
        firstName: d.firstName,
        lastName:  d.lastName,
        document:  d.document,
        email:     d.email,
        birthDate: d.birthDate,
        phone:     d.phone,
      });
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) deleteAthlete(deleteBtn.dataset.athleteId, deleteBtn.dataset.name);
  });

  document.getElementById('search-athletes')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#athletes-tbody tr');
    rows.forEach(row => {
      const name = row.cells?.[0]?.textContent.toLowerCase() ?? '';
      row.classList.toggle('hidden', term && !name.includes(term));
    });
  });

  // Athlete modal
  document.getElementById('btn-new-athlete').addEventListener('click', () => openModal());
  document.getElementById('modal-athlete-close').addEventListener('click', closeModal);
  document.getElementById('modal-athlete-cancel').addEventListener('click', closeModal);
  document.getElementById('form-athlete').addEventListener('submit', submitAthleteForm);

  // Plan modal
  document.getElementById('modal-plan-close').addEventListener('click', closePlanModal);
  document.getElementById('modal-plan-cancel').addEventListener('click', closePlanModal);
  document.getElementById('form-plan').addEventListener('submit', submitPlanForm);
  document.getElementById('modal-plan').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closePlanModal();
  });

  // Planned workout modal
  document.getElementById('modal-pw-close').addEventListener('click', closePlannedWorkoutModal);
  document.getElementById('modal-pw-cancel').addEventListener('click', closePlannedWorkoutModal);
  document.getElementById('form-planned-workout').addEventListener('submit', submitPlannedWorkoutForm);
  document.getElementById('modal-planned-workout').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closePlannedWorkoutModal();
  });
});
