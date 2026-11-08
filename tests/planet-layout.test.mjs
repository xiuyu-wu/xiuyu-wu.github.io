import test from 'node:test';
import assert from 'node:assert/strict';
import { clearsCraters, plantLayout, craters } from '../planet-layout.mjs';
import { groundY } from '../planet-time.mjs';

test('crater avoidance includes leaves above and beside a root', () => {
  assert.equal(clearsCraters(650, 221, 5, 10), false);
  assert.equal(clearsCraters(650, 260, 5, 20), false);
  assert.equal(clearsCraters(690, 225, 14, 20), false);
  assert.equal(clearsCraters(700, 280, 4, 10), true);
});
for (const [name, left, right, scale, count] of [
  ['desktop', 172, 960, .625, 96],
  ['mobile', 320, 767, 1, 30],
]) test(`${name} garden spans the terrain while all foliage clears crater rims`, () => {
  const plants = plantLayout(left, right, scale, count);
  assert.equal(plants.length, count);
  assert.deepEqual(plants, plantLayout(left, right, scale, count));
  assert(Math.max(...plants.map(p => p.x)) - Math.min(...plants.map(p => p.x)) > (right - left) * .8);
  assert(Math.max(...plants.map(p => p.y)) - Math.min(...plants.map(p => p.y)) > 60);
  for (const p of plants) {
    assert(p.y - p.height >= groundY(p.x));
    assert(p.y <= 292);
    // Sample the full bounding rectangle against each protected crater ellipse.
    for (const crater of craters) for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) {
      const x = p.x - p.width + 2 * p.width * a / 10;
      const y = p.y - p.height + (p.height + 2) * b / 10;
      assert(((x - crater.x) / crater.rx) ** 2 + ((y - crater.y) / crater.ry) ** 2 > 1);
    }
  }
});
