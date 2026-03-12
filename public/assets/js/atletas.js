import { apiGet, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

async function renderAthletes(athletes) {
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
      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 font-medium">${fullName}</td>
          <td class="px-6 py-4"><span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">—</span></td>
          <td class="px-6 py-4 text-sm text-slate-500">—</td>
          <td class="px-6 py-4"><span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">—</span></td>
          <td class="px-6 py-4 text-sm text-slate-400">—</td>
          <td class="px-6 py-4 text-right">
            <button class="text-sky-500 hover:text-sky-700 text-sm font-medium inline-flex items-center gap-1 btn-detail" data-athlete-id="${athlete.athlete_id}">
              <i class="bi bi-eye"></i> Detalle
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

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

  panel.innerHTML = `
    <p class="text-slate-400 text-sm">Cargando...</p>
  `;

  try {
    const athlete = await apiGet(`/athletes/${athleteId}`);
    renderDetail(athlete);
  } catch (err) {
    panel.innerHTML = `<p class="text-red-400 text-sm">Error al cargar atleta.</p>`;
  }
}

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
    await renderAthletes(atletas);

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-detail');
      if (btn) openDetail(btn.dataset.athleteId);
    });
  } catch (error) {
    console.error('Error al cargar atletas:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-red-500">No se pudo cargar atletas. Ver consola.</td>
      </tr>
    `;
  }
}

window.addEventListener('DOMContentLoaded', cargarAtletas);
