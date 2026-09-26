// Presentation geometry only. These helpers never change model coordinates.
export function fitBrainBounds(bounds, width, height, fovDegrees = 42, options = {}) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const top = options.top ?? Math.min(168, height * .25), bottom = options.bottom ?? Math.min(112, height * .18);
  const usableHeight = Math.max(.15, (height - top - bottom) / height);
  const tangent = Math.tan(fovDegrees * Math.PI / 360);
  const half = bounds.max.map((value, axis) => (value - bounds.min[axis]) / 2);
  const center = bounds.max.map((value, axis) => (value + bounds.min[axis]) / 2);
  const previousDistance = half[2] + Math.max(half[0] / (tangent * aspect * .9), half[1] / (tangent * usableHeight * .9));
  const offset = (top - bottom) / Math.max(1, height);
  let requiredDistance = .1;
  const include = (x, y, z) => {
    const dx = x - center[0], dy = y - center[1], dz = z - center[2];
    requiredDistance = Math.max(requiredDistance, dz + Math.max(Math.abs(dx) / (tangent * aspect * .97),
      Math.abs(dy / tangent + offset * dz) / (usableHeight * .97)));
  };
  if (options.points) {
    for (let i = 0; i < options.points.length; i += 3) include(options.points[i], options.points[i + 1], options.points[i + 2]);
  } else {
    for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]])
      for (const z of [bounds.min[2], bounds.max[2]]) include(x, y, z);
  }
  for (const point of options.extraPoints || []) include(...point);
  // Aim for 15% closer than the old box fit, but never crop actual neurons or
  // the decision marker to achieve an arbitrary zoom percentage.
  const distance = Math.max(previousDistance / 1.15, requiredDistance);
  const targetY = center[1] + (top - bottom) / height * distance * tangent;
  return { center, distance, targetY };
}

export function boundedArenaTarget(target, subjects, margin = 70) {
  const x = subjects.map(point => point[0]), y = subjects.map(point => point[1]);
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  return [clamp(target[0], Math.min(...x) - margin, Math.max(...x) + margin),
    clamp(target[1], Math.min(...y) - margin, Math.max(...y) + margin), clamp(target[2], 0, 12)];
}
