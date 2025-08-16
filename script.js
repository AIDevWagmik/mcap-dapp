document.addEventListener("DOMContentLoaded", () => {
  /* -----------------
     Disclaimer Modal
  -------------------*/
  const disclaimerModal = document.getElementById("disclaimerModal");
  const acceptBtn = document.getElementById("acceptDisclaimer");

  if (localStorage.getItem("disclaimerAccepted") === "true") {
    disclaimerModal.style.display = "none";
  } else {
    disclaimerModal.style.display = "flex";
  }

  acceptBtn.addEventListener("click", () => {
    localStorage.setItem("disclaimerAccepted", "true");
    disclaimerModal.style.display = "none";
  });

  /* -----------------
     Theme Toggle
  -------------------*/
  const themeToggle = document.getElementById("themeToggle");
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  }
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
    themeToggle.textContent = isDark ? "🌙" : "☀️";
    localStorage.setItem("theme", isDark ? "light" : "dark");
  });

  /* -----------------
     Prediction Fetch
  -------------------*/
  const predictionBtn = document.getElementById("getPrediction");
  const predictionResult = document.getElementById("predictionResult");
  predictionBtn.addEventListener("click", async () => {
    const addr = document.getElementById("contractAddress").value.trim();
    if (!addr) return alert("Please enter a contract address.");
    predictionResult.innerHTML = `<p>Loading prediction...</p>`;
    try {
      const res = await fetch("https://mcap-backend.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress: addr, symbol: "MCAP", decimals: 9 })
      });
      const data = await res.json();
      const aiText = data?.choices?.[0]?.message?.content || "No response from AI";

      const jsonMatch = aiText.match(/```json([\s\S]*?)```/);
      let jsonData = null;
      if (jsonMatch) {
        try { jsonData = JSON.parse(jsonMatch[1]); } catch {}
      }

      let html = `
        <div>
          <h3 class="section-title">Narrative Forecast</h3>
          <pre>${aiText.replace(/```json[\s\S]*```/, "").trim()}</pre>
        </div>
      `;
      if (jsonData?.forecasts) {
        html += `<div><h3 class="section-title">Forecast Summary</h3><div class="forecast-grid">`;
        Object.entries(jsonData.forecasts).forEach(([period, values]) => {
          html += `
            <div class="forecast-card">
              <h4>${period.toUpperCase()}</h4>
              <p class="low">Low: $${values.low}</p>
              <p class="base">Base: $${values.base}</p>
              <p class="high">High: $${values.high}</p>
            </div>
          `;
        });
        html += `</div></div>`;
      }

      predictionResult.innerHTML = html;

      // Show share buttons
      const shareDiv = document.getElementById("shareButtons");
      shareDiv.classList.remove("hidden");

      const shareMessage = "Just used the MCAP app from @mcapmovement using XAI (Grok 4) — try it for yourself with any token address.";
      document.getElementById("shareX").onclick = () => {
        const text = encodeURIComponent(shareMessage);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
      };
      document.getElementById("shareTelegram").onclick = () => {
        const text = encodeURIComponent(shareMessage);
        window.open(`https://t.me/share/url?text=${text}`, "_blank");
      };

    } catch {
      predictionResult.innerHTML = `<p>Error fetching prediction.</p>`;
    }
  });
});

/* -----------------
   Jupiter Swap Integration
-------------------*/
(function(){
  let jupInited = false;
  let jupInitPromise = null;

  function ensureJupiter(){
    if (jupInited) return jupInitPromise;
    if (!window.Jupiter) return Promise.reject(new Error('Jupiter not loaded'));

    jupInited = true;
    jupInitPromise = window.Jupiter.init({
      displayMode: 'integrated',
      container: document.getElementById("jupiterContainer"),
      formProps: {
        initialInputMint: 'So11111111111111111111111111111111111111112',
        initialOutputMint: 'HTJjDuxxnxHGoKTiTYLMFQ59gFjSBS3bXiCWJML6bonk'
      }
    });
    return jupInitPromise;
  }

  window.addEventListener("load", () => {
    const trigger = document.getElementById("openSwap");
    if (trigger) {
      trigger.addEventListener("click", async e => {
        e.preventDefault();
        try {
          await ensureJupiter();
          if (window.Jupiter?.resume) window.Jupiter.resume();
        } catch (err) {
          console.error("Jupiter not ready:", err);
        }
      });
    }
  });
})();

/* -----------------
   Service Worker
-------------------*/
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(reg => console.log("Service Worker registered:", reg.scope))
      .catch(err => console.error("Service Worker registration failed:", err));
  });
}

/* -----------------
   Swipe Navigation + Header Logo (stable)
-------------------*/
let currentScreen = 0;
const totalScreens = 3;

const app = document.getElementById('app');
const headerLogo = document.getElementById("header-logo");
const headerImages = [
  "assets/logos/logo1.png",
  "assets/logos/logo2.png",
  "assets/logos/logo3.png"
];

function updateHeaderLogo(index) {
  headerLogo.src = headerImages[index];
}

function goToScreen(index) {
  if (index < 0) index = 0;
  if (index >= totalScreens) index = totalScreens - 1;
  currentScreen = index;
  app.style.transition = "transform 0.3s ease"; // ensure smooth snap
  app.style.transform = `translateX(-${currentScreen * 100}%)`;
  updateHeaderLogo(currentScreen);
}

// Reset transition after it ends (prevents double-animations)
app.addEventListener("transitionend", () => {
  app.style.transition = "";
});

// Swipe handling
let startX = 0;
app.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

app.addEventListener("touchend", e => {
  const deltaX = startX - e.changedTouches[0].clientX;

  if (Math.abs(deltaX) > 50) {
    if (deltaX > 0) goToScreen(currentScreen + 1); // swipe left → next
    else goToScreen(currentScreen - 1);            // swipe right → prev
  } else {
    goToScreen(currentScreen); // snap back if swipe too small
  }
});

