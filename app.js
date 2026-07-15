// Instant HTML Deployer
// Pure client-side: encodes user HTML into a `data:text/html;base64,...` URL
// that's a self-contained, shareable link. Any modern browser can open it.

const input         = document.getElementById("htmlInput");
const deployBtn     = document.getElementById("deployBtn");
const clearBtn      = document.getElementById("clearBtn");
const copyBtn       = document.getElementById("copyBtn");
const sampleBtn     = document.getElementById("loadSampleBtn");
const openLinkBtn   = document.getElementById("openLinkBtn");
const shortenBtn    = document.getElementById("shortenBtn");
const statusEl      = document.getElementById("status");
const resultEl      = document.getElementById("result");
const liveLinkEl    = document.getElementById("liveLink");

let currentDataUrl = null;

const SAMPLE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Site</title>
  <style>
    body { font-family: system-ui; margin: 0; min-height: 100vh;
           display: grid; place-items: center;
           background: linear-gradient(135deg, #667eea, #764ba2);
           color: white; text-align: center; }
    h1   { font-size: 3rem; margin: 0; }
    p    { opacity: 0.85; }
  </style>
</head>
<body>
  <div>
    <h1>🎉 It works!</h1>
    <p>This page was deployed in one click — no signup, no server.</p>
  </div>
</body>
</html>`;

function showStatus(type, html) {
  statusEl.className = `status ${type}`;
  statusEl.innerHTML = html;
  statusEl.classList.remove("hidden");
}
function hideStatus() { statusEl.classList.add("hidden"); }

function showResult(url) {
  currentDataUrl = url;
  liveLinkEl.href = url;
  liveLinkEl.textContent = url.length > 80 ? url.slice(0, 77) + "…" : url;
  liveLinkEl.title = url;
  resultEl.classList.remove("hidden");
  // size hint
  const kb = (new Blob([url]).size / 1024).toFixed(1);
  shortenBtn.disabled = url.length < 2000; // already small
  shortenBtn.textContent = url.length < 2000
    ? "Already compact"
    : "Try shorter";
}
function hideResult() { resultEl.classList.add("hidden"); }

function setDeploying(isDeploying) {
  deployBtn.disabled = isDeploying;
  deployBtn.querySelector("span").textContent = isDeploying ? "Generating..." : "Generate Link";
}

function htmlToDataUrl(html, useBase64 = true) {
  // base64 is more reliable across browsers (handles unicode, special chars)
  if (useBase64) {
    const bytes = new TextEncoder().encode(html);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return "data:text/html;charset=utf-8;base64," + btoa(bin);
  }
  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

function deploy() {
  const html = input.value.trim();
  if (!html) {
    showStatus("error", "⚠️ Please paste some HTML first.");
    return;
  }
  hideResult();
  setDeploying(true);
  showStatus("loading", `<div class="spinner"></div><span>Encoding your page...</span>`);

  // Tiny async delay so the spinner is visible (UX nicety)
  setTimeout(() => {
    try {
      const url = htmlToDataUrl(html, true);
      hideStatus();
      showResult(url);
    } catch (err) {
      console.error(err);
      showStatus("error", `❌ ${err.message}`);
    } finally {
      setDeploying(false);
    }
  }, 200);
}

function tryShorter() {
  const html = input.value.trim();
  if (!html) return;
  const url = htmlToDataUrl(html, false); // percent-encoded, often shorter for ASCII
  showResult(url);
}

async function copyLink() {
  if (!currentDataUrl) return;
  try {
    await navigator.clipboard.writeText(currentDataUrl);
    copyBtn.classList.add("copied");
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    }, 1500);
  } catch (e) {
    prompt("Copy this link:", currentDataUrl);
  }
}

deployBtn.addEventListener("click", deploy);
clearBtn.addEventListener("click", () => {
  input.value = "";
  hideStatus();
  hideResult();
  currentDataUrl = null;
  input.focus();
});
copyBtn.addEventListener("click", copyLink);
sampleBtn.addEventListener("click", () => {
  input.value = SAMPLE;
  input.focus();
});
openLinkBtn.addEventListener("click", () => {
  if (currentDataUrl) window.open(currentDataUrl, "_blank", "noopener");
});
shortenBtn.addEventListener("click", tryShorter);

input.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    deploy();
  }
});

input.focus();
