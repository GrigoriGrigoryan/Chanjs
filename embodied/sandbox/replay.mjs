// The legacy recorder sampled at 0, 10 and 20 ms inside EACH 25 ms window.
// Treating that stream as uniform 10 ms frames makes the body lag the brain.
export function poseFrameAt(run, time) {
  const t = Math.max(0, time);
  if (run.frames === run.rows.length * 3 && run.frame_dt === 0.01) {
    const w = Math.floor((t + 1e-10) / 0.025);
    const offset = Math.max(0, t - w * 0.025);
    return Math.min(run.frames - 1, w * 3 + Math.min(2, Math.floor((offset + 1e-10) / 0.01)));
  }
  return Math.min(run.frames - 1, Math.floor(t / run.frame_dt));
}

export function recordingPath(id, staticHosting) {
  if (!/^[0-9a-f]{10}$/.test(id)) throw new Error('Invalid recording identifier');
  return `${staticHosting ? '../results/sandbox' : '/runs'}/${id}`;
}
