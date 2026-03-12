import { apiGet, checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

function formatAmount(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

async function loadDashboard() {
  try {
    const [athletes, payments] = await Promise.all([
      apiGet('/athletes'),
      apiGet('/finances'),
    ]);

    // Stat cards
    const el = (id) => document.getElementById(id);

    // Active athletes count
    if (el('stat-athletes')) el('stat-athletes').textContent = athletes.length;

    // Overdue payments (alerts)
    const overdueCount = payments.filter(p => p.status === 'vencido').length;
    if (el('stat-alerts')) el('stat-alerts').textContent = overdueCount;

    // Financial summary
    const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCollected = payments.filter(p => p.status === 'pagado').reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending = totalExpected - totalCollected;
    const pctCollected = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    if (el('stat-total-expected'))  el('stat-total-expected').textContent = formatAmount(totalExpected);
    if (el('stat-total-collected')) el('stat-total-collected').textContent = formatAmount(totalCollected);
    if (el('stat-total-pending'))   el('stat-total-pending').textContent = formatAmount(totalPending);
    if (el('stat-pct-collected'))   el('stat-pct-collected').textContent = `${pctCollected}%`;

  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
