import { apiPost } from "./api.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const data = await apiPost("/auth/login", { email, password });
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("trainer", JSON.stringify(data.trainer));
    window.location.href = "dashboard.html";
  } catch (err) {
    alert(err.message);
  }
});
