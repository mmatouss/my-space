// ==========================================================================
// ISBN SCANNER FOR LIBRARIANS - CORE JAVASCRIPT
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const btnToggleScanner = document.getElementById("btn-toggle-scanner");
  const btnSwitchCamera = document.getElementById("btn-switch-camera");
  const scannerPlaceholder = document.getElementById("scanner-placeholder");
  const readerElement = document.getElementById("reader");

  const manualForm = document.getElementById("manual-isbn-form");
  const isbnInput = document.getElementById("isbn-input");

  const isbnListElement = document.getElementById("isbn-list");
  const emptyStateElement = document.getElementById("empty-state");
  const countBadgeElement = document.getElementById("isbn-count-badge");
  const toastElement = document.getElementById("toast-message");

  const btnCopyAll = document.getElementById("btn-copy-all");
  const btnClearAll = document.getElementById("btn-clear-all");

  // --- State Variables ---
  let html5QrCode = null;
  let isScanning = false;
  let currentCameraId = null;
  let availableCameras = [];
  let cameraIndex = 0;
  let lastScannedCode = "";
  let lastScanTimestamp = 0;

  const STORAGE_KEY = "librarian_isbn_list_v1";
  let isbnList = loadIsbnList();

  // Audio effect for scan confirmation
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep() {
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio playback failed or blocked
    }
  }

  function triggerVibration() {
    if ("vibrate" in navigator) {
      navigator.vibrate(100);
    }
  }

  // --- Toast Notification ---
  let toastTimeout = null;
  function showToast(message, type = "info") {
    if (!toastElement) return;
    toastElement.textContent = message;
    toastElement.className = `toast-message toast-${type}`;
    toastElement.style.display = "block";

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastElement.style.display = "none";
    }, 3500);
  }

  // --- Storage Management ---
  function loadIsbnList() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load list from localStorage", e);
      return [];
    }
  }

  function saveIsbnList() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isbnList));
    } catch (e) {
      console.error("Failed to save list to localStorage", e);
    }
  }

  // --- ISBN Formatting & Cleaning ---
  function cleanIsbn(str) {
    if (!str) return "";
    // Normalize string: uppercase, remove spaces/dashes for comparison if needed
    return str.trim();
  }

  function addIsbnToList(isbn, method = "scan") {
    const cleaned = cleanIsbn(isbn);
    if (!cleaned) {
      showToast("Chyba: Zadané ISBN je prázdné.", "error");
      return false;
    }

    // Check if already exists in list
    const exists = isbnList.some(item => cleanIsbn(item.isbn) === cleaned);
    if (exists) {
      showToast(`ISBN "${cleaned}" již v seznamu existuje.`, "info");
      return false;
    }

    const newItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      isbn: cleaned,
      timestamp: new Date().toLocaleString("cs-CZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      method: method // 'scan' or 'manual'
    };

    isbnList.unshift(newItem); // add to top
    saveIsbnList();
    renderIsbnList();
    playBeep();
    triggerVibration();
    showToast(`ISBN "${cleaned}" bylo úspěšně přidáno!`, "success");
    return true;
  }

  function removeIsbnFromList(id) {
    isbnList = isbnList.filter(item => item.id !== id);
    saveIsbnList();
    renderIsbnList();
    showToast("Položka byla smazána.", "info");
  }

  function clearAllIsbns() {
    if (isbnList.length === 0) return;
    if (confirm("Opravdu chcete vymazat celý seznam naskenovaných ISBN?")) {
      isbnList = [];
      saveIsbnList();
      renderIsbnList();
      showToast("Seznam byl vyčištěn.", "info");
    }
  }

  function copyAllToClipboard() {
    if (isbnList.length === 0) {
      showToast("Seznam je prázdný, není co kopírovat.", "info");
      return;
    }

    const textToCopy = isbnList.map(item => item.isbn).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Všechna ISBN byla zkopírována do schránky!", "success");
      }).catch(err => {
        fallbackCopyText(textToCopy);
      });
    } else {
      fallbackCopyText(textToCopy);
    }
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("Všechna ISBN byla zkopírována do schránky!", "success");
    } catch (err) {
      showToast("Kopírování selhalo.", "error");
    }
    document.body.removeChild(textArea);
  }

  // --- Render UI ---
  function renderIsbnList() {
    if (!isbnListElement || !emptyStateElement || !countBadgeElement) return;

    countBadgeElement.textContent = `${isbnList.length} ${getPluralForm(isbnList.length, ['knihu', 'knihy', 'knih'])}`;

    if (isbnList.length === 0) {
      isbnListElement.style.display = "none";
      emptyStateElement.style.display = "flex";
      return;
    }

    isbnListElement.style.display = "flex";
    emptyStateElement.style.display = "none";
    isbnListElement.innerHTML = "";

    isbnList.forEach(item => {
      const li = document.createElement("li");
      li.className = "isbn-item";

      const methodTagClass = item.method === "scan" ? "tag-scan" : "tag-manual";
      const methodTagLabel = item.method === "scan" ? "📷 Skener" : "✍️ Ručně";

      li.innerHTML = `
        <div class="isbn-item-info">
          <span class="isbn-value">${escapeHtml(item.isbn)}</span>
          <div class="isbn-meta">
            <span class="tag-method ${methodTagClass}">${methodTagLabel}</span>
            <span>• ${escapeHtml(item.timestamp)}</span>
          </div>
        </div>
        <button class="btn-icon-danger btn-delete-item" data-id="${item.id}" title="Smazat">
          🗑️
        </button>
      `;

      isbnListElement.appendChild(li);
    });

    // Attach click handlers to delete buttons
    document.querySelectorAll(".btn-delete-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        removeIsbnFromList(id);
      });
    });
  }

  function getPluralForm(count, forms) {
    if (count === 1) return forms[0];
    if (count >= 2 && count <= 4) return forms[1];
    return forms[2];
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[match]);
  }

  // --- Barcode Scanner Integration ---
  async function startScanner() {
    try {
      if (typeof Html5Qrcode === "undefined") {
        showToast("Knihovna pro skenování se nenačtla. Zkontrolujte připojení.", "error");
        return;
      }

      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
      }

      availableCameras = await Html5Qrcode.getCameras();
      if (!availableCameras || availableCameras.length === 0) {
        showToast("Nebyly nalezeny žádné dostupné kamery.", "error");
        return;
      }

      // Prefer back camera
      const backCamera = availableCameras.find(cam =>
        cam.label.toLowerCase().includes("back") ||
        cam.label.toLowerCase().includes("zadní") ||
        cam.label.toLowerCase().includes("environment")
      );

      currentCameraId = backCamera ? backCamera.id : availableCameras[0].id;
      cameraIndex = availableCameras.findIndex(cam => cam.id === currentCameraId);

      if (availableCameras.length > 1) {
        btnSwitchCamera.style.display = "inline-flex";
      } else {
        btnSwitchCamera.style.display = "none";
      }

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.777778,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.CODE_128
        ]
      };

      scannerPlaceholder.style.display = "none";

      await html5QrCode.start(
        currentCameraId,
        config,
        onScanSuccess,
        onScanError
      );

      isScanning = true;
      btnToggleScanner.textContent = "⏹️ Zastavit skener";
      btnToggleScanner.className = "btn btn-secondary btn-block";

    } catch (err) {
      console.error("Error starting camera scanner:", err);
      showToast("Chyba při spouštění kamery: " + (err.message || err), "error");
      stopScanner();
    }
  }

  async function stopScanner() {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }

    isScanning = false;
    scannerPlaceholder.style.display = "flex";
    btnToggleScanner.textContent = "▶️ Spustit skener";
    btnToggleScanner.className = "btn btn-primary btn-block";
    btnSwitchCamera.style.display = "none";
  }

  function onScanSuccess(decodedText, decodedResult) {
    const now = Date.now();
    // Cooldown to prevent multiple scans of the same code within 2 seconds
    if (decodedText === lastScannedCode && (now - lastScanTimestamp) < 2000) {
      return;
    }

    lastScannedCode = decodedText;
    lastScanTimestamp = now;

    addIsbnToList(decodedText, "scan");
  }

  function onScanError(errorMessage) {
    // Ignore frame-by-frame decoding errors
  }

  // --- Event Listeners ---
  btnToggleScanner.addEventListener("click", () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  });

  btnSwitchCamera.addEventListener("click", async () => {
    if (!isScanning || availableCameras.length < 2) return;

    cameraIndex = (cameraIndex + 1) % availableCameras.length;
    currentCameraId = availableCameras[cameraIndex].id;

    await stopScanner();
    startScanner();
  });

  manualForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = isbnInput.value.trim();
    if (value) {
      const added = addIsbnToList(value, "manual");
      if (added) {
        isbnInput.value = "";
      }
    }
  });

  btnCopyAll.addEventListener("click", copyAllToClipboard);
  btnClearAll.addEventListener("click", clearAllIsbns);

  // Initial render
  renderIsbnList();
});
