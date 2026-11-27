// Synthesised sound effects and a light music loop, built with the Web Audio
// API only — no audio files, no network. Everything starts on the first user
// gesture (browsers require it) and M toggles mute.
export function createAudio() {
  let context = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') void context.resume();
      return context;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, duration, type, volume, slideTo) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function noise(duration, volume, lowpass) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // The turkey's own voice: two quick descending gobbles.
  function gobble() {
    tone(520, 0.09, 'square', 0.12, 300);
    setTimeout(() => tone(470, 0.12, 'square', 0.12, 260), 90);
  }

  const jump = () => tone(280, 0.16, 'sine', 0.16, 640);
  const dash = () => noise(0.18, 0.2, 1800);
  const pickup = () => {
    tone(880, 0.09, 'sine', 0.14);
    setTimeout(() => tone(1318, 0.14, 'sine', 0.14), 70);
  };
  const drumstick = () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.16), i * 80));
  };
  const hit = () => {
    noise(0.22, 0.3, 700);
    tone(160, 0.25, 'sawtooth', 0.18, 60);
  };
  const stageClear = () => {
    [392, 523, 659].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'triangle', 0.16), i * 110));
  };
  const fanfare = () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.18), i * 120));
  };
  const caught = () => {
    [330, 262, 196, 131].forEach((f, i) => setTimeout(() => tone(f, 0.28, 'sawtooth', 0.14), i * 160));
  };

  // A cheerful banjo-ish loop: bass note + plucked melody, one bar per call.
  const MELODY = [523, 0, 659, 784, 0, 659, 587, 0, 523, 0, 587, 659, 0, 0, 784, 0];
  const BASS = [131, 0, 0, 0, 98, 0, 0, 0, 110, 0, 0, 0, 98, 0, 147, 0];
  function musicBeat() {
    if (muted || !context) return;
    const m = MELODY[musicStep % MELODY.length];
    const b = BASS[musicStep % BASS.length];
    if (m) tone(m, 0.12, 'triangle', 0.05);
    if (b) tone(b, 0.22, 'sine', 0.09);
    musicStep += 1;
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    gobble,
    jump,
    dash,
    pickup,
    drumstick,
    hit,
    stageClear,
    fanfare,
    caught,
    startMusic() {
      if (musicTimer) return;
      musicTimer = setInterval(musicBeat, 150);
    },
    stopMusic() {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };
}
