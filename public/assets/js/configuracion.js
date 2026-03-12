import { checkAuth, loadSidebar } from './api.js';

checkAuth();
loadSidebar();

function loadProfile() {
  const raw = sessionStorage.getItem('trainer');
  if (!raw) return;

  try {
    const trainer = JSON.parse(raw);
    const nameInput = document.getElementById('cfg-name');
    const emailInput = document.getElementById('cfg-email');

    if (nameInput && trainer.first_name) {
      nameInput.value = `${trainer.first_name} ${trainer.last_name || ''}`.trim();
    }
    if (emailInput && trainer.email) {
      emailInput.value = trainer.email;
    }
  } catch {
    // ignore parse errors
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  setupLogout();
});
