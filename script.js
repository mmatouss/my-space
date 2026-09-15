// ==========================================================================
// ~* GOKU OFFICIAL PROFILE INTERACTIVE CONTROLS *~
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------------------------------------------------
  // 1. Super Saiyan Mode Toggle
  // ------------------------------------------------------------------------
  const ssjBtn = document.getElementById("ssj-toggle-btn");
  let isSSJ = false;

  if (ssjBtn) {
    ssjBtn.addEventListener("click", () => {
      isSSJ = !isSSJ;
      document.body.classList.toggle("ssj-mode", isSSJ);

      if (isSSJ) {
        ssjBtn.innerHTML = "🔥 ZPĚT DO BASE FORMY 🔥";
        ssjBtn.style.background = "linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)";
        ssjBtn.style.color = "#000";
      } else {
        ssjBtn.innerHTML = "⚡ PROMĚNIT V SUPER SAIYANA ⚡";
        ssjBtn.style.background = "";
        ssjBtn.style.color = "";
      }
    });
  }

  // ------------------------------------------------------------------------
  // 2. Real HTML5 Audio Music Player
  // ------------------------------------------------------------------------
  const playlist = [
    {
      title: "Hironobu Kageyama - CHA-LA HEAD-CHA-LA (DBZ Theme)",
      src: "audio/chala_head_chala.wav"
    },
    {
      title: "Super Saiyan Goku Theme (Power Up Beat)",
      src: "audio/super_saiyan_theme.wav"
    }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;

  const audioElement = document.getElementById("audio-element");
  const playBtn = document.getElementById("btn-play");
  const prevBtn = document.getElementById("btn-prev");
  const nextBtn = document.getElementById("btn-next");
  const trackSelect = document.getElementById("track-select");
  const nowPlayingText = document.getElementById("now-playing-text");
  const volSlider = document.getElementById("vol-slider");
  const visualizerBars = document.querySelectorAll(".visualizer .bar");

  function loadTrack(index) {
    currentTrackIndex = index;
    const track = playlist[currentTrackIndex];
    if (audioElement) {
      audioElement.src = track.src;
      audioElement.load();
    }
    if (nowPlayingText) {
      nowPlayingText.textContent = track.title;
    }
    if (trackSelect) {
      trackSelect.value = index.toString();
    }
  }

  function setVisualizerState(active) {
    visualizerBars.forEach(bar => {
      bar.style.animationPlayState = active ? "running" : "paused";
    });
  }

  function playAudio() {
    if (!audioElement) return;
    audioElement.play().then(() => {
      isPlaying = true;
      if (playBtn) playBtn.textContent = "⏸️ Pozastavit";
      setVisualizerState(true);
    }).catch(err => {
      console.log("Audio play blocked or unavailable:", err);
      isPlaying = false;
      if (playBtn) playBtn.textContent = "▶️ Přehrát";
      setVisualizerState(false);
    });
  }

  function pauseAudio() {
    if (!audioElement) return;
    audioElement.pause();
    isPlaying = false;
    if (playBtn) playBtn.textContent = "▶️ Přehrát";
    setVisualizerState(false);
  }

  function togglePlayState() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  if (playBtn) {
    playBtn.addEventListener("click", togglePlayState);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const newIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
      loadTrack(newIndex);
      playAudio();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const newIndex = (currentTrackIndex + 1) % playlist.length;
      loadTrack(newIndex);
      playAudio();
    });
  }

  if (trackSelect) {
    trackSelect.addEventListener("change", (e) => {
      const index = parseInt(e.target.value, 10);
      loadTrack(index);
      playAudio();
    });
  }

  if (volSlider && audioElement) {
    audioElement.volume = parseFloat(volSlider.value) / 100;
    volSlider.addEventListener("input", (e) => {
      audioElement.volume = parseFloat(e.target.value) / 100;
    });
  }

  if (audioElement) {
    audioElement.addEventListener("ended", () => {
      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      loadTrack(nextIndex);
      playAudio();
    });
  }

  // Initial load
  loadTrack(0);

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

      const author = authorInput ? authorInput.value.trim() : "Anonymní";
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

      authorInput.value = "";
      textInput.value = "";
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
