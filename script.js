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

  // Fetch real prediction
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

      // Extract AI message content
      const aiText = data?.choices?.[0]?.message?.content || "No response from AI";

      // Split narrative and JSON if present
      const jsonMatch = aiText.match(/```json([\s\S]*?)```/);
      let jsonData = null;
      if (jsonMatch) {
        try {
          jsonData = JSON.parse(jsonMatch[1]);
        } catch (err) {
          console.error("JSON parse error", err);
        }
      }

      // Render nicely
      // Narrative section
let html = `
  <div class="card">
    <h3>Narrative Forecast</h3>
    <pre>${aiText.replace(/```json[\s\S]*```/, "").trim()}</pre>
  </div>
`;

// Forecast cards
if (jsonData && jsonData.forecasts) {
  html += `
    <div class="card">
      <h3>Forecast Summary</h3>
      <div class="forecast-grid">
  `;

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
// Wallet & Jupiter
// -----------------
import { WalletAdapterNetwork } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-base@0.9.23/+esm";
import { PhantomWalletAdapter } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-phantom@0.9.13/+esm";
import { BackpackWalletAdapter } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-backpack@0.1.9/+esm";
import { SolflareWalletAdapter } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-solflare@0.6.28/+esm";
import { GlowWalletAdapter } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-glow@0.1.9/+esm";
import { WalletConnectWalletAdapter } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-walletconnect@0.1.14/+esm";
import { WalletAdapterMobile } from "https://cdn.jsdelivr.net/npm/@solana-mobile/wallet-adapter-mobile@0.1.7/+esm";
import { WalletModal } from "https://cdn.jsdelivr.net/npm/@solana/wallet-adapter-ui@0.9.35/+esm";


let connectedWallet = null;
let connectedWalletProvider = null;

console.log("Wallet section loaded");

function waitForElement(id, callback) {
    function startObserving() {
        const el = document.getElementById(id);
        if (el) return callback(el);
        const observer = new MutationObserver(() => {
            const el = document.getElementById(id);
            if (el) {
                observer.disconnect();
                callback(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    if (document.body) startObserving();
    else document.addEventListener("DOMContentLoaded", startObserving);
}

async function initWalletAdapter() {
    const network = WalletAdapterNetwork.Mainnet;

    const wallets = [
        new PhantomWalletAdapter(),
        new BackpackWalletAdapter(),
        new SolflareWalletAdapter({ network }),
        new GlowWalletAdapter(),
        new WalletConnectWalletAdapter({
            network,
            options: {
                relayUrl: "wss://relay.walletconnect.com",
                projectId: "test"
            }
        }),
        new WalletAdapterMobile({
            appIdentity: { name: "MCAP App" },
            network
        })
    ];

    const modal = new WalletModal(wallets, {
        container: document.getElementById("wallet-modal-root")
    });

    modal.on("connect", (wallet) => {
        connectedWalletProvider = wallet.adapter;
        connectedWallet = wallet.adapter.publicKey?.toBase58() || null;
        if (connectedWallet) {
            document.getElementById("connectWallet").innerText =
                `Wallet: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
            console.log(`Connected to wallet: ${connectedWallet}`);
        }
    });

    waitForElement("connectWallet", (btn) => {
        btn.addEventListener("click", () => modal.show());
    });
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, initializing wallet adapter...");
    initWalletAdapter().catch(err => console.error("Wallet adapter init failed:", err));
});

// Jupiter Swap integration
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
                initialInputMint: 'So11111111111111111111111111111111111111112',
                initialOutputMint: 'HTJjDuxxnxHGoKTiTYLMFQ59gFjSBS3bXiCWJML6bonk',
                onConnectWallet: async () => {
                    if (!connectedWalletProvider) {
                        const btn = document.getElementById("connectWallet");
                        if (btn) btn.click();
                    }
                    return connectedWalletProvider;
                }
            }
        });
        return jupInitPromise;
    }

    waitForElement("openSwap", (swapBtn) => {
        swapBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await ensureJupiter();
                if (window.Jupiter?.resume) window.Jupiter.resume();
            } catch(err) {
                console.error('Jupiter not ready:', err);
            }
        });
    });
})();


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js") // ✅ relative path, works in subfolder
            .then((reg) => console.log("Service Worker registered:", reg.scope))
            .catch((err) => console.error("Service Worker registration failed:", err));
    });
}
