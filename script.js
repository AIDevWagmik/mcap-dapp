document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.documentElement;
  const predictionBtn = document.getElementById("getPrediction");
  const predictionResult = document.getElementById("predictionResult");

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    body.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  }

  // Theme toggle
  themeToggle.addEventListener("click", () => {
    const isDark = body.getAttribute("data-theme") === "dark";
    if (isDark) {
      body.removeAttribute("data-theme");
      themeToggle.textContent = "🌙";
      localStorage.setItem("theme", "light");
    } else {
      body.setAttribute("data-theme", "dark");
      themeToggle.textContent = "☀️";
      localStorage.setItem("theme", "dark");
    }
  });

  // Prediction (mock until API connected)
  predictionBtn.addEventListener("click", () => {
    const addr = document.getElementById("contractAddress").value.trim();
    if (!addr) {
      alert("Please enter a contract address.");
      return;
    }
    predictionResult.classList.remove("hidden");
    predictionResult.innerHTML = `
      <h3>Forecast for ${addr}</h3>
      <p>Low: $5M – Base: $10M – High: $20M</p>
      <small>⚠ Entertainment only – not financial advice.</small>
    `;
  });

  // Jupiter swap placeholder
  document.getElementById("openSwap").addEventListener("click", () => {
    alert("Jupiter swap integration coming soon!");
  });
});
