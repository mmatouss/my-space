// ==========================================================================
// ~* SON GOKU DRAGON BALL CATCH MINI-GAME & INTERACTIVE CONTROLS *~
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------------------------------------------------
  // 1. Super Saiyan Mode Toggle
  // ------------------------------------------------------------------------
  const ssjBtn = document.getElementById("ssj-toggle-btn");
  const ssjBadge = document.getElementById("ssj-badge");
  const statPower = document.getElementById("stat-power");
  let isSSJ = false;

  if (ssjBtn) {
    ssjBtn.addEventListener("click", () => {
      isSSJ = !isSSJ;
      document.body.classList.toggle("ssj-mode", isSSJ);

      if (isSSJ) {
        ssjBtn.innerHTML = "🔥 BASE FORM 🔥";
        if (ssjBadge) {
          ssjBadge.textContent = "SUPER SAIYAN";
          ssjBadge.classList.add("ssj-active-badge");
        }
        if (statPower) {
          statPower.textContent = "OVER 9000000! ⚡🔥";
        }
      } else {
        ssjBtn.innerHTML = "⚡ SUPER SAIYAN ⚡";
        if (ssjBadge) {
          ssjBadge.textContent = "Base Form";
          ssjBadge.classList.remove("ssj-active-badge");
        }
        if (statPower) {
          statPower.textContent = "OVER 9000! 🔥";
        }
      }
    });
  }

  // ------------------------------------------------------------------------
  // 2. Dragon Ball Catching Canvas Mini-Game
  // ------------------------------------------------------------------------
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  const scoreEl = document.getElementById("game-score");
  const highscoreEl = document.getElementById("game-highscore");
  const livesEl = document.getElementById("game-lives");
  const ballsCountEl = document.getElementById("game-balls-count");

  const overlay = document.getElementById("game-overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayDesc = document.getElementById("overlay-desc");
  const startBtn = document.getElementById("start-game-btn");

  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnAction = document.getElementById("btn-action");

  let highscore = parseInt(localStorage.getItem("goku_db_highscore") || "0", 10);
  if (highscoreEl) highscoreEl.textContent = highscore.toString();

  // Audio effects synthesizer (using Web Audio API)
  let audioCtx = null;
  function playBeep(type) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === "catch") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "meat") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "hit") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "win") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  // Game State
  let gameRunning = false;
  let score = 0;
  let lives = 3;
  let ballsCollected = 0;
  let animFrameId = null;

  // Player Object (Goku on Flying Cloud Kinto-un)
  const player = {
    x: 310,
    y: 330,
    width: 80,
    height: 50,
    speed: 7,
    dx: 0,
    turbo: false
  };

  // Falling Items
  let items = [];
  let lastItemSpawn = 0;
  const itemTypes = [
    { type: "ball", symbol: "🔮", points: 100, radius: 18, speedMin: 2.5, speedMax: 4.5 },
    { type: "meat", symbol: "🍖", points: 50, radius: 16, speedMin: 2.0, speedMax: 4.0 },
    { type: "rock", symbol: "☄️", points: 0, damage: 1, radius: 18, speedMin: 3.5, speedMax: 6.0 },
    { type: "weight", symbol: "🏋️", points: 0, damage: 1, radius: 18, speedMin: 3.0, speedMax: 5.5 }
  ];

  // Control Inputs State
  const keys = {
    left: false,
    right: false,
    boost: false
  };

  function initGame() {
    score = 0;
    lives = 3;
    ballsCollected = 0;
    items = [];
    player.x = (canvas.width - player.width) / 2;
    player.dx = 0;
    updateUI();
  }

  function updateUI() {
    if (scoreEl) scoreEl.textContent = score.toString();
    if (ballsCountEl) ballsCountEl.textContent = `${ballsCollected} / 7`;

    if (livesEl) {
      let hearts = "";
      for (let i = 0; i < lives; i++) hearts += "❤️";
      livesEl.textContent = hearts || "💀";
    }

    if (score > highscore) {
      highscore = score;
      localStorage.setItem("goku_db_highscore", highscore.toString());
      if (highscoreEl) highscoreEl.textContent = highscore.toString();
    }
  }

  function spawnItem() {
    const now = Date.now();
    // Spawn rate speeds up as score increases
    const spawnRate = Math.max(500, 1100 - score * 0.8);
    if (now - lastItemSpawn > spawnRate) {
      lastItemSpawn = now;

      // Random selection with weighted probability
      const rand = Math.random();
      let selectedType = itemTypes[0]; // ball
      if (rand < 0.40) {
        selectedType = itemTypes[0]; // 40% Dragon Ball
      } else if (rand < 0.65) {
        selectedType = itemTypes[1]; // 25% Meat
      } else if (rand < 0.85) {
        selectedType = itemTypes[2]; // 20% Meteor
      } else {
        selectedType = itemTypes[3]; // 15% Heavy Weight
      }

      const margin = 30;
      const x = margin + Math.random() * (canvas.width - margin * 2);
      const speed = selectedType.speedMin + Math.random() * (selectedType.speedMax - selectedType.speedMin);

      items.push({
        ...selectedType,
        x: x,
        y: -20,
        speed: speed,
        starNumber: selectedType.type === "ball" ? (ballsCollected % 7) + 1 : null
      });
    }
  }

  function updateGame() {
    if (!gameRunning) return;

    // Movement
    let currentSpeed = player.speed * (player.turbo || keys.boost ? 1.6 : 1.0);
    if (isSSJ) currentSpeed *= 1.25; // SSJ bonus speed

    if (keys.left) {
      player.x -= currentSpeed;
    }
    if (keys.right) {
      player.x += currentSpeed;
    }

    // Canvas boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Items update
    spawnItem();

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.y += item.speed;

      // Collision check with Goku
      const pCenterX = player.x + player.width / 2;
      const pCenterY = player.y + player.height / 2;
      const distX = Math.abs(item.x - pCenterX);
      const distY = Math.abs(item.y - pCenterY);

      if (distX < player.width / 2 + item.radius && distY < player.height / 2 + item.radius) {
        // Collision triggered
        if (item.type === "ball") {
          score += item.points + (isSSJ ? 50 : 0);
          ballsCollected += 1;
          playBeep("catch");

          if (ballsCollected >= 7) {
            score += 500; // Shenron Bonus
            playBeep("win");
            ballsCollected = 0;
          }
        } else if (item.type === "meat") {
          score += item.points;
          if (lives < 5) lives += 1;
          playBeep("meat");
        } else if (item.type === "rock" || item.type === "weight") {
          lives -= item.damage;
          playBeep("hit");
          if (lives <= 0) {
            endGame(false);
            return;
          }
        }

        updateUI();
        items.splice(i, 1);
        continue;
      }

      // Remove item if fallen past canvas
      if (item.y > canvas.height + 30) {
        items.splice(i, 1);
      }
    }
  }

  function drawGame() {
    if (!ctx) return;

    // Background Gradient (Sky / Space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isSSJ) {
      bgGrad.addColorStop(0, "#2a1500");
      bgGrad.addColorStop(1, "#120800");
    } else {
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(1, "#1e293b");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background clouds / stars
    ctx.fillStyle = isSSJ ? "rgba(254, 240, 138, 0.2)" : "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(100, 80, 45, 0, Math.PI * 2);
    ctx.arc(130, 80, 30, 0, Math.PI * 2);
    ctx.arc(550, 120, 55, 0, Math.PI * 2);
    ctx.arc(590, 120, 40, 0, Math.PI * 2);
    ctx.fill();

    // Draw Falling Items
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    items.forEach(item => {
      // Glow effect for Dragon Ball
      if (item.type === "ball") {
        ctx.save();
        ctx.shadowColor = "#ffcc00";
        ctx.shadowBlur = 15;
        ctx.fillText(item.symbol, item.x, item.y);
        ctx.restore();
      } else {
        ctx.fillText(item.symbol, item.x, item.y);
      }
    });

    // Draw Goku on Kinto-un Cloud
    ctx.save();
    ctx.translate(player.x, player.y);

    // Kinto-un Cloud
    const cloudColor = isSSJ ? "#fef08a" : "#ffea00";
    ctx.fillStyle = cloudColor;
    ctx.shadowColor = cloudColor;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(20, 35, 18, 0, Math.PI * 2);
    ctx.arc(40, 30, 22, 0, Math.PI * 2);
    ctx.arc(60, 35, 18, 0, Math.PI * 2);
    ctx.arc(40, 42, 16, 0, Math.PI * 2);
    ctx.fill();

    // Goku Figure
    // Head / Face
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fcd5b5";
    ctx.beginPath();
    ctx.arc(40, 18, 12, 0, Math.PI * 2);
    ctx.fill();

    // Goku Hair
    ctx.fillStyle = isSSJ ? "#fef08a" : "#1b1b1b";
    ctx.beginPath();
    ctx.arc(40, 10, 14, Math.PI, Math.PI * 2);
    ctx.lineTo(22, 16);
    ctx.lineTo(58, 16);
    ctx.fill();

    // Eyes
    ctx.fillStyle = isSSJ ? "#06b6d4" : "#000000";
    ctx.fillRect(36, 17, 3, 3);
    ctx.fillRect(43, 17, 3, 3);

    // Gi Suit (Orange Body)
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(30, 26, 20, 12);

    ctx.restore();
  }

  function gameLoop() {
    updateGame();
    drawGame();
    if (gameRunning) {
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function startGame() {
    initGame();
    gameRunning = true;
    if (overlay) overlay.style.display = "none";
    if (animFrameId) cancelAnimationFrame(animFrameId);
    playBeep("win");
    gameLoop();
  }

  function endGame(isWin = false) {
    gameRunning = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    if (overlay) {
      overlay.style.display = "flex";
      if (overlayTitle) {
        overlayTitle.textContent = isWin ? "🏆 SKVĚLÁ PRÁCE, VÁLEČNÍKU!" : "💥 KONEC HRY!";
      }
      if (overlayDesc) {
        overlayDesc.textContent = `Tvoje konečné skóre: ${score} bodů. Nejvyšší skóre: ${highscore}. Chceš to zkusit znovu?`;
      }
    }
  }

  // Controls Event Listeners
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      keys.left = true;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      keys.right = true;
    }
    if (e.key === "Shift" || e.key === " " || e.key === "ArrowUp") {
      keys.boost = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      keys.left = false;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      keys.right = false;
    }
    if (e.key === "Shift" || e.key === " " || e.key === "ArrowUp") {
      keys.boost = false;
    }
  });

  // Touch / On-Screen Buttons
  if (btnLeft) {
    btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); keys.left = true; });
    btnLeft.addEventListener("touchend", (e) => { e.preventDefault(); keys.left = false; });
    btnLeft.addEventListener("mousedown", () => { keys.left = true; });
    btnLeft.addEventListener("mouseup", () => { keys.left = false; });
  }

  if (btnRight) {
    btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); keys.right = true; });
    btnRight.addEventListener("touchend", (e) => { e.preventDefault(); keys.right = false; });
    btnRight.addEventListener("mousedown", () => { keys.right = true; });
    btnRight.addEventListener("mouseup", () => { keys.right = false; });
  }

  if (btnAction) {
    btnAction.addEventListener("touchstart", (e) => { e.preventDefault(); keys.boost = true; });
    btnAction.addEventListener("touchend", (e) => { e.preventDefault(); keys.boost = false; });
    btnAction.addEventListener("mousedown", () => { keys.boost = true; });
    btnAction.addEventListener("mouseup", () => { keys.boost = false; });
  }

  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }

  // Initial Draw on Canvas
  drawGame();

  // ------------------------------------------------------------------------
  // 3. Comment Submission Form
  // ------------------------------------------------------------------------
  const commentForm = document.getElementById("comment-form");
  const commentsList = document.getElementById("comments-list");

  if (commentForm && commentsList) {
    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const authorInput = document.getElementById("comment-author-input");
      const textInput = document.getElementById("comment-text-input");

      const author = authorInput ? authorInput.value.trim() : "Anonym";
      const text = textInput ? textInput.value.trim() : "";

      if (!author || !text) return;

      const commentItem = document.createElement("div");
      commentItem.className = "comment-item";
      commentItem.innerHTML = `
        <div class="comment-header">
          <strong class="author">${escapeHtml(author)}</strong>
          <span class="comment-date">Právě teď</span>
        </div>
        <p class="comment-body-text">${escapeHtml(text)}</p>
      `;

      commentsList.prepend(commentItem);

      if (textInput) textInput.value = "";
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
