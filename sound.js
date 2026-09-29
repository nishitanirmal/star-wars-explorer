// Synthesised UI sounds with Web Audio. No audio files.
// The context is created on the first user gesture, which browsers require.
window.SWSound = (function () {
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem("sw-muted") === "1"; } catch (e) {}

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
    return true;
  }
  const now = () => ctx.currentTime;
  function osc(type, f0, f1, t0, dur, gain = 0.5, curve = "exp") {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) (curve === "exp" ? o.frequency.exponentialRampToValueAtTime(f1, t0 + dur) : o.frequency.linearRampToValueAtTime(f1, t0 + dur));
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  let noiseBuf = null;
  function noise(t0, dur, fStart, fEnd, gain = 0.4, q = 1.2) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q;
    f.frequency.setValueAtTime(fStart, t0); f.frequency.exponentialRampToValueAtTime(fEnd, t0 + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + dur + 0.05);
  }
  const play = (fn) => { if (muted || !ensure()) return; try { fn(now()); } catch (e) {} };
  let lastTick = 0;

  const S = {
    click: () => play((t) => { osc("square", 1400, 900, t, 0.06, 0.25); osc("sine", 2800, 2200, t, 0.03, 0.12); }),
    tick: () => { const n = performance.now(); if (n - lastTick < 70) return; lastTick = n; play((t) => osc("square", 2600, 2400, t, 0.018, 0.06)); },
    tab: () => play((t) => { osc("square", 700, 1500, t, 0.09, 0.22); osc("square", 1500, 1000, t + 0.09, 0.07, 0.18); }),
    open: () => play((t) => { osc("sine", 880, 1760, t, 0.08, 0.3); osc("sine", 1320, 2640, t + 0.06, 0.1, 0.22); osc("triangle", 220, 180, t, 0.18, 0.15); }),
    close: () => play((t) => { osc("square", 1200, 500, t, 0.12, 0.2); }),
    warp: () => play((t) => { noise(t, 0.55, 300, 5000, 0.35, 0.9); osc("sawtooth", 60, 420, t, 0.45, 0.14, "exp"); osc("sine", 40, 120, t, 0.5, 0.2); }),
    deny: () => play((t) => { osc("square", 300, 260, t, 0.08, 0.2); osc("square", 300, 260, t + 0.11, 0.08, 0.2); }),
    boot: () => play((t) => { noise(t, 0.9, 120, 2400, 0.25, 0.7); [440, 660, 880, 1320].forEach((f, i) => osc("sine", f, f * 1.01, t + i * 0.12, 0.16, 0.18)); osc("sine", 55, 110, t, 1.0, 0.2); }),
    type: () => play((t) => osc("square", 3200, 3000, t, 0.012, 0.05)),
    toggleMute() { muted = !muted; try { localStorage.setItem("sw-muted", muted ? "1" : "0"); } catch (e) {} if (!muted) S.click(); return muted; },
    get muted() { return muted; },
    unlock: ensure,
  };
  return S;
})();
