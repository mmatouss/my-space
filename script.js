// ==========================================================================
// ~* GOKU MYSPACE PROFILE 2007 INTERACTIVE CONTROLS *~
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------------------------------------------------
  // 1. Super Saiyan Mode Toggle (Power Up!)
  // ------------------------------------------------------------------------
  const ssjBtn = document.getElementById("ssj-toggle-btn");
  let isSSJ = false;

  if (ssjBtn) {
    ssjBtn.addEventListener("click", () => {
      isSSJ = !isSSJ;
      document.body.classList.toggle("ssj-mode", isSSJ);

      if (isSSJ) {
        ssjBtn.innerHTML = "🔥 SUPER SAIYAN POWEROVANÝ! (ZPĚT DO BASE FORMY) 🔥";
        ssjBtn.style.background = "linear-gradient(180deg, #ffffff 0%, #ffee00 100%)";
        ssjBtn.style.color = "#cc0000";
        alert("AAAAAAAAAAHHH! OVER 9000!! Goku se proměnil v Super Saiyana! ⚡💥");
      } else {
        ssjBtn.innerHTML = "⚡ PROMĚNIT V SUPER SAIYANA (POWER UP!) ⚡";
        ssjBtn.style.background = "linear-gradient(180deg, #ffcc00 0%, #ff6600 100%)";
        ssjBtn.style.color = "#000000";
      }
    });
  }

  // ------------------------------------------------------------------------
  // 2. MySpace Music Player Simulation
  // ------------------------------------------------------------------------
  const tracks = [
    "Hironobu Kageyama - CHA-LA HEAD-CHA-LA (Official DBZ Theme 2007)",
    "Faulconer Productions - Rock The Dragon (Synth Metal Remix)",
    "Bruce Faulconer - Super Saiyan Goku Theme (Ultimate Power Up)",
    "DBZ Orchestra - Spirit Bomb Symphony (Genki Dama Theme)"
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;

  const playBtn = document.getElementById("btn-play");
  const prevBtn = document.getElementById("btn-prev");
  const nextBtn = document.getElementById("btn-next");
  const trackSelect = document.getElementById("track-select");
  const nowPlayingText = document.getElementById("now-playing-text");
  const visualizer = document.querySelector(".visualizer");

  function updateTrackDisplay() {
    if (nowPlayingText) {
      nowPlayingText.textContent = (isPlaying ? "HRAJE: " : "POZASTAVENO: ") + tracks[currentTrackIndex];
    }
    if (trackSelect) {
      trackSelect.value = currentTrackIndex.toString();
    }
  }

  function togglePlayState() {
    isPlaying = !isPlaying;
    if (playBtn) {
      playBtn.textContent = isPlaying ? "⏸️ Pozastavit" : "▶️ Přehrát";
    }
    if (visualizer) {
      const bars = visualizer.querySelectorAll(".bar");
      bars.forEach(bar => {
        bar.style.animationPlayState = isPlaying ? "running" : "paused";
      });
    }
    updateTrackDisplay();
  }

  if (playBtn) playBtn.addEventListener("click", togglePlayState);

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      isPlaying = true;
      if (playBtn) playBtn.textContent = "⏸️ Pozastavit";
      updateTrackDisplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
      isPlaying = true;
      if (playBtn) playBtn.textContent = "⏸️ Pozastavit";
      updateTrackDisplay();
    });
  }

  if (trackSelect) {
    trackSelect.addEventListener("change", (e) => {
      currentTrackIndex = parseInt(e.target.value, 10);
      isPlaying = true;
      if (playBtn) playBtn.textContent = "⏸️ Pozastavit";
      updateTrackDisplay();
    });
  }

  // Start with visualizer running
  isPlaying = true;

  // ------------------------------------------------------------------------
  // 3. Dynamic Comment Submission
  // ------------------------------------------------------------------------
  const commentForm = document.getElementById("comment-form");
  const commentsList = document.getElementById("comments-list");

  if (commentForm && commentsList) {
    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const authorInput = document.getElementById("comment-author-input");
      const avatarSelect = document.getElementById("comment-avatar-select");
      const textInput = document.getElementById("comment-text-input");

      const author = authorInput ? authorInput.value.trim() : "Anonymní Bojovník";
      const avatarTag = avatarSelect ? avatarSelect.value : "🧡 Goku Fan";
      const text = textInput ? textInput.value.trim() : "";

      if (!author || !text) return;

      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} o ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Create comment element
      const commentCard = document.createElement("div");
      commentCard.className = "comment-card";
      commentCard.innerHTML = `
        <div class="comment-author">
          <a href="#" class="author-name">${escapeHtml(author)}</a>
          <div class="author-avatar-small">
            <div class="mini-avatar" style="background: #ff6600; display:flex; align-items:center; justify-content:center; font-size:18px;">
              ${getAvatarEmoji(avatarTag)}
            </div>
          </div>
          <span class="comment-date">${dateStr}</span>
        </div>
        <div class="comment-body">
          <p class="comment-text">
            <span class="retro-glitter">✨ [Vzkaz pro Gokua] ✨</span><br>
            ${escapeHtml(text)}
          </p>
        </div>
      `;

      // Insert at top of comments
      commentsList.prepend(commentCard);

      // Reset form
      authorInput.value = "";
      textInput.value = "";

      alert("Tvůj vzkaz byl úspěšně přidán na Gokuův MySpace profil! 🐉✨");
    });
  }

  function getAvatarEmoji(tag) {
    if (tag.includes("Shenron")) return "🐉";
    if (tag.includes("Roshi")) return "🐢";
    if (tag.includes("Saiyan")) return "💥";
    return "🧡";
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
