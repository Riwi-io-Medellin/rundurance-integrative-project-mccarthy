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

  return `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="px-6 py-4 font-medium">${p.first_name} ${p.last_name}</td>
      <td class="px-6 py-4">${formatAmount(p.amount)}</td>
      <td class="px-6 py-4 text-sm text-slate-600">${formatDate(p.due_date)}</td>
      <td class="px-6 py-4">
        <span class="text-xs px-2 py-1 rounded-full font-medium ${statusClass}">${statusLabel}</span>
      </td>
      <td class="px-6 py-4 text-sm text-slate-600">${formatDate(p.paid_at)}</td>
      <td class="px-6 py-4 text-right">
        <button class="text-sky-500 hover:text-sky-700 text-sm font-medium">Detalle</button>
      </td>
    </tr>`;
}

async function loadPayments() {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const tbody = document.getElementById('payments-tbody');

  try {
    const res = await fetch('/api/finances', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) { window.location.href = 'login.html'; return; }
    if (!res.ok) throw new Error(`Error ${res.status}`);

    const payments = await res.json();

    if (payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No hay pagos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = payments.map(renderRow).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-400">Error al cargar pagos.</td></tr>`;
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', loadPayments);
