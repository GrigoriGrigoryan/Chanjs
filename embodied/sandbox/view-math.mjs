// Presentation geometry only. These helpers never change model coordinates.
export function fitBrainBounds(bounds, width, height, fovDegrees = 42) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const top = Math.min(168, height * .25), bottom = Math.min(112, height * .18);
  const usableHeight = Math.max(.4, (height - top - bottom) / height);
  const tangent = Math.tan(fovDegrees * Math.PI / 360);
  const half = bounds.max.map((value, axis) => (value - bounds.min[axis]) / 2);
  const center = bounds.max.map((value, axis) => (value + bounds.min[axis]) / 2);
  const distance = half[2] + Math.max(half[0] / (tangent * aspect * .9), half[1] / (tangent * usableHeight * .9));
  const targetY = center[1] + (top - bottom) / height * distance * tangent;
  return { center, distance, targetY };
}

export function boundedArenaTarget(target, subjects, margin = 70) {
  const x = subjects.map(point => point[0]), y = subjects.map(point => point[1]);
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  return [clamp(target[0], Math.min(...x) - margin, Math.max(...x) + margin),
    clamp(target[1], Math.min(...y) - margin, Math.max(...y) + margin), clamp(target[2], 0, 12)];
}
