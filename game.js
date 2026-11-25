(() => {
  "use strict";

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const TOTAL_ROUNDS = 5;
  const TILE_COLORS = ["var(--t1)", "var(--t2)", "var(--t3)", "var(--t4)", "var(--t5)", "var(--t6)"];

  // ---------- Hippo art (inline SVG, no image files) ----------
  const HIPPO_SVG = `
<svg viewBox="0 0 200 190" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect x="52" y="150" width="30" height="36" rx="13" fill="var(--hippo-dark)"/>
    <rect x="118" y="150" width="30" height="36" rx="13" fill="var(--hippo-dark)"/>
    <ellipse cx="100" cy="138" rx="72" ry="44" fill="var(--hippo)"/>
    <ellipse cx="100" cy="150" rx="42" ry="26" fill="var(--hippo-light)"/>
    <ellipse cx="38" cy="134" rx="13" ry="22" fill="var(--hippo-dark)" transform="rotate(20 38 134)"/>
    <g class="arm-wave">
      <ellipse cx="162" cy="134" rx="13" ry="22" fill="var(--hippo-dark)" transform="rotate(-20 162 134)"/>
    </g>
  </g>
  <g>
    <ellipse cx="58" cy="28" rx="13" ry="15" fill="var(--hippo-dark)"/>
    <ellipse cx="58" cy="30" rx="6" ry="8" fill="#f7a8c4"/>
    <ellipse cx="142" cy="28" rx="13" ry="15" fill="var(--hippo-dark)"/>
    <ellipse cx="142" cy="30" rx="6" ry="8" fill="#f7a8c4"/>
    <ellipse cx="100" cy="62" rx="52" ry="42" fill="var(--hippo)"/>
    <ellipse cx="100" cy="94" rx="62" ry="34" fill="var(--hippo-light)"/>
    <g class="blink">
      <circle cx="78" cy="50" r="12" fill="#fff"/>
      <circle cx="80" cy="52" r="6.5" fill="#2d2340"/>
      <circle cx="82.5" cy="49" r="2.2" fill="#fff"/>
      <circle cx="122" cy="50" r="12" fill="#fff"/>
      <circle cx="120" cy="52" r="6.5" fill="#2d2340"/>
      <circle cx="122.5" cy="49" r="2.2" fill="#fff"/>
    </g>
    <ellipse cx="82" cy="82" rx="6" ry="8" fill="var(--hippo-dark)"/>
    <ellipse cx="118" cy="82" rx="6" ry="8" fill="var(--hippo-dark)"/>
    <circle cx="50" cy="98" r="9" fill="#ff9ec4" opacity=".75"/>
    <circle cx="150" cy="98" r="9" fill="#ff9ec4" opacity=".75"/>
    <path class="mouth-closed" d="M74 106 Q100 124 126 106" stroke="#5b3f8a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g class="mouth-open">
      <path d="M70 102 Q100 146 130 102 Z" fill="#7a2f5a"/>
      <ellipse cx="100" cy="120" rx="13" ry="6" fill="#ff7aa8"/>
      <rect x="80" y="102" width="9" height="10" rx="2" fill="#fff"/>
      <rect x="111" y="102" width="9" height="10" rx="2" fill="#fff"/>
    </g>
  </g>
</svg>`;

  const PEEKER_SVG = `
<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="28" cy="14" rx="8" ry="9" fill="var(--hippo-dark)"/>
  <ellipse cx="28" cy="15" rx="4" ry="5" fill="#f7a8c4"/>
  <ellipse cx="72" cy="14" rx="8" ry="9" fill="var(--hippo-dark)"/>
  <ellipse cx="72" cy="15" rx="4" ry="5" fill="#f7a8c4"/>
  <ellipse cx="50" cy="48" rx="38" ry="34" fill="var(--hippo)"/>
  <circle cx="38" cy="32" r="8" fill="#fff"/>
  <circle cx="39" cy="33" r="4.5" fill="#2d2340"/>
  <circle cx="62" cy="32" r="8" fill="#fff"/>
  <circle cx="61" cy="33" r="4.5" fill="#2d2340"/>
  <ellipse cx="40" cy="52" rx="4" ry="5" fill="var(--hippo-dark)"/>
  <ellipse cx="60" cy="52" rx="4" ry="5" fill="var(--hippo-dark)"/>
</svg>`;

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const parentScreen = $("#parent");
  const childScreen = $("#child");
  const grid = $("#grid");
  const keypad = $("#keypad");
  const parentMsg = $("#parentMsg");
  const hippoParent = $("#hippoParent");
  const hippoChild = $("#hippoChild");
  const puff = $(".puff");
  const sayBtn = $("#sayBtn");
  const finishScreen = $("#finish");
  const hippoFinish = $("#hippoFinish");
  const startOverlay = $("#startOverlay");

  hippoParent.insertAdjacentHTML("afterbegin", HIPPO_SVG);
  hippoChild.innerHTML = HIPPO_SVG;
  hippoFinish.innerHTML = HIPPO_SVG;
  document.querySelectorAll(".peeker").forEach((el) => (el.innerHTML = PEEKER_SVG));

  // ---------- State ----------
  let mode = 4;
  try {
    const saved = Number(localStorage.getItem("alphalearn-mode"));
    if (saved === 4 || saved === 6) mode = saved;
  } catch (_) { /* storage unavailable */ }

  let stars = 0; // rounds completed in this game
  let target = null;
  let locked = false;
  let homeTimer = null;

  // ---------- Helpers ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Only letters from A up to the target are used. When there are not
  // enough of them (A, B, C in Easy; A–E in Hard), some letters repeat.
  function buildChoices(letter, count) {
    const idx = ALPHABET.indexOf(letter);
    const pool = ALPHABET.slice(0, idx); // letters before the target
    const choices = shuffle(pool).slice(0, count - 1);
    while (choices.length < count - 1) {
      choices.push(pool.length ? pool[Math.floor(Math.random() * pool.length)] : letter);
    }
    choices.push(letter);
    return shuffle(choices);
  }

  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // reflow so the animation plays again
    el.classList.add(cls);
  }

  // ---------- Audio (Web Audio API, synthesized) ----------
  let ctx = null;
  let speechPrimed = false;
  function audio() {
    // Phones only allow speech that starts from a tap. Speaking a silent
    // utterance on the first tap unlocks it for later (e.g. after a clip ends).
    if (!speechPrimed && "speechSynthesis" in window) {
      speechPrimed = true;
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    startMusic();
    return ctx;
  }

  function brassNote(ac, dest, freq, start, len, vol) {
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(vol, start + 0.03);
    env.gain.setValueAtTime(vol, start + Math.max(0.05, len - 0.35));
    env.gain.exponentialRampToValueAtTime(0.0001, start + len);

    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(700, start);
    lp.frequency.exponentialRampToValueAtTime(3200, start + 0.06);
    lp.frequency.exponentialRampToValueAtTime(1600, start + len);

    lp.connect(env).connect(dest);

    [["sawtooth", -7], ["square", 7], ["sawtooth", 0]].forEach(([type, detune]) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = ac.createGain();
      g.gain.value = type === "square" ? 0.4 : 0.6;
      o.connect(g).connect(lp);
      o.start(start);
      o.stop(start + len + 0.05);
    });
  }

  function playTada() {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + 0.02;
    const master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(ac.destination);
    // "ta" pickup...
    brassNote(ac, master, 392.0, t, 0.16, 0.22); // G4
    // ..."DAAA!" big major chord
    const chordAt = t + 0.2;
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => brassNote(ac, master, f, chordAt, 1.5, 0.14));
    brassNote(ac, master, 261.63, chordAt, 1.5, 0.12); // C4 underneath
  }

  function playFart() {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + 0.01;
    const dur = 0.55 + Math.random() * 0.4;
    const base = 65 + Math.random() * 45;

    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.7, t + 0.025);
    out.gain.setValueAtTime(0.7, t + dur * 0.55);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 650;
    lp.Q.value = 5;
    lp.connect(out).connect(ac.destination);

    // Amplitude flutter = the "flappy" part
    const flutter = ac.createGain();
    flutter.gain.value = 0.55;
    const flutterOsc = ac.createOscillator();
    flutterOsc.type = "square";
    flutterOsc.frequency.setValueAtTime(26 + Math.random() * 14, t);
    flutterOsc.frequency.linearRampToValueAtTime(14 + Math.random() * 6, t + dur);
    const flutterDepth = ac.createGain();
    flutterDepth.gain.value = 0.45;
    flutterOsc.connect(flutterDepth).connect(flutter.gain);
    flutter.connect(lp);

    // Low buzzy tone with wobbly pitch
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(base * 1.2, t);
    osc.frequency.exponentialRampToValueAtTime(base, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(base * 0.62, t + dur);
    const wobble = ac.createOscillator();
    wobble.frequency.setValueAtTime(9 + Math.random() * 8, t);
    const wobbleDepth = ac.createGain();
    wobbleDepth.gain.value = base * 0.3;
    wobble.connect(wobbleDepth).connect(osc.frequency);
    osc.connect(flutter);

    // Breathy noise
    const len = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = base * 2.4;
    bp.Q.value = 1.2;
    const noiseGain = ac.createGain();
    noiseGain.gain.value = 0.6;
    noise.connect(bp).connect(noiseGain).connect(flutter);

    [osc, wobble, flutterOsc, noise].forEach((n) => {
      n.start(t);
      n.stop(t + dur + 0.05);
    });
  }

  // ---------- Custom audio clips (sounds/sounds.js) ----------
  const SOUNDS = Object.assign(
    { correct: [], wrong: [], finish: [], letterPrompts: false, music: null, musicVolume: 0.2 },
    window.ALPHALEARN_SOUNDS || {}
  );
  const soundUrl = (file) => "sounds/" + String(file).replace(/^\/+/, "");

  // ---------- Background theme song ----------
  const MUSIC_VOL = Math.max(0, Math.min(1, Number(SOUNDS.musicVolume) || 0.2));
  let musicOn = true;
  try { musicOn = localStorage.getItem("alphalearn-music") !== "off"; } catch (_) { /* ignore */ }
  const music = SOUNDS.music ? new Audio(soundUrl(SOUNDS.music)) : null;
  if (music) {
    music.loop = true;
    music.preload = "auto";
    music.volume = MUSIC_VOL;
  }
  function startMusic() {
    if (music && musicOn && music.paused && !document.hidden) music.play().catch(() => {});
  }
  function duckMusic(on) {
    // Quieter while someone is talking so the letter is easy to hear
    if (music) music.volume = on ? MUSIC_VOL * 0.3 : MUSIC_VOL;
  }
  document.addEventListener("visibilitychange", () => {
    if (!music) return;
    if (document.hidden) music.pause();
    else startMusic();
  });

  let currentClip = null;
  const brokenClips = new Set();

  function stopClip() {
    if (currentClip) {
      currentClip.pause();
      currentClip = null;
    }
  }

  // Plays a clip; resolves true once it is playing, false if it can't play.
  function playClip(url, hooks = {}) {
    stopClip();
    return new Promise((resolve) => {
      if (!url || brokenClips.has(url)) return resolve(false);
      const a = new Audio(url);
      currentClip = a;
      let settled = false;
      const settle = (ok) => { if (!settled) { settled = true; resolve(ok); } };
      const finish = () => {
        if (currentClip === a) currentClip = null;
        if (hooks.onEnded) hooks.onEnded();
      };
      a.addEventListener("playing", () => {
        if (hooks.onPlaying) hooks.onPlaying(a);
        settle(true);
      }, { once: true });
      a.addEventListener("ended", () => {
        finish();
        if (hooks.onComplete) hooks.onComplete(); // played all the way through
      }, { once: true });
      a.addEventListener("pause", () => { if (currentClip !== a) finish(); }, { once: true });
      a.addEventListener("error", () => {
        brokenClips.add(url);
        finish();
        settle(false);
      }, { once: true });
      const p = a.play();
      if (p && p.catch) p.catch(() => { finish(); settle(false); });
    });
  }

  const lastPicked = {};
  function pickRandom(kind) {
    const list = (SOUNDS[kind] || []).filter((f) => !brokenClips.has(soundUrl(f)));
    if (!list.length) return null;
    let choice = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1) {
      while (choice === lastPicked[kind]) choice = list[Math.floor(Math.random() * list.length)];
    }
    lastPicked[kind] = choice;
    return soundUrl(choice);
  }

  function playKind(kind, fallback) {
    const url = pickRandom(kind);
    if (!url) { fallback(); return; }
    playClip(url).then((ok) => { if (!ok) fallback(); });
  }

  const playCorrect = () => playKind("correct", playTada);
  const playWrong = () => playKind("wrong", playFart);
  const playFinish = () => playKind("finish", () => {
    playTada();
    setTimeout(playTada, 1800);
  });

  // ---------- Lip sync for recordings ----------
  // Each recording is decoded once and turned into a loudness track
  // (ENV_RATE values per second, 0 = silent, 1 = loudest). While the clip
  // plays, the hippo's mouth follows that track, so it stays shut in pauses.
  // Needs http(s) (fetch); on file:// the normal talking animation is used.
  const ENV_RATE = 60;
  const OPEN_AT = 0.15; // loudness needed to open the mouth
  const envelopes = {};

  function buildEnvelope(audioBuf) {
    const ch = audioBuf.getChannelData(0);
    const win = Math.max(1, Math.floor(audioBuf.sampleRate / ENV_RATE));
    const n = Math.ceil(ch.length / win);
    const rms = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const start = i * win;
      const end = Math.min(ch.length, start + win);
      let sum = 0;
      for (let j = start; j < end; j++) sum += ch[j] * ch[j];
      rms[i] = Math.sqrt(sum / Math.max(1, end - start));
    }
    const sorted = Array.from(rms).sort((x, y) => x - y);
    const peak = sorted[Math.floor((n - 1) * 0.98)] || 1;
    const floor = Math.max(sorted[Math.floor((n - 1) * 0.05)] * 1.5, peak * 0.08);
    const levels = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      levels[i] = Math.max(0, Math.min(1, (rms[i] - floor) / Math.max(1e-6, peak - floor)));
    }
    return levels;
  }

  function loadEnvelope(url) {
    if (!url || url in envelopes || !window.fetch) return;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return;
    envelopes[url] = null; // loading
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((buf) => new OAC(1, 2, 44100).decodeAudioData(buf))
      .then((audioBuf) => { envelopes[url] = buildEnvelope(audioBuf); })
      .catch(() => { /* fall back to the generic talking animation */ });
  }

  let lipRaf = null;
  let lipState = null;
  function startLipSync(hippo, el, env) {
    stopLipSync();
    const open = hippo.querySelector(".mouth-open");
    const closed = hippo.querySelector(".mouth-closed");
    hippo.classList.add("lipsync");
    lipState = { hippo, open, closed };
    let shown = 0;
    const tick = () => {
      const level = env[Math.floor(el.currentTime * ENV_RATE)] || 0;
      shown = level > shown ? level : shown * 0.8; // open fast, close smoothly
      const isOpen = shown > OPEN_AT;
      open.style.opacity = isOpen ? "1" : "0";
      closed.style.opacity = isOpen ? "0" : "1";
      open.style.transform = `scaleY(${(0.35 + 0.65 * Math.min(1, shown)).toFixed(2)})`;
      if (!el.paused && !el.ended) lipRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopLipSync() {
    cancelAnimationFrame(lipRaf);
    lipRaf = null;
    if (!lipState) return;
    lipState.hippo.classList.remove("lipsync");
    [lipState.open, lipState.closed].forEach((m) => {
      m.style.opacity = "";
      m.style.transform = "";
    });
    lipState = null;
  }

  loadEnvelope(SOUNDS.help && soundUrl(SOUNDS.help));
  loadEnvelope(SOUNDS.prompt && soundUrl(SOUNDS.prompt));

  // Recorded letter prompts: sounds/letters/G.mp3 (or .wav/.m4a). Checked once at
  // startup so the game knows instantly whether to use a recording or the voice.
  const letterClips = {};
  if (SOUNDS.letterPrompts) {
    ALPHABET.forEach((letter) => {
      const tryExt = (exts) => {
        if (!exts.length) return;
        const url = soundUrl(`letters/${letter}.${exts[0]}`);
        const probe = new Audio();
        probe.preload = "metadata";
        probe.addEventListener("loadedmetadata", () => {
          letterClips[letter] = url;
          loadEnvelope(url);
        }, { once: true });
        probe.addEventListener("error", () => tryExt(exts.slice(1)), { once: true });
        probe.src = url;
      };
      tryExt(["mp3", "wav", "m4a"]);
    });
  }

  // ---------- Speech ----------
  let speechFallback = null;
  function setTalking(on, hippo = hippoChild, clipEl = null) {
    duckMusic(on);
    hippo.classList.toggle("talking", on);
    if (hippo === hippoChild) sayBtn.classList.toggle("speaking", on);
    if (on && clipEl) {
      const env = envelopes[clipEl.getAttribute("src")];
      if (env) startLipSync(hippo, clipEl, env);
    }
    if (!on) stopLipSync();
  }

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|aria|jenny|zira|google us/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  }

  function sayPrompt() {
    if (!target) return;
    clearTimeout(speechFallback);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const forLetter = target;
    const clip = letterClips[target];
    if (clip) {
      playClip(clip, {
        onPlaying: (el) => setTalking(true, hippoChild, el),
        onEnded: () => setTalking(false),
      }).then((ok) => {
        if (!ok && target === forLetter) speakPrompt();
      });
      return;
    }
    if (SOUNDS.prompt) {
      // Recorded "Find the letter..." then the computer voice says the letter.
      playClip(soundUrl(SOUNDS.prompt), {
        onPlaying: (el) => setTalking(true, hippoChild, el),
        onEnded: () => setTalking(false),
        onComplete: () => {
          if (target === forLetter && !locked) speakPrompt(`${forLetter}!`);
        },
      }).then((ok) => {
        if (!ok && target === forLetter) speakPrompt();
      });
      return;
    }
    stopClip();
    speakPrompt();
  }

  function speakPrompt(text = `Find the letter, ${target}!`) {
    clearTimeout(speechFallback);
    if (!("speechSynthesis" in window)) {
      setTalking(true);
      speechFallback = setTimeout(() => setTalking(false), 1500);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-US";
    u.rate = 0.85;
    u.pitch = 1.25;
    u.onstart = () => setTalking(true);
    u.onend = u.onerror = () => {
      clearTimeout(speechFallback);
      setTalking(false);
    };
    setTalking(true);
    speechFallback = setTimeout(() => setTalking(false), 3500);
    synth.speak(u);
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices(); // warm up voice list
  }

  // ---------- Screens ----------
  function showScreen(which) {
    parentScreen.classList.toggle("active", which === "parent");
    childScreen.classList.toggle("active", which === "child");
    finishScreen.classList.toggle("active", which === "finish");
    hippoFinish.classList.toggle("dancing", which === "finish");
  }

  function renderStars(popNewest) {
    document.querySelectorAll("[data-stars]").forEach((bar) => {
      bar.innerHTML = "";
      for (let i = 0; i < TOTAL_ROUNDS; i++) {
        const s = document.createElement("span");
        s.className = "star" + (i < stars ? " on" : "") + (popNewest && i === stars - 1 ? " new" : "");
        s.textContent = "★";
        bar.appendChild(s);
      }
      bar.setAttribute("aria-label", `${stars} of ${TOTAL_ROUNDS} stars`);
    });
  }

  // One letter, found TOTAL_ROUNDS times in a row
  function startGame(letter) {
    stars = 0;
    renderStars(false);
    startRound(letter);
  }

  function showFinish() {
    clearTimeout(homeTimer);
    target = null;
    locked = false;
    hippoChild.classList.remove("happy", "toot");
    renderStars(false);
    showScreen("finish");
    playFinish();
  }

  function goHome() {
    clearTimeout(homeTimer);
    clearTimeout(speechFallback);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopClip();
    setTalking(false);
    hippoChild.classList.remove("happy", "toot");
    target = null;
    locked = false;
    resetParent();
    showScreen("parent");
  }

  function startRound(letter) {
    audio(); // unlock audio on this user gesture
    target = letter;
    locked = false;
    hippoChild.classList.remove("happy", "toot");

    const choices = buildChoices(letter, mode);
    const colorOffset = Math.floor(Math.random() * TILE_COLORS.length);
    grid.classList.toggle("hard", mode === 6);
    grid.innerHTML = "";
    choices.forEach((ch, i) => {
      const b = document.createElement("button");
      b.className = "tile";
      b.textContent = ch;
      b.dataset.letter = ch;
      b.setAttribute("aria-label", `Letter ${ch}`);
      b.style.setProperty("--c", TILE_COLORS[(i + colorOffset) % TILE_COLORS.length]);
      grid.appendChild(b);
    });

    showScreen("child");
    sayPrompt();
  }

  function onTile(tile) {
    if (locked || tile.disabled) return;
    audio();
    if (tile.dataset.letter === target) {
      locked = true;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopClip();
      setTalking(false);
      stars = Math.min(TOTAL_ROUNDS, stars + 1);
      renderStars(true);
      grid.querySelectorAll(".tile").forEach((t) => t !== tile && t.classList.add("fade"));
      tile.classList.add("correct");
      hippoChild.classList.remove("toot");
      restart(hippoChild, "happy");
      playCorrect();
      const letter = target;
      homeTimer = stars >= TOTAL_ROUNDS
        ? setTimeout(showFinish, 2200)
        : setTimeout(() => startRound(letter), 2400); // same letter, reshuffled
    } else {
      tile.classList.add("wrong");
      tile.disabled = true;
      playWrong();
      restart(hippoChild, "toot");
      restart(puff, "go");
    }
  }

  // ---------- Parent controls ----------
  function setMode(m) {
    mode = m;
    document.querySelectorAll(".mode").forEach((b) => {
      b.setAttribute("aria-pressed", String(Number(b.dataset.mode) === m));
    });
    try { localStorage.setItem("alphalearn-mode", String(m)); } catch (_) { /* ignore */ }
  }
  // Step 1: pick Easy/Hard -> step 2: keypad appears, pick a letter -> game starts
  let modeChosen = false;
  function resetParent() {
    modeChosen = false;
    keypad.hidden = true;
    parentMsg.textContent = "Grown-ups: pick a level!";
    document.querySelectorAll(".mode").forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  resetParent();
  renderStars(false);

  document.querySelectorAll(".mode").forEach((b) =>
    b.addEventListener("click", () => {
      audio();
      setMode(Number(b.dataset.mode));
      modeChosen = true;
      keypad.hidden = false;
      parentMsg.textContent = "Now type or tap a secret letter!";
    })
  );

  const musicBtn = $("#musicBtn");
  const showMusicState = () => { musicBtn.textContent = musicOn ? "🎵 Music: on" : "🎵 Music: off"; };
  if (music) {
    musicBtn.hidden = false;
    showMusicState();
    musicBtn.addEventListener("click", () => {
      musicOn = !musicOn;
      try { localStorage.setItem("alphalearn-music", musicOn ? "on" : "off"); } catch (_) { /* ignore */ }
      showMusicState();
      if (musicOn) audio(); else music.pause();
    });
  }
  // Help recording: tap the hippo on the grown-up screen
  if (SOUNDS.help) {
    hippoParent.querySelector(".tap-me").hidden = false;
    hippoParent.addEventListener("click", () => {
      audio();
      playClip(soundUrl(SOUNDS.help), {
        onPlaying: (el) => setTalking(true, hippoParent, el),
        onEnded: () => setTalking(false, hippoParent),
      });
    });
  } else {
    hippoParent.disabled = true;
  }

  $("#playAgain").addEventListener("click", () => {
    audio();
    goHome();
  });

  // Music should start right away. Browsers block sound until the first
  // tap/keypress, so if autoplay is refused show a big "Tap to start" button.
  function hideStartOverlay() { startOverlay.hidden = true; }
  ["pointerdown", "keydown", "touchend"].forEach((evt) =>
    document.addEventListener(evt, () => { audio(); hideStartOverlay(); }, { capture: true, once: true })
  );
  startOverlay.addEventListener("click", () => { audio(); hideStartOverlay(); });
  if (music && musicOn) {
    music.play().then(hideStartOverlay).catch(() => {
      if (music.paused) startOverlay.hidden = false;
    });
  }

  ALPHABET.forEach((letter) => {
    const b = document.createElement("button");
    b.textContent = letter;
    b.addEventListener("click", () => startGame(letter));
    keypad.appendChild(b);
  });

  grid.addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (tile) onTile(tile);
  });

  sayBtn.addEventListener("click", () => {
    audio();
    if (!locked) sayPrompt();
  });

  $("#homeBtn").addEventListener("click", goHome);

  document.addEventListener("keydown", (e) => {
    if (!parentScreen.classList.contains("active")) {
      // Toddler key-mashing does nothing during play
      e.preventDefault();
      return;
    }
    if (!modeChosen || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (/^[a-z]$/i.test(e.key)) {
      e.preventDefault();
      startGame(e.key.toUpperCase());
    }
  });

  // Exposed for quick testing in the console
  window.AlphaLearn = { buildChoices, playClip, letterClips, envelopes, sounds: SOUNDS };
})();
