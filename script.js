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
let connectedWalletProvider = null; // for Jupiter

function detectInjectedWallets() {
    const wallets = [];

    if (window.solana?.isPhantom) {
        wallets.push({ name: "Phantom", provider: window.solana });
    }
    if (window.solana?.isBackpack) {
        wallets.push({ name: "Backpack", provider: window.solana });
    }
    if (window.solflare) {
        wallets.push({ name: "Solflare", provider: window.solflare });
    }

    return wallets;
}

async function connectWallet() {
    const injectedWallets = detectInjectedWallets();

    // 1. Desktop injected wallets
    if (injectedWallets.length > 0) {
        let walletChoice;
        if (injectedWallets.length === 1) {
            walletChoice = injectedWallets[0];
        } else {
            const choiceName = prompt(`Select a wallet: ${injectedWallets.map(w => w.name).join(", ")}`);
            walletChoice = injectedWallets.find(w => w.name.toLowerCase() === choiceName?.toLowerCase());
            if (!walletChoice) {
                alert("Invalid choice.");
                return;
            }
        }

        try {
            const resp = await walletChoice.provider.connect();
            connectedWallet = resp.publicKey.toString();
            connectedWalletProvider = walletChoice.provider;
            document.getElementById("connectWallet").innerText =
                `Wallet: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
            console.log(`Connected to ${walletChoice.name}:`, connectedWallet);
            return;
        } catch (err) {
            console.error(`${walletChoice.name} connection failed:`, err);
        }
    }

    // 2. APK / Solana Mobile Wallet Adapter
    try {
        const mwa = window["solanaMobileWalletAdapter"];
        if (mwa) {
            const session = await mwa.connect();
            if (session && session.publicKey) {
                connectedWallet = session.publicKey;
                connectedWalletProvider = mwa;
                document.getElementById("connectWallet").innerText =
                    `Wallet: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
                console.log("Connected via Mobile Wallet Adapter:", connectedWallet);
                return;
            }
        }
    } catch (err) {
        console.error("Mobile Wallet Adapter connection failed:", err);
    }

    // 3. Mobile browser → WalletConnect fallback
    try {
        console.log("Falling back to WalletConnect...");
        const connector = new window.WalletConnect.default({
            bridge: "https://bridge.walletconnect.org",
            qrcodeModal: window.WalletConnectQRCodeModal
        });

        if (!connector.connected) {
            await connector.createSession();
        }

        connector.on("connect", (error, payload) => {
            if (error) throw error;
            const { accounts } = payload.params[0];
            connectedWallet = accounts[0];
            connectedWalletProvider = connector;
            document.getElementById("connectWallet").innerText =
                `Wallet: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
            console.log("Connected via WalletConnect:", connectedWallet);
        });

    } catch (err) {
        console.error("WalletConnect connection failed:", err);
        alert("No supported wallet found. Please install Phantom, Backpack, or Solflare.");
    }
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);


// =========================
// Jupiter Swap integration
// =========================
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
                    if (!connectedWallet) {
                        await connectWallet();
                    }
                    return connectedWalletProvider; // Pass provider to Jupiter
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
