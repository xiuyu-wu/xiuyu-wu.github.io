// All world state is derived from the clock, never from time spent on this page.
export const DAY = 86400;
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export function beijingSeconds(epoch = Date.now()) {
  return ((epoch / 1000 + 8 * 3600) % DAY + DAY) % DAY;
}
export const chapters = [
  [0, 'A quiet beginning', 'explore'],
  [3, 'Mapping the ground', 'survey'],
  [6, 'Building a little outpost', 'build'],
  [9, 'Preparing a place to grow', 'prepare'],
  [11.5, 'Waiting for a friend', 'wait'],
  [12, 'A visitor from the stars', 'arrival'],
  [12 + 20 / 3600, 'Better together', 'together'],
  [15, 'Planting possibilities', 'plant'],
  [18, 'The first little sprouts', 'sprout'],
  [21, 'A garden on another world', 'bloom'],
  [23 + 50 / 60, 'A moment to rest', 'rest'],
];
export function worldAt(seconds) {
  const t = ((seconds % DAY) + DAY) % DAY;
  const chapter = chapters.findLast(([hour]) => t >= hour * 3600);
  return {
    seconds: t, title: chapter[1], phase: chapter[2],
    supplies: smooth((t - 3 * 3600) / (2 * 3600)),
    solar: smooth((t - 6 * 3600) / (2 * 3600)),
    antenna: smooth((t - 7 * 3600) / (2 * 3600)),
    bench: smooth((t - 9 * 3600) / (2 * 3600)),
    bed: smooth((t - 10 * 3600) / (6 * 3600)),
    irrigation: smooth((t - 15 * 3600) / (3 * 3600)),
    growth: clamp((t - 18 * 3600) / (5.5 * 3600)),
    landing: t < 43200 ? -1 : clamp((t - 43200) / 20),
    dog: t >= 43214,
    // The new day is entirely barren at exactly midnight.
    reset: t >= DAY - 2 ? 1 - smooth((t - (DAY - 2)) / 2) : 1,
  };
}
// A 60-second review gives the landing six seconds and the reset two seconds.
export function tourTime(elapsed) {
  const t = clamp(elapsed, 0, 60);
  if (t < 26) return t / 26 * 43200;
  if (t < 32) return 43200 + (t - 26) / 6 * 20;
  if (t < 58) return 43220 + (t - 32) / 26 * (86398 - 43220);
  return t < 60 ? 86398 + (t - 58) : 0;
}
export function groundY(x) {
  return 1430 - 1250 * Math.sqrt(1 - ((x - 500) / 1800) ** 2);
}
// Characters finish a journey before starting the work at that destination.
export function astronautRoutine(phase) {
  const routines = {
    explore: [['camp', 'look'], ['garden', 'sample'], ['solar', 'rest']],
    survey: [['supplies', 'carry'], ['garden', 'sample'], ['camp', 'look']],
    build: [['supplies', 'carry'], ['solar', 'build'], ['antenna', 'inspect']],
    prepare: [['bench', 'build'], ['supplies', 'carry'], ['garden', 'dig']],
    wait: [['welcome', 'look'], ['welcome', 'wave']],
    arrival: [['welcome', 'wave']],
    together: [['bench', 'build'], ['supplies', 'carry'], ['garden', 'dig']],
    plant: [['garden', 'dig'], ['irrigation', 'carry'], ['garden', 'water']],
    sprout: [['garden', 'water'], ['bench', 'inspect'], ['camp', 'rest']],
    bloom: [['garden', 'inspect'], ['camp', 'rest'], ['irrigation', 'carry'], ['garden', 'water']],
    rest: [['camp', 'sit'], ['garden', 'look']],
  };
  return (routines[phase] || routines.explore).map(([station, action]) => ({ station, action }));
}
