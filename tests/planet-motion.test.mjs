import test from 'node:test';
import assert from 'node:assert/strict';
import { createActor, advanceActor, moveActor } from '../planet-motion.mjs';
import { campLayout } from '../planet-layout.mjs';

test('abrupt destination and chapter changes cannot bypass the walking speed limit', () => {
  const actor = createActor(100), dt = 1 / 30, speed = 22;
  for (let frame = 0; frame < 5400; frame++) {
    const chapter = Math.floor(frame / 73);
    const target = chapter % 2 ? 900 : 100;
    const before = actor.x;
    advanceActor(actor, [{ x: target, action: 'build', wait: 3 }], String(chapter), dt, speed, 40);
    assert(Math.abs(actor.x - before) <= speed * dt + .12);
    assert(Math.abs(actor.velocity) <= speed + 1e-8);
  }
});
test('work starts only after arrival and the next trip follows the dwell period', () => {
  const actor = createActor(0);
  const route = [{ x: 44, action: 'build', wait: 3 }, { x: 0, action: 'rest', wait: 3 }];
  let arrival = null, departure = null;
  for (let frame = 0; frame < 360; frame++) {
    const result = advanceActor(actor, route, 'build', 1 / 30, 22, 40);
    if (result.action === 'build' && arrival === null) arrival = frame / 30;
    if (arrival === null) assert.equal(result.action, 'walk');
    if (actor.routeIndex === 1 && departure === null) departure = frame / 30;
  }
  assert(arrival >= 2);
  assert(departure - arrival >= 3);
});
test('a hidden-tab delay does not cause a catch-up jump, and reversing brakes first', () => {
  const actor = createActor(100);
  actor.velocity = 22;
  moveActor(actor, 900, 120, 22, 40);
  assert(actor.x <= 102.2 + 1e-8);
  const before = actor.x;
  moveActor(actor, 0, 1 / 30, 22, 40);
  assert(actor.x > before);
  assert(actor.velocity < 22);
});
test('dog speed remains capped across its faster running and slower walking routes', () => {
  const dog = createActor(500);
  for (let frame = 0; frame < 3600; frame++) {
    const before = dog.x;
    moveActor(dog, frame % 500 < 250 ? 800 : 200, 1 / 30, frame % 120 < 60 ? 43 : 32, 65);
    assert(Math.abs(dog.x - before) <= 43 / 30 + 1e-8);
  }
});
test('everyday supplies form a camp at both desktop and mobile scales', () => {
  for (const [left, right, scale] of [[172,960,.625], [320,767,1]]) {
    const camp = campLayout(left, right, scale);
    assert(camp.bench - camp.supplies <= 50 * scale);
    assert(camp.irrigation - camp.bench <= 51 * scale);
    assert(camp.solar < camp.antenna);
    assert(camp.rocket > camp.irrigation + 40 * scale);
  }
});

test('reloading at an exact clock time restores position, direction and remaining rest', async () => {
  const { compileActorTimeline } = await import('../planet-motion.mjs');
  const route = () => [{ x: 100, action: 'look', wait: 9 }, { x: 370, action: 'sample', wait: 9 }, { x: 30, action: 'rest', wait: 14 }];
  const make = () => compileActorTimeline([{ start: 0, phase: 'explore' }], route, createActor(100), () => 22, 40);
  const open = make(), reloaded = make();
  for (const time of [3600, 3600.125, 3610, 3660, 18000]) assert.deepEqual(open.at(time), reloaded.at(time));
  const positions = [3600, 3610, 3620, 3630].map(time => reloaded.at(time).x);
  assert(new Set(positions).size > 2);
  assert(positions.some(x => Math.abs(x - 100) > 20));
});
test('clock-based motion preserves speed and position across chapters and patrol loops', async () => {
  const { compileActorTimeline } = await import('../planet-motion.mjs');
  const route = phase => phase === 'first'
    ? [{ x: 100, action: 'look', wait: 2 }, { x: 600, action: 'sample', wait: 3 }]
    : [{ x: 900, action: 'build', wait: 3 }, { x: 30, action: 'rest', wait: 2 }];
  const timeline = compileActorTimeline([{ start: 0, phase: 'first' }, { start: 17, phase: 'second' }], route, createActor(100), () => 22, 40);
  let previous = timeline.at(0);
  for (let i = 1; i <= 9000; i++) {
    const current = timeline.at(i / 30);
    assert(Math.abs(current.x - previous.x) <= 22 / 30 + 1e-7);
    assert(Math.abs(current.velocity) <= 22 + 1e-7);
    assert(Math.abs(current.velocity - previous.velocity) <= 40 / 30 + 1e-6);
    previous = current;
  }
});
test('seeking inside a work interval keeps its elapsed dwell rather than starting over', async () => {
  const { compileActorTimeline } = await import('../planet-motion.mjs');
  const timeline = compileActorTimeline([{ start: 0, phase: 'build' }], () => [{ x: 100, action: 'build', wait: 9 }, { x: 300, action: 'rest', wait: 14 }], createActor(100), () => 22, 40);
  assert.equal(timeline.at(7).action, 'build');
  assert.equal(timeline.at(7).dwell, 7);
  assert.equal(timeline.at(9.1).action, 'walk');
  assert(timeline.at(9.1).x > 100);
});
test('the dog timeline has no pose before its actual exit from the rocket', async () => {
  const { compileActorTimeline } = await import('../planet-motion.mjs');
  const timeline = compileActorTimeline([{ start: 43214, phase: 'arrival' }, { start: 43220, phase: 'together' }], () => [{ x: 700, action: 'sit', wait: 5 }, { x: 500, action: 'sniff', wait: 6 }], createActor(740), () => 32, 65);
  assert.equal(timeline.at(43213.99), null);
  assert.equal(timeline.at(43214).x, 740);
  assert(timeline.at(43215).x < 740);
});
