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

    tbody.innerHTML = athletes.map((a) => {
      const name = `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Sin nombre';
      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="font-medium">${name}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="w-full bg-slate-200 rounded-full h-1.5">
              <div class="bg-sky-400 h-1.5 rounded-full" style="width: 0%"></div>
            </div>
            <span class="text-xs text-slate-500 mt-1 block">—</span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600">—</td>
          <td class="px-6 py-4 text-sm text-slate-600">—</td>
          <td class="px-6 py-4">
            <span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">—</span>
          </td>
          <td class="px-6 py-4 text-right">
            <button class="text-sky-500 hover:text-sky-700 text-sm font-medium" data-athlete-id="${a.athlete_id}">Detalle</button>
          </td>
        </tr>`;
    }).join('');

    // Update athlete count in stats
    const countEl = document.getElementById('stat-sessions');
    if (countEl) countEl.textContent = athletes.length;
  } catch (err) {
    console.error('Error loading progress:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-400">Error al cargar datos.</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', loadProgress);
