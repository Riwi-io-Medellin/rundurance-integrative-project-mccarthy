import { checkAuth, loadSidebar, apiGet, apiPatch, apiDelete } from './api.js';

checkAuth();
loadSidebar();

const SETTINGS_KEY = 'rundurance_settings';

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon');
  const text  = document.getElementById('toast-msg');

  toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
    type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
  }`;
  icon.className = `bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`;
  text.textContent = msg;

  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ── Settings persistence (localStorage) ─────────────────────────────────────
function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(partial) {
  const current = loadSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...partial }));
}

function applySettingsToUI() {
  const s = loadSettings();

  const setChecked = (id, defaultVal) => {
    const el = document.getElementById(id);
    if (el) el.checked = s[id] !== undefined ? s[id] : defaultVal;
  };

  setChecked('cfg-notify-athletes', true);
  setChecked('cfg-notify-payments', true);
  setChecked('cfg-notify-weekly', false);
  setChecked('cfg-garmin-toggle', false);

  const n8nInput = document.getElementById('cfg-n8n-url');
  if (n8nInput && s['cfg-n8n-url']) n8nInput.value = s['cfg-n8n-url'];
}

// ── Load profile into form ───────────────────────────────────────────────────
function loadProfile() {
  const raw = sessionStorage.getItem('trainer');
  if (!raw) return;
  try {
    const trainer = JSON.parse(raw);
    const nameEl  = document.getElementById('cfg-name');
    const emailEl = document.getElementById('cfg-email');
    const phoneEl = document.getElementById('cfg-phone');
    if (nameEl)  nameEl.value  = `${trainer.first_name} ${trainer.last_name || ''}`.trim();
    if (emailEl) emailEl.value = trainer.email || '';
    if (phoneEl) phoneEl.value = trainer.phone || '';
  } catch {
    // ignore
  }
}

// ── Save profile ─────────────────────────────────────────────────────────────
async function saveProfile() {
  const fullName = document.getElementById('cfg-name').value.trim();
  const email    = document.getElementById('cfg-email').value.trim();
  const phone    = document.getElementById('cfg-phone').value.trim() || null;

  if (!fullName || !email) {
    showToast('Nombre y correo son requeridos', 'error');
    return;
  }

  const parts      = fullName.split(' ');
  const first_name = parts[0];
  const last_name  = parts.slice(1).join(' ') || '';

  const btn = document.getElementById('btn-save-profile');
  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    const updated = await apiPatch('/auth/me', { first_name, last_name, email, phone });

    // Persist updated trainer in session so sidebar/other pages reflect change
    const raw = sessionStorage.getItem('trainer');
    if (raw) {
      const trainer = JSON.parse(raw);
      sessionStorage.setItem('trainer', JSON.stringify({ ...trainer, ...updated }));
      loadSidebar();
    }

    showToast('Perfil actualizado correctamente');
  } catch (err) {
    showToast(err.message || 'Error al guardar perfil', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar cambios';
  }
}

// ── Password modal ───────────────────────────────────────────────────────────
function openPasswordModal() {
  document.getElementById('pwd-current').value  = '';
  document.getElementById('pwd-new').value      = '';
  document.getElementById('pwd-confirm').value  = '';
  document.getElementById('pwd-error').classList.add('hidden');
  const modal = document.getElementById('modal-password');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePasswordModal() {
  const modal = document.getElementById('modal-password');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function submitPasswordChange() {
  const current  = document.getElementById('pwd-current').value;
  const newPwd   = document.getElementById('pwd-new').value;
  const confirm  = document.getElementById('pwd-confirm').value;
  const errorEl  = document.getElementById('pwd-error');

  errorEl.classList.add('hidden');

  if (!current || !newPwd || !confirm) {
    errorEl.textContent = 'Todos los campos son requeridos';
    errorEl.classList.remove('hidden');
    return;
  }
  if (newPwd.length < 6) {
    errorEl.textContent = 'La nueva contraseña debe tener al menos 6 caracteres';
    errorEl.classList.remove('hidden');
    return;
  }
  if (newPwd !== confirm) {
    errorEl.textContent = 'Las contraseñas no coinciden';
    errorEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-submit-password');
  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    await apiPatch('/auth/me/password', { current_password: current, new_password: newPwd });
    closePasswordModal();
    showToast('Contraseña actualizada correctamente');
  } catch (err) {
    errorEl.textContent = err.message || 'Error al cambiar contraseña';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar';
  }
}

// ── Logout ───────────────────────────────────────────────────────────────────
function setupLogout() {
  const btn = document.getElementById('btn-logout');
  if (btn) {
    btn.addEventListener('click', () => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('trainer');
      window.location.href = 'login.html';
    });
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  applySettingsToUI();
  setupLogout();

  document.getElementById('btn-save-profile')
    .addEventListener('click', saveProfile);

  document.getElementById('btn-change-password')
    .addEventListener('click', openPasswordModal);

  document.getElementById('btn-close-password-modal')
    .addEventListener('click', closePasswordModal);

  document.getElementById('btn-cancel-password')
    .addEventListener('click', closePasswordModal);

  document.getElementById('btn-submit-password')
    .addEventListener('click', submitPasswordChange);

  // Close modal on backdrop click
  document.getElementById('modal-password')
    .addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closePasswordModal();
    });

  // Notification toggles — persist on change
  ['cfg-notify-athletes', 'cfg-notify-payments', 'cfg-notify-weekly'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      saveSettings({ [id]: e.target.checked });
      showToast('Preferencia de notificación guardada');
    });
  });

  // Garmin toggle
  document.getElementById('cfg-garmin-toggle')?.addEventListener('change', (e) => {
    saveSettings({ 'cfg-garmin-toggle': e.target.checked });
    showToast(e.target.checked ? 'Garmin Connect activado' : 'Garmin Connect desactivado');
  });

  // Save integrations (n8n URL)
  document.getElementById('btn-save-integrations')?.addEventListener('click', () => {
    const url = document.getElementById('cfg-n8n-url')?.value.trim() || '';
    saveSettings({ 'cfg-n8n-url': url });
    showToast(url ? 'Integraciones guardadas' : 'URL de webhook eliminada');
  });

  // Delete account
  document.getElementById('btn-delete-account')?.addEventListener('click', async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    try {
      await apiDelete('/auth/me');
      sessionStorage.clear();
      window.location.href = 'login.html';
    } catch (err) {
      showToast(err.message || 'Error al eliminar cuenta', 'error');
    }
  });
});
