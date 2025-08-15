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
                <div class="card">
                    <h3>Narrative Forecast</h3>
                    <pre>${aiText.replace(/```json[\s\S]*```/, "").trim()}</pre>
                </div>
            `;

            if (jsonData && jsonData.forecasts) {
                html += `<div class="card"><h3>Forecast Summary</h3><div class="forecast-grid">`;
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
            displayMode: 'modal',
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
