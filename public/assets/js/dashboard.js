import { apiGet, apiPost, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

let dashboardPayments = [];

function formatAmount(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

function formatMonth(yyyymm) {
  const [year, month] = yyyymm.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
}

async function loadDashboard() {
  try {
    const [athletes, payments, monthlySummary] = await Promise.all([
      apiGet('/athletes'),
      apiGet('/finances'),
      apiGet('/finances/summary/monthly').catch(() => []),
    ]);

    dashboardPayments = payments;

    const el = (id) => document.getElementById(id);

    // Active athletes count
    if (el('stat-athletes')) el('stat-athletes').textContent = athletes.length;

    // Overdue payments (alerts)
    const overdueCount = payments.filter(p => p.status === 'vencido').length;
    if (el('stat-alerts')) el('stat-alerts').textContent = overdueCount;

    // Financial summary
    const totalExpected  = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCollected = payments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending   = totalExpected - totalCollected;
    const pctCollected   = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    if (el('stat-total-expected'))  el('stat-total-expected').textContent  = formatAmount(totalExpected);
    if (el('stat-total-collected')) el('stat-total-collected').textContent = formatAmount(totalCollected);
    if (el('stat-total-pending'))   el('stat-total-pending').textContent   = formatAmount(totalPending);
    if (el('stat-pct-collected'))   el('stat-pct-collected').textContent   = `${pctCollected}%`;

    // Monthly revenue chart
    if (monthlySummary.length > 0) {
      renderRevenueChart(monthlySummary);
    }

  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderRevenueChart(data) {
  const container = document.getElementById('chart-monthly-revenue');
  if (!container) return;

  const maxExpected = Math.max(...data.map(d => Number(d.expected)), 1);

  container.innerHTML = `
    <div class="flex items-end gap-3 h-32 w-full">
      ${data.map(d => {
        const expected  = Number(d.expected);
        const collected = Number(d.collected);
        const heightExp = Math.round((expected  / maxExpected) * 100);
        const heightCol = Math.round((collected / maxExpected) * 100);
        const month     = formatMonth(d.month);
        return `
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex items-end gap-0.5 justify-center" style="height: 100px">
              <div class="w-1/2 rounded-t bg-slate-200 transition-all" style="height: ${heightExp}%"
                   title="Esperado: ${formatAmount(expected)}"></div>
              <div class="w-1/2 rounded-t bg-sky-400 transition-all" style="height: ${heightCol}%"
                   title="Recaudado: ${formatAmount(collected)}"></div>
            </div>
            <span class="text-xs text-slate-400 whitespace-nowrap">${month}</span>
          </div>`;
      }).join('')}
    </div>
    <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-slate-200 inline-block"></span>Esperado</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-sky-400 inline-block"></span>Recaudado</span>
    </div>`;
}

function exportCsv() {
  if (dashboardPayments.length === 0) { alert('No hay datos para exportar'); return; }

  const headers = ['Atleta', 'Monto', 'Fecha límite', 'Estado', 'Último pago'];
  const csvRows = [headers.join(',')];

  dashboardPayments.forEach(p => {
    csvRows.push([
      `"${p.first_name} ${p.last_name}"`,
      p.amount,
      p.due_date ? p.due_date.substring(0, 10) : '',
      p.status,
      p.paid_at ? p.paid_at.substring(0, 10) : '',
    ].join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rundurance_dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();

  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);
  document.getElementById('btn-import-csv')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('El archivo CSV está vacío o no tiene datos.'); return; }

      // Parse header row
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const requiredFields = ['first_name', 'last_name', 'document', 'email'];
      const allFields = ['first_name', 'last_name', 'document', 'email', 'birth_date', 'phone'];

      // Map header indices
      const colMap = {};
      allFields.forEach(f => {
        const idx = headers.indexOf(f);
        if (idx !== -1) colMap[f] = idx;
      });

      const missingRequired = requiredFields.filter(f => colMap[f] === undefined);
      if (missingRequired.length > 0) {
        alert(`Columnas requeridas faltantes: ${missingRequired.join(', ')}\n\nEl CSV debe tener: first_name, last_name, document, email`);
        return;
      }

      let success = 0;
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const body = {};
        allFields.forEach(f => {
          if (colMap[f] !== undefined) {
            body[f] = values[colMap[f]]?.trim() || null;
          }
        });

        if (!body.first_name || !body.last_name || !body.document || !body.email) {
          errors.push(`Fila ${i + 1}: campos requeridos vacíos`);
          continue;
        }

        try {
          await apiPost('/athletes', body);
          success++;
        } catch (err) {
          errors.push(`Fila ${i + 1}: ${err.message}`);
        }
      }

      let msg = `Importados: ${success} atleta${success !== 1 ? 's' : ''}.`;
      if (errors.length > 0) msg += `\nErrores: ${errors.length}\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`;
      alert(msg);

      if (success > 0) location.reload();
    };
    input.click();
  });
});
