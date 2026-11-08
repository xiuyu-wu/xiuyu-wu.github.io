// Movement uses elapsed real seconds, independently of the accelerated story clock.
export function createActor(x) {
  return { x, velocity: 0, direction: 1, routeIndex: 0, dwell: 0, arrived: false, phase: '' };
}
export function moveActor(actor, target, dt, maxSpeed, acceleration) {
  if (dt <= 0) return;
  dt = Math.min(dt, .1); // Never catch up a hidden tab with one huge step.
  const distance = target - actor.x;
  const desired = Math.sign(distance) * Math.min(maxSpeed, Math.sqrt(2 * acceleration * Math.abs(distance)));
  const change = Math.max(-acceleration * dt, Math.min(acceleration * dt, desired - actor.velocity));
  const velocity = actor.velocity + change;
  let step = (actor.velocity + velocity) * .5 * dt;
  // Stop at a goal; an abrupt new goal still brakes smoothly before reversing.
  if (step * distance >= 0 && Math.abs(step) >= Math.abs(distance)) {
    actor.x = target; actor.velocity = 0;
  } else {
    actor.x += step; actor.velocity = velocity;
  }
  if (Math.abs(actor.velocity) > .15) actor.direction = Math.sign(actor.velocity);
}
export function advanceActor(actor, route, phase, dt, speed, acceleration) {
  if (actor.phase !== phase) {
    actor.phase = phase;
    actor.routeIndex = 0;
    actor.dwell = 0;
    actor.arrived = false;
  }
  let goal = route[actor.routeIndex % route.length];
  if (actor.arrived) {
    actor.dwell += dt;
    if (actor.dwell >= goal.wait) {
      actor.routeIndex = (actor.routeIndex + 1) % route.length;
      actor.dwell = 0; actor.arrived = false;
      goal = route[actor.routeIndex];
    }
  }
  if (!actor.arrived) {
    moveActor(actor, goal.x, dt, speed, acceleration);
    if (Math.abs(actor.x - goal.x) < .12 && Math.abs(actor.velocity) < .5) {
      actor.x = goal.x; actor.velocity = 0; actor.arrived = true;
    }
  }
  return { action: actor.arrived ? goal.action : goal.travel || 'walk', direction: actor.direction };
}

// Compile small, repeatable travel/work schedules. Seeking is O(chapters), not
// a replay of every animation frame since midnight, and needs no saved browser state.
export function actorStops(stations, scale) {
  return {
    camp: stations.camp + 34 * scale,
    supplies: stations.supplies + 25 * scale,
    solar: stations.solar + 32 * scale,
    antenna: stations.antenna + 20 * scale,
    bench: stations.bench + 32 * scale,
    irrigation: stations.irrigation + 23 * scale,
    garden: stations.bed - 15 * scale,
    welcome: stations.rocket - 55 * scale,
  };
}
function travelLeg(from, goal, speed, acceleration, previousDirection = 1) {
  const distance = Math.abs(goal.x - from);
  const direction = Math.sign(goal.x - from) || previousDirection;
  const ramp = Math.min(speed / acceleration, Math.sqrt(distance / acceleration));
  const peak = ramp * acceleration;
  const cruise = peak ? Math.max(0, (distance - acceleration * ramp * ramp) / peak) : 0;
  const travel = 2 * ramp + cruise;
  return {
    duration: travel + goal.wait,
    at(t) {
      if (t >= travel) return { x: goal.x, velocity: 0, direction, action: goal.action, arrived: true, dwell: t - travel, routeIndex: goal.index };
      let moved, velocity;
      if (t < ramp) { moved = .5 * acceleration * t * t; velocity = acceleration * t; }
      else if (t < ramp + cruise) { moved = .5 * acceleration * ramp * ramp + peak * (t - ramp); velocity = peak; }
      else { const remaining = travel - t; moved = distance - .5 * acceleration * remaining * remaining; velocity = acceleration * remaining; }
      return { x: from + direction * moved, velocity: direction * velocity, direction, action: goal.travel || 'walk', arrived: false, dwell: 0, routeIndex: goal.index };
    },
  };
}
function sampleSegments(segments, seconds) {
  let remaining = Math.max(0, seconds);
  for (const segment of segments) {
    if (remaining < segment.duration) return segment.at(remaining);
    remaining -= segment.duration;
  }
  const last = segments[segments.length - 1];
  return last.at(last.duration);
}
function compileChapter(entry, route, speedFor, acceleration) {
  const prefix = [];
  let from = entry.x;
  if (Math.abs(entry.velocity) > 1e-7) {
    const velocity = entry.velocity;
    const sign = Math.sign(velocity);
    const duration = Math.abs(velocity) / acceleration;
    const origin = from;
    prefix.push({ duration, at(t) { return { ...entry, x: origin + velocity * t - sign * .5 * acceleration * t * t, velocity: velocity - sign * acceleration * t, action: 'walk', arrived: false, dwell: 0, routeIndex: 0 }; } });
    from += velocity * duration * .5;
  }
  prefix.push(travelLeg(from, { ...route[0], index: 0 }, speedFor(route[0]), acceleration, entry.direction));
  const loop = [];
  from = route[0].x;
  let direction = prefix.at(-1).at(prefix.at(-1).duration).direction;
  for (let i = 1; i <= route.length; i++) {
    const index = i % route.length;
    const leg = travelLeg(from, { ...route[index], index }, speedFor(route[index]), acceleration, direction);
    loop.push(leg);
    from = route[index].x;
    direction = leg.at(leg.duration).direction;
  }
  const prefixDuration = prefix.reduce((total, leg) => total + leg.duration, 0);
  const period = loop.reduce((total, leg) => total + leg.duration, 0);
  return { at(seconds) { return seconds < prefixDuration ? sampleSegments(prefix, seconds) : sampleSegments(loop, (seconds - prefixDuration) % period); } };
}
export function compileActorTimeline(chapters, routeFor, start, speedFor, acceleration) {
  const compiled = [];
  for (const chapter of chapters) {
    const previous = compiled.at(-1);
    const entry = previous ? previous.motion.at(chapter.start - previous.start) : start;
    compiled.push({ ...chapter, motion: compileChapter(entry, routeFor(chapter.phase), speedFor, acceleration) });
  }
  return {
    at(seconds) {
      const chapter = compiled.findLast(chapter => chapter.start <= seconds);
      return chapter ? { ...chapter.motion.at(seconds - chapter.start), phase: chapter.phase } : null;
    },
  };
}
