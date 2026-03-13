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
  }
});
