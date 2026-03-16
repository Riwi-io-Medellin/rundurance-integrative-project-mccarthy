import { apiGet, apiPost, apiPatch, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

let allPayments = [];

const STATUS_STYLES = {
  pagado:    'bg-emerald-500/10 text-emerald-500',
  pendiente: 'bg-yellow-500/10 text-yellow-500',
  vencido:   'bg-red-500/10 text-red-500',
};

const STATUS_LABELS = {
  pagado:    'Pagado',
  pendiente: 'Pendiente',
  vencido:   'Vencido',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatAmount(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

function renderRow(p) {
  const statusClass = STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-500';
  const statusLabel = STATUS_LABELS[p.status] || p.status;
  const canPay = p.status === 'pendiente' || p.status === 'vencido';
  const actionBtn = canPay
    ? `<button class="text-emerald-500 hover:text-emerald-700 text-sm font-medium btn-pay" data-payment-id="${p.payment_id}">Pagar</button>`
    : `<span class="text-slate-300 text-sm">—</span>`;

  return `
    <tr class="hover:bg-slate-50 transition-colors" data-status="${p.status}">
      <td class="px-6 py-4 font-medium">${p.first_name} ${p.last_name}</td>
      <td class="px-6 py-4">${formatAmount(p.amount)}</td>
      <td class="px-6 py-4 text-sm text-slate-600">${formatDate(p.due_date)}</td>
      <td class="px-6 py-4">
        <span class="text-xs px-2 py-1 rounded-full font-medium ${statusClass}">${statusLabel}</span>
      </td>
      <td class="px-6 py-4 text-sm text-slate-600">${formatDate(p.paid_at)}</td>
      <td class="px-6 py-4 text-right">${actionBtn}</td>
    </tr>`;
}

function updateStats(payments) {
  const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCollected = payments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = totalExpected - totalCollected;
  const avgIncome = payments.length > 0 ? totalExpected / payments.length : 0;
  const pctCollected = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const overdueCount = payments.filter(p => p.status === 'vencido').length;

  const el = (id) => document.getElementById(id);
  if (el('stat-total-expected'))  el('stat-total-expected').textContent = formatAmount(totalExpected);
  if (el('stat-total-collected')) el('stat-total-collected').textContent = formatAmount(totalCollected);
  if (el('stat-total-pending'))   el('stat-total-pending').textContent = formatAmount(totalPending);
  if (el('stat-avg-income'))      el('stat-avg-income').textContent = formatAmount(avgIncome);
  if (el('stat-pct-collected'))   el('stat-pct-collected').textContent = `${pctCollected}%`;
  if (el('stat-overdue-count'))   el('stat-overdue-count').textContent = String(overdueCount);
}

async function loadPayments() {
  const tbody = document.getElementById('payments-tbody');
  try {
    allPayments = await apiGet('/finances');
    updateStats(allPayments);
    if (allPayments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No hay pagos registrados.</td></tr>`;
      return;
    }
    tbody.innerHTML = allPayments.map(renderRow).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-400">Error al cargar pagos.</td></tr>`;
    console.error(err);
  }
}

function applyFilters() {
  const searchTerm = (document.getElementById('search-payments')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filter-status')?.value || '';
  const rows = document.querySelectorAll('#payments-tbody tr');

  rows.forEach(row => {
    const name = row.cells?.[0]?.textContent.toLowerCase() ?? '';
    const status = row.dataset.status || '';
    const matchesSearch = !searchTerm || name.includes(searchTerm);
    const matchesStatus = !statusFilter || status === statusFilter;
    row.classList.toggle('hidden', !(matchesSearch && matchesStatus));
  });
}

function exportCsv() {
  if (allPayments.length === 0) { alert('No hay datos para exportar'); return; }

  const headers = ['Atleta', 'Monto', 'Fecha límite', 'Estado', 'Último pago'];
  const csvRows = [headers.join(',')];

  allPayments.forEach(p => {
    const name = `"${p.first_name} ${p.last_name}"`;
    const amount = p.amount;
    const due = p.due_date ? p.due_date.substring(0, 10) : '';
    const status = STATUS_LABELS[p.status] || p.status;
    const paid = p.paid_at ? p.paid_at.substring(0, 10) : '';
    csvRows.push([name, amount, due, status, paid].join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rundurance_finanzas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function markPaymentPaid(paymentId) {
  try {
    await apiPatch(`/finances/${paymentId}/pay`);
    await loadPayments();
  } catch (err) {
    alert(err.message || 'Error al marcar pago');
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function openModal() {
  document.getElementById('modal-new-payment').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-new-payment').classList.add('hidden');
  document.getElementById('form-new-payment').reset();
}

async function loadAthletes() {
  const select = document.getElementById('pay-athlete');
  try {
    const athletes = await apiGet('/athletes');
    select.innerHTML = athletes.map(a =>
      `<option value="${a.athlete_id}">${a.first_name} ${a.last_name || ''}</option>`
    ).join('');
  } catch {
    select.innerHTML = '<option value="">Error al cargar atletas</option>';
  }
}

async function submitNewPayment(e) {
  e.preventDefault();
  const athlete_id = document.getElementById('pay-athlete').value;
  const amount = document.getElementById('pay-amount').value;
  const due_date = document.getElementById('pay-due-date').value;
  try {
    await apiPost('/finances', { athlete_id: Number(athlete_id), amount: Number(amount), due_date });
    closeModal();
    await loadPayments();
  } catch (err) {
    alert(err.message || 'Error al crear pago');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPayments();

  document.getElementById('payments-tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-pay');
    if (btn) markPaymentPaid(btn.dataset.paymentId);
  });

  document.getElementById('search-payments')?.addEventListener('input', applyFilters);
  document.getElementById('filter-status')?.addEventListener('change', applyFilters);
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);

  document.getElementById('btn-new-payment').addEventListener('click', () => {
    openModal();
    loadAthletes();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('form-new-payment').addEventListener('submit', submitNewPayment);
});
