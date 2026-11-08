import test from 'node:test';
import assert from 'node:assert/strict';
import { beijingSeconds, worldAt, tourTime, groundY, astronautRoutine } from '../planet-time.mjs';

test('Beijing day rolls over at 16:00 UTC, independent of visitor time zone', () => {
  assert.equal(beijingSeconds(Date.parse('2026-11-08T15:59:59Z')), 86399);
  assert.equal(beijingSeconds(Date.parse('2026-11-08T16:00:00Z')), 0);
  assert.equal(beijingSeconds(Date.parse('2026-11-08T04:00:00Z')), 43200);
});
test('arrival happens once at noon and remains complete for late visitors', () => {
  assert.equal(worldAt(43199.99).landing, -1);
  assert.equal(worldAt(43200).landing, 0);
  assert.equal(worldAt(43213.99).dog, false);
  assert.equal(worldAt(43214).dog, true);
  assert.equal(worldAt(43220).landing, 1);
  assert.equal(worldAt(57600).landing, 1);
  assert.equal(worldAt(57600).dog, true);
});
test('growth begins at 18:00, increases, then resets with all daily additions', () => {
  assert.equal(worldAt(64800).growth, 0);
  assert(worldAt(79200).growth > worldAt(72000).growth);
  assert.equal(worldAt(86398).reset, 1);
  assert(worldAt(86399.9).reset < .01);
  const midnight = worldAt(86400);
  for (const key of ['supplies', 'solar', 'antenna', 'bench', 'bed', 'irrigation', 'growth']) assert.equal(midnight[key], 0);
  assert.equal(midnight.dog, false);
  assert.equal(midnight.landing, -1);
});
test('review tour includes the full landing and finishes at a new day', () => {
  assert.equal(tourTime(26), 43200);
  assert.equal(tourTime(29), 43210);
  assert.equal(tourTime(32), 43220);
  assert.equal(tourTime(58), 86398);
  assert.equal(tourTime(60), 0);
});
test('daily routes and construction values remain valid throughout a day', () => {
  for (let time = 0; time < 86400; time += 17) {
    const state = worldAt(time);
    const route = astronautRoutine(state.phase);
    assert(route.length > 0);
    assert(route.every(stop => typeof stop.station === 'string' && typeof stop.action === 'string'));
    for (const key of ['supplies', 'solar', 'antenna', 'bench', 'bed', 'irrigation', 'growth', 'reset']) assert(state[key] >= 0 && state[key] <= 1);
  }
  assert.equal(groundY(500), 180);
});
