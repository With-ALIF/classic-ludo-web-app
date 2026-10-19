const STORAGE_KEY = "ludoverse.sound.v1";

let ctx = null;
let muted = false;

const CHANNELS = {
  dice: true,
  movement: true,
  capture: true,
  victory: true,
};

function ensureCtx() {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = !!value;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
    }
  } catch {}
}

export function setChannels(next) {
  Object.keys(CHANNELS).forEach((key) => {
    if (typeof next?.[key] === "boolean") CHANNELS[key] = next[key];
  });
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

export function loadMutedPref() {
  if (typeof window === "undefined") return false;
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    muted = false;
  }
  return muted;
}

export function unlockAudio() {
  ensureCtx();
}

function tone({ freq = 440, endFreq = null, dur = 0.15, type = "sine", gain = 0.18, delay = 0 }) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  try {
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch {}
}

function noise({ dur = 0.25, gain = 0.1, delay = 0, filterFreq = 1000 }) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  try {
    const t0 = ac.currentTime + delay;
    const frames = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, frames, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start(t0);
    src.stop(t0 + dur);
  } catch {}
}

export const sfx = {
  roll() {
    if (!CHANNELS.dice) return;
    noise({ dur: 0.32, gain: 0.09, filterFreq: 900 });
    [0.02, 0.1, 0.18, 0.26].forEach((d, i) =>
      tone({ freq: 210 + i * 55, dur: 0.045, type: "square", gain: 0.05, delay: d })
    );
  },
  select() {
    if (!CHANNELS.movement) return;
    tone({ freq: 640, dur: 0.07, type: "sine", gain: 0.12 });
  },
  step() {
    if (!CHANNELS.movement) return;
    tone({ freq: 420, dur: 0.035, type: "triangle", gain: 0.04 });
  },
  land() {
    if (!CHANNELS.movement) return;
    tone({ freq: 300, dur: 0.08, type: "triangle", gain: 0.1 });
  },
  exitBase() {
    if (!CHANNELS.movement) return;
    tone({ freq: 520, dur: 0.09, type: "sine", gain: 0.11 });
    tone({ freq: 784, dur: 0.12, type: "sine", gain: 0.11, delay: 0.08 });
  },
  capture() {
    if (!CHANNELS.capture) return;
    tone({ freq: 390, endFreq: 90, dur: 0.28, type: "sawtooth", gain: 0.14 });
    noise({ dur: 0.18, gain: 0.1, filterFreq: 550 });
    tone({ freq: 880, dur: 0.09, type: "square", gain: 0.09, delay: 0.2 });
  },
  home() {
    if (!CHANNELS.movement) return;
    tone({ freq: 784, dur: 0.12, type: "sine", gain: 0.14 });
    tone({ freq: 1046, dur: 0.18, type: "sine", gain: 0.14, delay: 0.1 });
  },
  pass() {
    if (!CHANNELS.dice) return;
    tone({ freq: 260, dur: 0.12, type: "sine", gain: 0.09 });
  },
  fail() {
    if (!CHANNELS.dice) return;
    tone({ freq: 210, endFreq: 110, dur: 0.35, type: "sawtooth", gain: 0.12 });
  },
  win() {
    if (!CHANNELS.victory) return;
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, dur: 0.2, type: "triangle", gain: 0.15, delay: i * 0.12 })
    );
    noise({ dur: 0.45, gain: 0.05, filterFreq: 2800, delay: 0.48 });
  },
};
