// Preparation progress counts completed resources and render milestones, not time.
export function preparationProgress(steps, report) {
  const pending = new Set(steps), total = pending.size;
  if (!total) throw new Error('Preparation needs at least one step');
  let fraction = 0;
  report(fraction);
  return step => {
    if (!pending.delete(step)) return fraction;
    fraction = (total - pending.size) / total;
    report(fraction);
    return fraction;
  };
}
