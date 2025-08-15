document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const predictionBtn = document.getElementById("getPrediction");
  const predictionResult = document.getElementById("predictionResult");

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      themeToggle.textContent = "🌙";
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggle.textContent = "☀️";
      localStorage.setItem("theme", "dark");
    }
  });

  // Mock prediction until API is ready
  predictionBtn.addEventListener("click", () => {
    const addr = document.getElementById("contractAddress").value.trim();
    if (!addr) {
      alert("Please enter a contract address.");
      return;
    }
    predictionResult.classList.remove("hidden");
    predictionResult.innerHTML = `
      <p><strong>Low:</strong> $5M</p>
      <p><strong>Base:</strong> $10M</p>
      <p><strong>High:</strong> $20M</p>
    `;
  });
});

