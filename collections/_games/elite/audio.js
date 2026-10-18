// Synthesized cockpit audio. The docking waltz is a short public-domain motif.
(function (root) {
  "use strict";

  function createAudio() {
    let ctx = null;
    let engine = null;
    let muted = false;
    let waltzTimer = 0;

    function context() {
      if (ctx) return ctx;
      const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 58;
      filter.type = "lowpass";
      filter.frequency.value = 180;
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      engine = { osc, filter, gain };
      return ctx;
    }

    function resume() {
      const audio = context();
      if (audio && audio.state === "suspended") audio.resume();
    }

    function envGain(duration, peak) {
      const audio = context();
      if (!audio || muted) return null;
      const gain = audio.createGain();
      gain.connect(audio.destination);
      const now = audio.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      return { audio, gain, now };
    }

    function tone(freq, duration, type, peak) {
      const bus = envGain(duration, peak || 0.05);
      if (!bus) return;
      const osc = bus.audio.createOscillator();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, bus.now);
      osc.connect(bus.gain);
      osc.start(bus.now);
      osc.stop(bus.now + duration + 0.02);
    }

    function noise(duration, peak, freq) {
      const bus = envGain(duration, peak || 0.08);
      if (!bus) return;
      const length = Math.max(1, Math.floor(bus.audio.sampleRate * duration));
      const buffer = bus.audio.createBuffer(1, length, bus.audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const src = bus.audio.createBufferSource();
      src.buffer = buffer;
      const filter = bus.audio.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq || 800;
      src.connect(filter);
      filter.connect(bus.gain);
      src.start(bus.now);
    }

    const waltz = [294, 294, 370, 440, 440, 440, 392, 370, 330, 330, 392, 494, 440, 440, 294, 294];

    function play(name) {
      if (name === "laser") {
        noise(0.09, 0.05, 1400);
        tone(520, 0.07, "square", 0.03);
      } else if (name === "beam") {
        noise(0.05, 0.04, 1800);
      } else if (name === "military") {
        noise(0.12, 0.07, 600);
        tone(180, 0.12, "sawtooth", 0.04);
      } else if (name === "mining") {
        noise(0.1, 0.04, 400);
        tone(90, 0.1, "square", 0.03);
      } else if (name === "hit") {
        noise(0.08, 0.06, 300);
      } else if (name === "explosion") {
        noise(0.45, 0.12, 180);
        tone(70, 0.4, "sawtooth", 0.05);
      } else if (name === "missile") {
        tone(880, 0.08, "square", 0.04);
        tone(660, 0.12, "square", 0.03);
      } else if (name === "alarm") {
        tone(740, 0.1, "square", 0.04);
        setTimeout(function () { tone(520, 0.12, "square", 0.04); }, 120);
      } else if (name === "ecm") {
        tone(900, 0.25, "sawtooth", 0.04);
        tone(300, 0.3, "square", 0.03);
      } else if (name === "bomb") {
        noise(0.6, 0.14, 120);
      } else if (name === "hyperspace") {
        const bus = envGain(1.1, 0.06);
        if (!bus) return;
        const osc = bus.audio.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, bus.now);
        osc.frequency.exponentialRampToValueAtTime(1400, bus.now + 0.9);
        osc.connect(bus.gain);
        osc.start(bus.now);
        osc.stop(bus.now + 1.1);
      } else if (name === "arrive") {
        tone(220, 0.2, "sine", 0.04);
      } else if (name === "dock") {
        tone(180, 0.12, "square", 0.04);
        tone(90, 0.2, "sine", 0.04);
      } else if (name === "launch") {
        tone(140, 0.18, "sawtooth", 0.04);
      } else if (name === "scoop") {
        tone(660, 0.06, "square", 0.03);
        tone(990, 0.08, "square", 0.03);
      } else if (name === "ui") {
        tone(660, 0.04, "square", 0.025);
      } else if (name === "deny") {
        tone(140, 0.12, "square", 0.04);
      } else if (name === "fanfare") {
        tone(523, 0.1, "square", 0.04);
        setTimeout(function () { tone(659, 0.1, "square", 0.04); }, 110);
        setTimeout(function () { tone(784, 0.18, "square", 0.045); }, 220);
      } else if (name === "buy") {
        tone(880, 0.05, "square", 0.03);
        tone(1320, 0.07, "square", 0.025);
      } else if (name === "waltz") {
        waltzTimer = waltz.length;
        let i = 0;
        (function stepNote() {
          if (i >= waltz.length || waltzTimer <= 0) return;
          tone(waltz[i], 0.22, "triangle", 0.035);
          i += 1;
          waltzTimer -= 1;
          setTimeout(stepNote, 280);
        })();
      } else if (name === "waltz-stop") {
        waltzTimer = 0;
      }
    }

    function engineSpeed(speed, max) {
      if (!engine || muted) return;
      const audio = context();
      if (!audio) return;
      const t = max > 0 ? Math.max(0, speed) / max : 0;
      const now = audio.currentTime;
      engine.gain.gain.cancelScheduledValues(now);
      engine.gain.gain.linearRampToValueAtTime(t * 0.028, now + 0.1);
      engine.filter.frequency.linearRampToValueAtTime(140 + t * 520, now + 0.1);
      engine.osc.frequency.linearRampToValueAtTime(48 + t * 40, now + 0.1);
    }

    function suspend() {
      if (engine && ctx) engine.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      waltzTimer = 0;
    }

    function toggle() {
      muted = !muted;
      if (muted) suspend();
      return muted;
    }

    return { resume, play, engineSpeed, suspend, toggle, get muted() { return muted; } };
  }

  root.EliteAudio = { create: createAudio };
})(typeof globalThis !== "undefined" ? globalThis : this);
