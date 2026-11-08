import { clamp, groundY } from './planet-time.mjs';

// Conservative outer rims of the four SVG craters, in the planet's viewBox.
export const craters = [
  { x: 210, y: 239, rx: 27, ry: 26 },
  { x: 650, y: 221, rx: 31, ry: 28 },
  { x: 850, y: 300, rx: 40, ry: 38 },
  { x: 430, y: 275, rx: 16, ry: 16 },
];
export function clearsCraters(x, y, width, height) {
  // Test the entire leaf/flower silhouette, not just its root position.
  return craters.every(crater => {
    const nearestX = clamp(crater.x, x - width, x + width);
    const nearestY = clamp(crater.y, y - height, y + 2);
    return ((nearestX - crater.x) / crater.rx) ** 2 + ((nearestY - crater.y) / crater.ry) ** 2 > 1;
  });
}
export function plantLayout(left, right, scale, count) {
  const plants = [];
  for (let i = 0; i < 2000 && plants.length < count; i++) {
    const u = (i * .61803398875 + .17) % 1;
    const v = (i * .754877666 + .31) % 1;
    const x = left + (right - left) * (.035 + u * .91);
    const size = .65 + (i * .37 % .55);
    const height = 26 * scale * size;
    const width = 11 * scale * size;
    const top = groundY(x) + height + 4;
    const y = top + v * (Math.min(292, groundY(x) + 100) - top);
    // Leave winding bare gaps between loose patches instead of a uniform carpet.
    if (Math.sin(u * 17 + v * 5) + .55 * Math.cos(v * 13 - u * 4) > .85) continue;
    if (!clearsCraters(x, y, width + 2, height + 2)) continue;
    if (plants.some(p => Math.hypot((p.x - x), (p.y - y) * 1.25) < 13 * scale)) continue;
    const distance = Math.hypot((u - .7) * 1.1, v * .3);
    plants.push({ x, y, size, height, width, flower: i % 4 === 0, distance });
  }
  // Spread outward from the original garden, then fill the more distant patches.
  plants.sort((a, b) => a.distance - b.distance);
  plants.forEach((plant, index) => { plant.birth = index / Math.max(1, plants.length - 1) * .77; });
  return plants.sort((a, b) => a.y - b.y);
}

// Daily-use items form one compact camp. Power and landing areas sit outside it.
export function campLayout(left, right, scale) {
  const at = fraction => left + (right - left) * fraction;
  const center = at(.46);
  return {
    antenna: center - 78 * scale,
    supplies: center - 39 * scale,
    bench: center + 11 * scale,
    irrigation: center + 62 * scale,
    solar: at(.13), bed: at(.71), rocket: at(.93),
    camp: center,
  };
}
