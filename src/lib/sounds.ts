// Sound effects using Web Audio API - no audio files needed

let audioCtx: AudioContext | null = null;
let muted = false;
let scratchOsc: OscillatorNode | null = null;
let scratchGain: GainNode | null = null;
let isScratchPlaying = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Call this on first user interaction to unlock audio
export function initAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {}
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

// Scratch/rubbing sound - like coin on scratch card
export function startScratchSound() {
  if (muted || isScratchPlaying) return;
  try {
    const ctx = getCtx();
    isScratchPlaying = true;

    // White noise for scratch texture
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to make it sound like scratching
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    scratchOsc = noise as unknown as OscillatorNode;
    scratchGain = gain;
  } catch {}
}

export function stopScratchSound() {
  if (!isScratchPlaying) return;
  isScratchPlaying = false;
  try {
    if (scratchGain) {
      scratchGain.gain.linearRampToValueAtTime(0, getCtx().currentTime + 0.1);
    }
    setTimeout(() => {
      try { scratchOsc?.stop(); } catch {}
      scratchOsc = null;
      scratchGain = null;
    }, 150);
  } catch {}
}

// Dishwashing squeak sound
export function playSqueakSound() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 800 + Math.random() * 400;
    gain.gain.value = 0.04;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

// Bubble pop sound
export function playBubbleSound() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 600 + Math.random() * 300;
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.05);
    gain.gain.value = 0.03;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

// Win sound
export function playWinSound() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.1;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15 * (i + 1) + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.15 * i);
      osc.stop(ctx.currentTime + 0.15 * (i + 1) + 0.2);
    });
  } catch {}
}

// Jackpot sound
export function playJackpotSound() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12 * (i + 1) + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.12 * i);
      osc.stop(ctx.currentTime + 0.12 * (i + 1) + 0.3);
    });
  } catch {}
}

// Lose/trap sound
export function playLoseSound() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 200;
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);
    gain.gain.value = 0.06;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

// Coin clink sound
export function playCoinSound() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 2000 + Math.random() * 1000;
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

// Trash can sound
export function playTrashSound() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 300;
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
    gain.gain.value = 0.08;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}
