import { apiGet } from './api.js';

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
      const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim();
      const createdAt = athlete.created_at ? new Date(athlete.created_at).toLocaleDateString() : '—';
      const birthDate = athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString() : '—';
      const lastSession = athlete.last_session || '—';
      const compliance = athlete.compliance || '—';
      const alerts = athlete.alerts || '—';

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 font-medium">${fullName || 'Sin nombre'}</td>
          <td class="px-6 py-4 text-sm text-slate-500">${athlete.email || '—'}</td>
          <td class="px-6 py-4 text-sm text-slate-500">${athlete.document || '—'}</td>
          <td class="px-6 py-4 text-sm text-slate-500">${birthDate}</td>
          <td class="px-6 py-4 text-sm text-slate-500">${createdAt}</td>
          <td class="px-6 py-4 text-right">
            <button class="text-sky-500 hover:text-sky-700 text-sm font-medium inline-flex items-center gap-1" data-athlete-id="${athlete.athlete_id}">
              <i class="bi bi-eye"></i> Detalle
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
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
