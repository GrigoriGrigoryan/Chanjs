/* Browser port of the Shiu et al. v630 model (Nature 2024).
 * Equations, parameters and ordering: https://github.com/philshiu/Drosophila_brain_model
 * Connectivity is supplied separately as CSR, with signed synapse counts.
 * Units: millisecond, millivolt, hertz. No learned or behavioral controller.
 */
'use strict';
class FlyBrain {
  constructor({offsets, targets, weights, ids = [], groups = {}}, seed = 1) {
    this.offsets = offsets;
    this.targets = targets;
    this.weights = weights;
    this.ids = ids;
    this.groups = groups;
    this.size = offsets.length - 1;
    if (targets.length !== weights.length || offsets[this.size] !== targets.length) throw new Error('Invalid CSR lengths');
    this.u = new Float64Array(this.size); // membrane potential relative to -52 mV
    this.g = new Float64Array(this.size);
    this.updated = new Float64Array(this.size); // completed integration steps
    this.lastSpike = new Float64Array(this.size).fill(-1e12);
    this.counts = new Float64Array(this.size);
    this.windowCounts = new Uint32Array(this.size);
    this.refractory = new Uint8Array(this.size).fill(22);
    this.silenced = new Uint8Array(this.size);
    this.clamped = new Uint8Array(this.size);
    this.active = new Uint32Array(this.size);
    this.awake = new Uint8Array(this.size);
    this.activeCount = 0;
    this.queue = Array.from({length: 19}, () => []);
    this.spikes = [];
    this.injected = [];
    this.tick = 0;
    this.windowStart = 0;
    this.totalSpikes = 0;
    this.windowSpikes = 0;
    this.randomState = seed >>> 0;
    this.rates = [0, 0];
    this.inputs = [groups.sweet || [], groups.bitter || []];
    this.inputPrograms = {};
    this.modulators = {};
    this.modulatorSources = new Map();
    this.modulationTarget = new Float64Array(this.size);
    for (const group of this.inputs) for (const i of group) this.refractory[i] = 0;
    this.a = Math.exp(-0.1 / 20);
    this.b = Math.exp(-0.1 / 5);
    this.c = (this.a - this.b) / 3;
    // Lookup avoids repeated exponentials without approximating the transition.
    this.decayM = Float64Array.from({length: 10001}, (_, i) => Math.exp(-i * 0.1 / 20));
    this.decayG = Float64Array.from({length: 10001}, (_, i) => Math.exp(-i * 0.1 / 5));
  }
  random() {
    let x = this.randomState = (this.randomState + 0x6D2B79F5) >>> 0;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }
  setRates(sweetHz, bitterHz) {
    this.rates[0] = Math.min(200, Math.max(0, Number(sweetHz) || 0));
    this.rates[1] = Math.min(200, Math.max(0, Number(bitterHz) || 0));
  }
  // Named stochastic inputs generalize the source model's two PoissonInput
  // populations. They are external stimulation, never forced neural spikes.
  setInputProgram(group, {rateHz = 0, startMs = 0, durationMs = Infinity, millivolts = 68.75} = {}) {
    const indices = this.indices(group);
    const rate = Math.min(200, Math.max(0, Number(rateHz) || 0));
    if (!Number.isFinite(startMs) || !(Number.isFinite(durationMs) || durationMs === Infinity) || !Number.isFinite(millivolts)) throw new Error('Invalid input program');
    this.inputPrograms[group] = {indices, rateHz: rate, startMs, durationMs, millivolts};
    for (const i of indices) this.refractory[i] = 0;
  }
  clearInputPrograms() { this.inputPrograms = {}; }
  // This is a deliberately phenomenological modulation layer. A source-group
  // spike raises a decaying state; documented target coefficients shift that
  // target's LIF threshold. It does not claim receptor-level physiology.
  setModulators(config = {}) {
    this.modulators = {};
    this.modulatorSources = new Map();
    this.modulationTarget.fill(0);
    for (const [name, spec] of Object.entries(config)) {
      const sources = this.indices(spec.source);
      const targets = this.indices(spec.target);
      const item = {sources, targets, impulse: Number(spec.impulse) || 0, tauMs: Math.max(.1, Number(spec.tauMs) || 500), thresholdShift: Number(spec.thresholdShift) || 0, value: 0};
      this.modulators[name] = item;
      for (const source of sources) {
        const names = this.modulatorSources.get(source) || [];
        names.push(name); this.modulatorSources.set(source, names);
      }
    }
  }
  modulationSnapshot() {
    const result = {};
    for (const [name, item] of Object.entries(this.modulators)) result[name] = item.value;
    return result;
  }
  refreshModulationTargets() {
    this.modulationTarget.fill(0);
    for (const item of Object.values(this.modulators)) {
      for (const target of item.targets) this.modulationTarget[target] += item.value * item.thresholdShift;
    }
  }
  decayModulators() {
    for (const item of Object.values(this.modulators)) item.value *= Math.exp(-.1 / item.tauMs);
    this.refreshModulationTargets();
  }
  updateModulators(spikes) {
    for (const source of spikes) for (const name of this.modulatorSources.get(source) || []) {
      const item = this.modulators[name];
      item.value = Math.min(1, item.value + item.impulse);
    }
    this.refreshModulationTargets();
    for (const item of Object.values(this.modulators)) for (const target of item.targets) if (this.potentiallySpiking(target)) this.wake(target);
  }
  indices(group) {
    if (typeof group === 'string') {
      if (!this.groups[group]) throw new Error('Unknown neural group: ' + group);
      return this.groups[group];
    }
    return typeof group === 'number' ? [group] : group;
  }
  setSilenced(group, enabled) {
    for (const i of this.indices(group)) this.silenced[i] = enabled ? 1 : 0;
  }
  setClamped(group, enabled) {
    for (const i of this.indices(group)) {
      this.clamped[i] = enabled ? 1 : 0;
      if (enabled) { this.u[i] = 0; this.g[i] = 0; this.updated[i] = this.tick; }
    }
  }
  wake(i) {
    if (!this.awake[i] && !this.clamped[i]) {
      this.awake[i] = 1;
      this.active[this.activeCount++] = i;
    }
  }
  // Exact subthreshold transition across k steps. Dormant cells have no possible
  // threshold crossing under this conservative bound, and receive no unhandled
  // input. Their complete state is retained; there is no epsilon truncation.
  evolve(i, completedStep) {
    const k = completedStep - this.updated[i];
    if (k <= 0) return;
    const a = k <= 10000 ? this.decayM[k] : Math.exp(-k * 0.1 / 20);
    const b = k <= 10000 ? this.decayG[k] : Math.exp(-k * 0.1 / 5);
    this.u[i] = this.u[i] * a + this.g[i] * (a - b) / 3;
    this.g[i] *= b;
    this.updated[i] = completedStep;
  }
  potentiallySpiking(i) {
    return Math.max(0, this.u[i]) + Math.max(0, this.g[i]) / 3 >= 7 - this.modulationTarget[i];
  }
  state(i) {
    this.evolve(i, this.tick);
    return {voltage: this.u[i] - 52, g: this.g[i], spikes: this.counts[i], lastSpikeMs: this.lastSpike[i] < 0 ? null : this.lastSpike[i] * 0.1};
  }
  voltage(i) { return this.state(i).voltage; }
  // Research/test interface: a supplied event follows the same synapses slot as
  // the paper's PoissonInput. It is not an instruction to emit a neural spike.
  inject(group, millivolts = 68.75) {
    for (const i of this.indices(group)) this.injected.push(i, millivolts);
  }
  setState(i, voltage, g = 0) {
    if (!Number.isFinite(voltage) || !Number.isFinite(g)) throw new Error('Non-finite neuron state');
    this.u[i] = voltage + 52;
    this.g[i] = g;
    this.updated[i] = this.tick;
    if (this.potentiallySpiking(i)) this.wake(i);
  }
  accepts(i, tick) {
    // Threshold detection makes a just-spiked cell read-only even for rfc=0.
    return !this.clamped[i] && this.lastSpike[i] !== tick && tick - this.lastSpike[i] >= this.refractory[i];
  }
  inputKick(i, value, tick) {
    if (!this.accepts(i, tick)) return;
    this.evolve(i, tick + 1);
    this.u[i] += value;
    if (this.potentiallySpiking(i)) this.wake(i);
  }
  step() {
    const tick = this.tick, completed = tick + 1;
    const spikes = this.spikes;
    spikes.length = 0;
    this.decayModulators();
    let retained = 0;
    // Brian2 groups -> thresholds. Awake cells use the exact linear step.
    const limit = this.activeCount;
    for (let p = 0; p < limit; p++) {
      const i = this.active[p];
      if (this.clamped[i]) {
        this.u[i] = this.g[i] = 0;
        this.updated[i] = completed;
        this.awake[i] = 0;
        continue;
      }
      if (tick - this.lastSpike[i] >= this.refractory[i]) {
        this.evolve(i, completed);
        if (this.u[i] > 7 - this.modulationTarget[i]) {
          spikes.push(i);
          this.lastSpike[i] = tick;
          this.counts[i]++;
          this.windowCounts[i]++;
          this.awake[i] = 0;
          continue;
        }
      } else this.updated[i] = completed;
      if (this.potentiallySpiking(i)) this.active[retained++] = i;
      else this.awake[i] = 0;
    }
    this.activeCount = retained;
    spikes.sort((a, b) => a - b); // Brian2 emits spikes in neuron-index order.
    // Brian2 synapses: each source spike arrives 18 ticks after emission.
    const arrivals = this.queue[tick % 19];
    for (let p = 0; p < arrivals.length; p++) {
      const source = arrivals[p];
      if (this.silenced[source] || this.clamped[source]) continue;
      for (let edge = this.offsets[source]; edge < this.offsets[source + 1]; edge++) {
        const i = this.targets[edge];
        if (!this.accepts(i, tick)) continue;
        this.evolve(i, completed);
        this.g[i] += this.weights[edge] * 0.275;
        if (this.potentiallySpiking(i)) this.wake(i);
      }
    }
    arrivals.length = 0;
    // N=1 Brian2 PoissonInput is a Bernoulli draw with p=rate*dt, not
    // an exponential waiting-time process. PRNG is seeded for reproducibility.
    for (let group = 0; group < 2; group++) {
      const probability = this.rates[group] * 0.0001;
      for (const i of this.inputs[group]) if (this.random() < probability) this.inputKick(i, 68.75, tick);
    }
    const timeMs = tick * .1;
    for (const program of Object.values(this.inputPrograms)) {
      if (timeMs < program.startMs || timeMs >= program.startMs + program.durationMs) continue;
      const probability = program.rateHz * .0001;
      for (const i of program.indices) if (this.random() < probability) this.inputKick(i, program.millivolts, tick);
    }
    for (let p = 0; p < this.injected.length; p += 2) this.inputKick(this.injected[p], this.injected[p + 1], tick);
    this.injected.length = 0;
    const future = this.queue[(tick + 18) % 19];
    // Brian2 resets after synaptic delivery and external input.
    for (const i of spikes) {
      this.u[i] = this.g[i] = 0;
      this.updated[i] = completed;
      future.push(i);
    }
    this.updateModulators(spikes);
    this.totalSpikes += spikes.length;
    this.windowSpikes += spikes.length;
    this.tick = completed;
    return spikes;
  }
  advance(milliseconds) {
    const steps = Math.max(0, Math.round(milliseconds * 10));
    for (let i = 0; i < steps; i++) this.step();
    return this;
  }
  snapshot(resetWindow = true) {
    const windowMs = (this.tick - this.windowStart) * 0.1;
    const result = {timeMs: this.tick * 0.1, totalSpikes: this.totalSpikes, windowMs,
      windowSpikes: this.windowSpikes, activeNeurons: this.activeCount, groups: {}};
    for (const [name, indices] of Object.entries(this.groups)) {
      let spikes = 0, voltage = 0, g = 0, lastSpike = -1e12;
      for (const i of indices) {
        this.evolve(i, this.tick);
        spikes += this.windowCounts[i];
        voltage += this.u[i] - 52;
        g += this.g[i];
        lastSpike = Math.max(lastSpike, this.lastSpike[i]);
      }
      const n = indices.length;
      result.groups[name] = {spikes, rateHz: n && windowMs ? spikes * 1000 / n / windowMs : 0,
        meanVoltage: n ? voltage / n : -52, meanG: n ? g / n : 0,
        lastSpikeMs: lastSpike < 0 ? null : lastSpike * 0.1};
    }
    if (resetWindow) { this.windowCounts.fill(0); this.windowSpikes = 0; this.windowStart = this.tick; }
    return result;
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = FlyBrain;
if (typeof self !== 'undefined') self.FlyBrain = FlyBrain;
