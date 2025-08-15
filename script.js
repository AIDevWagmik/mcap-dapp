document.addEventListener("DOMContentLoaded", () => {
    const disclaimerModal = document.getElementById("disclaimerModal");
    const acceptBtn = document.getElementById("acceptDisclaimer");

    // Check if user already accepted
    if (localStorage.getItem("disclaimerAccepted") === "true") {
        disclaimerModal.style.display = "none";
    } else {
        disclaimerModal.style.display = "flex";
    }

    // Accept button click
    acceptBtn.addEventListener("click", () => {
        localStorage.setItem("disclaimerAccepted", "true");
        disclaimerModal.style.display = "none";
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");
    const predictionBtn = document.getElementById("getPrediction");
    const predictionResult = document.getElementById("predictionResult");

    // Theme toggle
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

    // Prediction
    predictionBtn.addEventListener("click", async () => {
        const addr = document.getElementById("contractAddress").value.trim();
        if (!addr) {
            alert("Please enter a contract address.");
            return;
        }

        predictionResult.classList.remove("hidden");
        predictionResult.innerHTML = `<p>Loading prediction...</p>`;

        try {
            const res = await fetch("https://mcap-backend.onrender.com/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contractAddress: addr,
                    symbol: "MCAP",
                    decimals: 9
                })
            });

            const data = await res.json();
            const aiText = data?.choices?.[0]?.message?.content || "No response from AI";

            const jsonMatch = aiText.match(/```json([\s\S]*?)```/);
            let jsonData = null;
            if (jsonMatch) {
                try {
                    jsonData = JSON.parse(jsonMatch[1]);
                } catch (err) {
                    console.error("JSON parse error", err);
                }
            }

            let html = `
    <div>
        <h3 class="section-title">Narrative Forecast</h3>
        <pre>${aiText.replace(/```json[\s\S]*```/, "").trim()}</pre>
    </div>
`;

if (jsonData && jsonData.forecasts) {
    html += `<div><h3 class="section-title">Forecast Summary</h3><div class="forecast-grid">`;
    Object.entries(jsonData.forecasts).forEach(([period, values]) => {
        html += `
            <div class="forecast-card">
                <h4>${period.toUpperCase()}</h4>
                <p class="low">Low: $${values.low.toLocaleString()}</p>
                <p class="base">Base: $${values.base.toLocaleString()}</p>
                <p class="high">High: $${values.high.toLocaleString()}</p>
            </div>
        `;
    });
    html += `</div></div>`;
}

predictionResult.innerHTML = html;


  // Show share buttons after prediction loads
const shareDiv = document.getElementById("shareButtons");
shareDiv.classList.remove("hidden");

const shareMessage = "Just used the MCAP app from @mcapmovement using XAI (Grok 4) — try it for yourself with any token address.";

document.getElementById("shareX").onclick = () => {
    const text = encodeURIComponent(shareMessage);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
};

document.getElementById("shareTelegram").onclick = () => {
    const text = encodeURIComponent(shareMessage);
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
};

} catch (err) {
    predictionResult.innerHTML = `<p>Error fetching prediction.</p>`;
    console.error(err);
}
    });
});

// -----------------
// Jupiter Swap Integration
// -----------------
(function(){
    let jupInited = false;
    let jupInitPromise = null;

    function ensureJupiter(){
        if (jupInited) return jupInitPromise;
        if (!window.Jupiter) return Promise.reject(new Error('Jupiter not loaded'));

        jupInited = true;
        jupInitPromise = window.Jupiter.init({
         displayMode: 'integrated',
         container: document.getElementById('jupiterContainer'),
         formProps: {
                initialInputMint: 'So11111111111111111111111111111111111111112', // SOL
                initialOutputMint: 'HTJjDuxxnxHGoKTiTYLMFQ59gFjSBS3bXiCWJML6bonk' // MCAP token
            }
        });
        return jupInitPromise;
    }

    window.addEventListener('load', function(){
        const trigger = document.getElementById('openSwap');
        if (trigger) {
            trigger.addEventListener('click', async function(e){
                e.preventDefault();
                try {
                    await ensureJupiter();
                    if (window.Jupiter?.resume) window.Jupiter.resume();
                } catch(err){
                    console.error('Jupiter not ready:', err);
                }
            });
        }
    });
})();

// -----------------
// Service Worker
// -----------------
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js")
            .then((reg) => console.log("Service Worker registered:", reg.scope))
            .catch((err) => console.error("Service Worker registration failed:", err));
    });
}

// -----------------
// Swipe Navigation
// -----------------
let currentScreen = 0;
const totalScreens = 3;
let startX = 0;

const app = document.getElementById('app');

app.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

app.addEventListener('touchend', e => {
  const endX = e.changedTouches[0].clientX;
  const deltaX = startX - endX;

  if (Math.abs(deltaX) > 50) { // swipe threshold
    if (deltaX > 0 && currentScreen < totalScreens - 1) {
      currentScreen++;
    } else if (deltaX < 0 && currentScreen > 0) {
      currentScreen--;
    }
    app.style.transform = `translateX(-${currentScreen * 100}%)`;
  }
});

const headerLogo = document.getElementById("header-logo");

// Map each screen index to its PNG
const headerImages = [
  "assets/logos/logo1.png", // Prediction screen
  "assets/logos/logo2.png", // Jupiter Swap screen
  "assets/logos/logo3.png"  // Wallet Tracking screen
];

function updateHeaderLogo(index) {
  headerLogo.src = headerImages[index];
}

// Call when swipe changes
function goToScreen(index) {
  currentScreen = index;
  app.style.transform = `translateX(-${currentScreen * 100}%)`;
  updateHeaderLogo(currentScreen);
}

// Update swipe logic to use goToScreen
app.addEventListener('touchend', e => {
  const endX = e.changedTouches[0].clientX;
  const deltaX = startX - endX;

  if (Math.abs(deltaX) > 50) {
    if (deltaX > 0 && currentScreen < totalScreens - 1) {
      goToScreen(currentScreen + 1);
    } else if (deltaX < 0 && currentScreen > 0) {
      goToScreen(currentScreen - 1);
    }
  }
});


