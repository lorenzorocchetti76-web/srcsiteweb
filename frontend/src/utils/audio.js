let ctx = null;
let master = null;
let channels = [];
let noiseBuf = null;
let lastF = -1;

function makeNoise() {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    d[i] = last * 3;
  }
  return buf;
}

function noiseLayer(chGain, filterType, freq, q, baseGain, lfoRate, lfoDepth) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = baseGain;
  src.connect(f); f.connect(g); g.connect(chGain);
  src.start();
  if (lfoRate) {
    const o = ctx.createOscillator(); o.frequency.value = lfoRate;
    const og = ctx.createGain(); og.gain.value = lfoDepth;
    o.connect(og); og.connect(g.gain); o.start();
  }
}

function blip(chGain, freq, dur, vol, type) {
  const o = ctx.createOscillator();
  o.type = type || "sine";
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g); g.connect(chGain);
  o.start();
  o.stop(ctx.currentTime + dur + 0.05);
}

function thunder(chGain) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 120;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.6, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
  src.connect(f); f.connect(g); g.connect(chGain);
  src.start();
  src.stop(ctx.currentTime + 2);
}

function scheduler(fn, minMs, maxMs) {
  const tick = () => {
    fn();
    setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
  };
  setTimeout(tick, minMs);
}

function buildChannels() {
  const defs = [
    (ch) => { // Roma: traffico tiepido + uccellini
      noiseLayer(ch, "lowpass", 350, 0.6, 0.4, 0.07, 0.14);
      scheduler(() => {
        blip(ch, 1800 + Math.random() * 1400, 0.09, 0.035);
        setTimeout(() => blip(ch, 2200 + Math.random() * 1200, 0.07, 0.028), 120);
      }, 500, 1800);
    },
    (ch) => { // New York: rombo traffico + clacson
      noiseLayer(ch, "lowpass", 170, 0.8, 0.75, 0.05, 0.2);
      scheduler(() => blip(ch, 300 + Math.random() * 80, 0.2, 0.05, "square"), 6000, 14000);
    },
    (ch) => { // Londra: pioggia + tuono lontano
      noiseLayer(ch, "bandpass", 1800, 0.5, 0.42, 8, 0.16);
      noiseLayer(ch, "highpass", 4000, 0.4, 0.08);
      scheduler(() => thunder(ch), 15000, 30000);
    },
    (ch) => { // Dubai: vento del deserto + fontana
      noiseLayer(ch, "bandpass", 480, 1.1, 0.4, 0.08, 0.2);
      noiseLayer(ch, "bandpass", 3200, 2, 0.1, 0.3, 0.05);
    },
    (ch) => { // Mosca: vento freddo + campana
      noiseLayer(ch, "lowpass", 520, 0.7, 0.5, 0.06, 0.22);
      scheduler(() => {
        blip(ch, 520, 2.8, 0.07);
        blip(ch, 782, 2.2, 0.03);
      }, 11000, 17000);
    },
  ];
  channels = defs.map((build) => {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(master);
    build(g);
    return g;
  });
}

export async function toggleAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    noiseBuf = makeNoise();
    buildChannels();
  }
  if (ctx.state === "running") {
    await ctx.suspend();
    return false;
  }
  await ctx.resume();
  return true;
}

export function audioMix(envF) {
  if (!ctx || ctx.state !== "running") return;
  if (Math.abs(envF - lastF) < 0.02) return;
  lastF = envF;
  channels.forEach((g, i) => {
    const target = Math.pow(Math.max(0, 1 - Math.abs(envF - i)), 1.6) * 0.9;
    g.gain.setTargetAtTime(target, ctx.currentTime, 0.4);
  });
}
