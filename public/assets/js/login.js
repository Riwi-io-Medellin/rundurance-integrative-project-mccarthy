<<<<<<< develop
import { apiPost } from "./api.js";

document.getElementById("forgot-password")?.addEventListener("click", (e) => {
  e.preventDefault();
  const msg = document.getElementById("forgot-msg");
  if (msg) {
    msg.textContent = "Para restablecer tu contraseña, contacta al administrador del sistema.";
    msg.classList.remove("hidden");
  }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const btn = e.target.querySelector('button[type="submit"]');

  btn.disabled = true;
  btn.textContent = "Ingresando...";

  try {
    const data = await apiPost("/auth/login", { email, password });
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("trainer", JSON.stringify(data.trainer));
    window.location.href = "dashboard.html";
  } catch (err) {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.textContent = err.message || 'Error al iniciar sesión';
      errEl.classList.remove('hidden');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Iniciar sesión";
=======
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const btn = this.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Credenciales incorrectas');
    }

    localStorage.setItem('token', data.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = originalText;
>>>>>>> main
  }
});
