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

let connectedWallet = null;
let connectedWalletProvider = null;

console.log("script.js loaded");

async function initWalletAdapter() {
    if (!window.solanaWalletAdapterBase) {
        throw new Error("Wallet Adapter SDK not loaded yet.");
    }

    const { WalletAdapterNetwork } = solanaWalletAdapterBase;
    const network = WalletAdapterNetwork.Mainnet;

    const wallets = [
        new solanaWalletAdapterWallets.PhantomWalletAdapter(),
        new solanaWalletAdapterWallets.BackpackWalletAdapter(),
        new solanaWalletAdapterWallets.SolflareWalletAdapter({ network }),
        new solanaWalletAdapterWallets.GlowWalletAdapter(),
        new solanaWalletAdapterWalletconnect.WalletConnectWalletAdapter({
            network,
            options: {
                relayUrl: "wss://relay.walletconnect.com",
                projectId: "test" // Replace with your WC project ID
            }
        }),
        new solanaMobileWalletAdapter.WalletAdapterMobile({
            appIdentity: { name: "MCAP App" },
            network
        })
    ];

    const modal = new solanaWalletAdapterUI.WalletModal(wallets, {
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

    // Wait until the button exists before binding
    const btnCheck = setInterval(() => {
        const btn = document.getElementById("connectWallet");
        if (btn) {
            clearInterval(btnCheck);
            btn.addEventListener("click", () => modal.show());
        }
    }, 100);
}

// Run once DOM is ready and SDK loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, waiting for SDK...");

    const waitForSDK = setInterval(() => {
        if (window.solanaWalletAdapterBase) {
            clearInterval(waitForSDK);
            console.log("SDK detected, initializing wallet adapter...");
            initWalletAdapter()
                .then(() => console.log("initWalletAdapter finished"))
                .catch(err => console.error("Wallet adapter init failed:", err));
        }
    }, 100);
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
                initialInputMint: 'So11111111111111111111111111111111111111112', // SOL
                initialOutputMint: 'HTJjDuxxnxHGoKTiTYLMFQ59gFjSBS3bXiCWJML6bonk', // MCAP token mint
                onConnectWallet: async () => {
                    if (!connectedWalletProvider) {
                        document.getElementById("connectWallet").click(); // open modal
                    }
                    return connectedWalletProvider;
                }
            }
        });
        return jupInitPromise;
    }

    document.getElementById('openSwap').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await ensureJupiter();
            if (window.Jupiter?.resume) window.Jupiter.resume();
        } catch(err) {
            console.error('Jupiter not ready:', err);
        }
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
