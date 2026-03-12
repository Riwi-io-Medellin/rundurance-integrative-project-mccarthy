import { apiGet, apiPost, apiPatch, apiDelete, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

let currentEditId = null;

// ── Render table ──────────────────────────────────────────────────────────────

function renderAthletes(athletes) {
  const tbody = document.getElementById('athletes-tbody');
  const countEl = document.getElementById('athletes-count');
  const summaryEl = document.getElementById('athletes-summary');

  if (!tbody || !countEl || !summaryEl) return;

  countEl.textContent = String(athletes.length);
  summaryEl.textContent = `${athletes.length} atleta${athletes.length === 1 ? '' : 's'} activos`;

  if (athletes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-slate-400">No hay atletas registrados aún.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = athletes
    .map((athlete) => {
      const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Sin nombre';
      const birthDate = athlete.birth_date ? athlete.birth_date.substring(0, 10) : '';
      const lastSession = athlete.lastSessionDate
        ? `<span class="text-sm text-slate-600">${athlete.lastSessionDate}</span>`
        : `<span class="text-sm text-slate-400">Sin sesiones</span>`;
      const sessionBadge = athlete.sessionCount > 0
        ? `<span class="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">${athlete.sessionCount} sesiones</span>`
        : `<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">Sin sesiones</span>`;
      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 font-medium">${fullName}</td>
          <td class="px-6 py-4">${sessionBadge}</td>
          <td class="px-6 py-4">${lastSession}</td>
          <td class="px-6 py-4"><span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">—</span></td>
          <td class="px-6 py-4 text-sm text-slate-400">—</td>
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
          <span class="text-slate-400">Miembro desde</span>
          <span class="font-medium">${memberSince}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Estado</span>
          <span class="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Activo</span>
        </div>
      </div>
    </div>
  `;
}

async function openDetail(athleteId) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  panel.innerHTML = `<p class="text-slate-400 text-sm">Cargando...</p>`;

  try {
    const athlete = await apiGet(`/athletes/${athleteId}`);
    renderDetail(athlete);
  } catch (err) {
    panel.innerHTML = `<p class="text-red-400 text-sm">Error al cargar atleta.</p>`;
  }
}

// ── Modal (create / edit) ─────────────────────────────────────────────────────

function openModal(athlete = null) {
  currentEditId = athlete ? athlete.athleteId : null;
  document.getElementById('modal-athlete-title').textContent = athlete ? 'Editar atleta' : 'Nuevo atleta';
  document.getElementById('ath-first-name').value = athlete ? athlete.firstName : '';
  document.getElementById('ath-last-name').value  = athlete ? athlete.lastName  : '';
  document.getElementById('ath-document').value   = athlete ? athlete.document  : '';
  document.getElementById('ath-email').value      = athlete ? athlete.email     : '';
  document.getElementById('ath-birth-date').value = athlete ? athlete.birthDate : '';
  document.getElementById('modal-athlete').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-athlete').classList.add('hidden');
  document.getElementById('form-athlete').reset();
  currentEditId = null;
}

async function submitAthleteForm(e) {
  e.preventDefault();
  const body = {
    first_name: document.getElementById('ath-first-name').value.trim(),
    last_name:  document.getElementById('ath-last-name').value.trim(),
    document:   document.getElementById('ath-document').value.trim(),
    email:      document.getElementById('ath-email').value.trim(),
    birth_date: document.getElementById('ath-birth-date').value || null,
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
    const atletas = await apiGet('/athletes');

    // Enrich with last session data (fire-and-forget per athlete)
    const workoutResults = await Promise.allSettled(
      atletas.map(a => apiGet(`/workouts/athlete/${a.athlete_id}?limit=5`))
    );

    const enriched = atletas.map((a, i) => {
      const workouts = workoutResults[i].status === 'fulfilled' ? workoutResults[i].value : [];
      const lastWorkout = workouts[0];
      return {
        ...a,
        lastSessionDate: lastWorkout?.executed_at
          ? new Date(lastWorkout.executed_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
          : null,
        sessionCount: workouts.length,
      };
    });

    renderAthletes(enriched);
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
      });
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) deleteAthlete(deleteBtn.dataset.athleteId, deleteBtn.dataset.name);
  });

  document.getElementById('btn-new-athlete').addEventListener('click', () => openModal());
  document.getElementById('modal-athlete-close').addEventListener('click', closeModal);
  document.getElementById('modal-athlete-cancel').addEventListener('click', closeModal);
  document.getElementById('form-athlete').addEventListener('submit', submitAthleteForm);
});
