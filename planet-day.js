import { DAY, clamp, smooth, beijingSeconds, worldAt, tourTime, groundY, astronautRoutine, chapters } from './planet-time.mjs';
import { plantLayout, campLayout } from './planet-layout.mjs';
import { createActor, advanceActor, actorStops, compileActorTimeline } from './planet-motion.mjs';

const landscape = document.querySelector('.alien-landscape');
const scene = document.querySelector('.planet-scene');
const world = document.querySelector('.daily-world');
const astronaut = document.querySelector('.astronaut-walker');
const figure = document.querySelector('.astronaut-figure');
const facing = document.querySelector('.astronaut-facing');
const dog = document.querySelector('.space-dog');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const preview = document.querySelector('.planet-preview');
const slider = document.querySelector('#planet-time');
const clock = document.querySelector('.planet-clock');
const chapter = document.querySelector('.planet-chapter');
const tourButton = document.querySelector('.planet-tour');
const params = new URLSearchParams(location.search);
preview.hidden = params.get('planetPreview') !== '1';
let mode = 'live', selectedTime = 0, clockStart = performance.now(), visible = false;
let frame = 0, lastFrame = 0, lastWorldKey = '', lastPhase = '', resetActor = true;
let scale = 1, left = 230, right = 920, plantCount = 96;
let human = null, companion = null, dogWasVisible = false;
let stations = campLayout(left, right, scale);
let humanTimeline, dogTimeline;
let stillTime = null, stillPhase = '';

// All artwork shares the existing moon/planet palette and rounded, fine outlines.
world.innerHTML = `
  <g class="outpost" stroke-linecap="round" stroke-linejoin="round">
    <g data-prop="supplies" class="planet-prop">
      <g data-step="0" data-from="-12 0 0"><rect x="-17" y="-14" width="23" height="14" rx="2"/><path d="M-6-14V0M-13-9h4"/></g>
      <g data-step=".55" data-from="9 0 0"><rect x="4" y="-10" width="15" height="10" rx="2"/><path d="M11-10V0"/></g>
    </g>
    <g data-prop="solar" class="planet-prop">
      <g data-step="0" data-from="-6 0 0"><path d="M-18 0h36"/></g>
      <g data-step=".16" data-from="10 11 90" data-pivot="0 -12"><path d="M0 0v-24"/></g>
      <g data-step=".33" data-from="-7 19 -12"><path d="M-14-24h28M-7-24 0-16 7-24"/></g>
      <g data-step=".49" data-from="2 25 -8"><path d="M-27-35h45l10 20h-45Z"/></g>
      <g data-step=".64" data-from="5 30 -7"><path class="panel-fill" d="M-27-35h15l10 20h-15Z"/><path class="panel-grid" d="m-22-25 15 0"/></g>
      <g data-step=".79" data-from="-6 28 5"><path class="panel-fill" d="M-12-35H3l10 20H-2Z"/><path class="panel-grid" d="M-7-25H8"/></g>
      <g data-step=".94" data-from="-11 26 8"><path class="panel-fill" d="M3-35h15l10 20H13Z"/><path class="panel-grid" d="M8-25h15"/></g>
    </g>
    <g data-prop="antenna" class="planet-prop">
      <g data-step="0" data-from="-4 0 0"><path d="M-8 0h16"/></g>
      <g data-step=".24" data-from="7 15 90" data-pivot="0 -16"><path d="M0 0v-33"/></g>
      <g data-step=".5" data-from="8 27 -18"><path class="dish-fill" d="M-14-40Q-12-19 7-25Z"/></g>
      <g data-step=".73" data-from="-8 35 15"><path d="m-5-31 8-8"/><circle cx="4" cy="-40" r="2"/></g>
      <g data-step=".94" data-from="8 13 0"><circle class="signal-dot" cx="0" cy="-16" r="1.6"/></g>
    </g>
    <g data-prop="bench" class="planet-prop">
      <g data-step="0" data-from="5 10 -90" data-pivot="-19 -10"><path d="M-19 0v-20"/></g>
      <g data-step=".18" data-from="-5 10 90" data-pivot="19 -10"><path d="M19 0v-20"/></g>
      <g data-step=".36" data-from="0 6 0"><path d="M-19-8h38"/></g>
      <g data-step=".54" data-from="0 21 0"><rect x="-23" y="-25" width="46" height="5" rx="2"/></g>
      <g data-step=".72" data-from="4 25 -10"><path d="M-10-26v-10h15v10"/><path class="panel-fill" d="M-8-34H3v6H-8Z"/></g>
      <g data-step=".92" data-from="-9 26 0"><path d="M10-27h8m-4-3v6"/></g>
    </g>
    <g data-prop="bed" class="garden-bed">
      <g data-step="0" data-from="0 0 0"><path d="M-48 9q-2-10 48-10"/></g>
      <g data-step=".25" data-from="0 0 0"><path d="M0-1q50 0 50 10"/></g>
      <g data-step=".5" data-from="0 0 0"><path d="M50 9q0 10-50 10t-48-10"/></g>
      <g data-step=".73" data-from="0 0 0"><path d="M-35 6q34-8 70 0"/></g>
      <g data-step=".92" data-from="0 0 0"><path d="M-33 12q33-6 66 0"/></g>
    </g>
    <g data-prop="irrigation" class="planet-prop">
      <g data-step="0" data-from="0 0 0"><path d="M-9 0H9"/></g>
      <g data-step=".22" data-from="11 3 -80" data-pivot="0 -13"><rect x="-8" y="-26" width="16" height="26" rx="5"/></g>
      <g data-step=".45" data-from="-8 20 0"><path d="M-8-20H8M-8-7H8M-4-29h8"/></g>
      <g data-step=".68" data-from="-7 8 0"><path d="M8-10h10V0h13"/></g>
      <g data-step=".91" data-from="-12 10 0"><circle cx="0" cy="-14" r="2"/></g>
    </g>
    <g class="landing-beacon"><path d="M-13 0h26M-9 0v-3m18 3v-3"/><circle class="signal-dot" cx="-9" cy="-4" r="1.5"/><circle class="signal-dot" cx="9" cy="-4" r="1.5"/></g>
  </g>
  <g class="planet-garden"></g>
  <g class="rocket-dust" fill="var(--flora-soft)"><ellipse cx="-15" cy="0" rx="14" ry="3"/><ellipse cx="15" cy="2" rx="19" ry="4"/></g>
  <g class="rocket-position"><g class="little-rocket" stroke-linejoin="round" stroke-linecap="round">
    <path class="rocket-flame" d="M-6-8Q0 17 6-8"/>
    <path class="rocket-fin" d="M-10-24Q-22-19-21 0l12-7m19-17Q22-19 21 0L9-7"/>
    <path class="rocket-shell" d="M-11-10V-42Q-10-62 0-70Q10-62 11-42v32Z"/>
    <path class="rocket-cap" d="M-9-52Q-6-64 0-70Q6-64 9-52Z"/>
    <circle class="rocket-window" cy="-43" r="6"/><g class="rocket-passenger" fill="#d9c7eb"><path d="M-3-43q-4-7-3-2l2 5h7l3-5q1-5-3 2Z"/><circle cy="-42" r="3"/></g><path class="window-glint" d="M-3-46q3-2 5 1"/>
    <path class="rocket-door" d="M-5-12v-17q5-4 10 0v17Z"/>
    <path class="rocket-ramp" d="M-5-12 14 0H5L-5-6Z"/>
    <path class="rocket-band" d="M-11-11h22"/>
  </g></g>`;

dog.innerHTML = `<g class="dog-size"><ellipse cy="2" rx="20" ry="3" fill="#857398" opacity=".13"/><g class="dog-facing">
  <g class="dog-body" stroke="#8e7ca9" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path class="dog-tail" d="M-15-17q-11-2-11-9" fill="none" stroke="#b3a1cd" stroke-width="4"/>
    <g class="dog-leg dog-leg-back"><path d="M-9-13v11h5M11-13v11h5" fill="none" stroke="#b4a3cb" stroke-width="4"/></g>
    <rect x="-16" y="-24" width="31" height="16" rx="8" fill="#eee8f7"/>
    <path d="M-6-24v16" stroke="#b3a0cf" stroke-width="3"/>
    <g class="dog-leg dog-leg-front"><path d="M-12-12v11h5M8-12v11h5" fill="none" stroke="#eee8f7" stroke-width="4"/></g>
    <g class="dog-head"><circle cx="14" cy="-29" r="15" fill="var(--helmet-glass)" stroke="#b8a6d6"/>
      <path d="M5-33q0-8 9-7l6 7 6 2v6q-6 5-15 1Z" fill="#c5b2d9"/>
      <path d="M9-38q-8 1-6 13 7 1 8-7" fill="#9b83b8"/>
      <circle cx="18" cy="-32" r="1.2" fill="#55426e"/><path d="M24-30h3v3h-3Z" fill="#6d5787" stroke="none"/>
      <path d="M10-40q8-4 14 3" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.7"/>
      <path class="dog-tool" d="M24-25h12m-1-3v6" stroke="#9078b3" stroke-width="2.5"/>
    </g>
  </g></g></g>`;

const propNodes = [...world.querySelectorAll('[data-prop]')];
const garden = world.querySelector('.planet-garden');
// Plants are laid out across the visible terrain with whole-silhouette crater avoidance.
const grassShape = '<path d="M0 0Q-9-4-8-12Q-1-10 0 0Q-2-16 3-18Q6-9 0 0Q5-12 10-10Q9-3 0 0Z"/>';
const flowerShape = '<path d="M0 0Q-3-9 0-17M-1-6q-8-7-9-2 1 5 9 4M-1-9q6-6 8-3 0 5-8 5"/><g class="flower-head" transform="translate(0 -17)"><path d="M0-2C-8-11-10 0-3 2-8 10 3 11 3 4 12 8 12-3 5-3 6-11-3-12 0-2Z"/><circle r="2"/></g>';
let plants = [];
function arrangePlants() {
  plants = plantLayout(left, right, scale, plantCount).map(plant => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node.innerHTML = plant.flower ? flowerShape : grassShape;
    node.classList.add(plant.flower ? 'planet-flower' : 'planet-grass');
    return { ...plant, node };
  });
  garden.replaceChildren(...plants.map(plant => plant.node));
}
const rocket = world.querySelector('.rocket-position');
const rocketBody = world.querySelector('.little-rocket');
const dust = world.querySelector('.rocket-dust');
const beacon = world.querySelector('.landing-beacon');
const dogSize = dog.querySelector('.dog-size');
const dogFacing = dog.querySelector('.dog-facing');

function measure() {
  const rect = scene.getBoundingClientRect();
  const previousLeft = left, previousRight = right;
  scale = Math.min(1, 900 / rect.width);
  figure.setAttribute('transform', `scale(${scale})`);
  dogSize.setAttribute('transform', `scale(${scale})`);
  // Fit all important actors into the visible surface, including the cropped mobile SVG.
  const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
  const rail = innerWidth <= 740 ? 56 : Math.max(224, sidebar.width);
  left = clamp((rail + 24 - rect.left) / rect.width * 1000, 40, 700);
  right = clamp((innerWidth - 24 - rect.left) / rect.width * 1000, left + 100, 960);
  plantCount = Math.round(clamp((right - left) * rect.width / 1000 / 11, 30, 96));
  stations = campLayout(left, right, scale);
  compileTimelines();
  for (const actor of [human, companion]) {
    if (actor) {
      actor.x = left + (actor.x - previousLeft) / (previousRight - previousLeft) * (right - left);
      actor.velocity = 0;
      actor.arrived = false;
    }
  }
  arrangePlants();
  lastWorldKey = '';
  paint(performance.now(), 0);
  landscape.dataset.ready = 'true';
}
new ResizeObserver(measure).observe(scene);

function currentTime(now) {
  if (mode === 'live') return beijingSeconds();
  if (mode === 'tour') return tourTime((now - clockStart) / 1000);
  return (selectedTime + (now - clockStart) / 1000) % DAY;
}
function clockText(seconds) {
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, Math.floor(seconds) % 60].map(n => String(n).padStart(2, '0')).join(':');
}
function renderWorld(state) {
  world.style.opacity = state.reset;
  dog.style.opacity = state.dog ? state.reset * smooth((state.seconds - 43214) / 3) : 0;
  for (const node of propNodes) {
    const name = node.dataset.prop;
    const x = stations[name];
    node.setAttribute('transform', `translate(${x} ${groundY(x) + (name === 'bed' ? 7 : 0)}) scale(${scale})`);
    const progress = state[name];
    node.style.visibility = progress > 0 ? 'visible' : 'hidden';
    const parts = [...node.querySelectorAll('[data-step]')];
    parts.forEach((part, index) => {
      const step = Number(part.dataset.step);
      const installed = progress >= step;
      // Only the next component is laid beside the structure; later pieces arrive in order.
      const delivered = name === 'bed' ? installed : index === 0 || progress >= Number(parts[index - 1].dataset.step);
      part.style.visibility = progress > 0 && delivered ? 'visible' : 'hidden';
      const [dx, dy, angle] = (part.dataset.from || '0 0 0').split(' ').map(Number);
      part.style.transformOrigin = (part.dataset.pivot || '0 0').split(' ').map(n => `${n}px`).join(' ');
      part.style.transition = resetActor || reduced.matches ? 'none' : 'transform .8s cubic-bezier(.22,.61,.36,1)';
      part.style.transform = installed ? 'translate(0px, 0px) rotate(0deg)' : `translate(${dx}px, ${dy}px) rotate(${angle}deg)`;
      part.dataset.assembly = installed ? 'installed' : delivered ? 'staged' : 'waiting';
    });
  }
  for (const plant of plants) {
    const growth = smooth((state.growth - plant.birth) / .23);
    plant.node.style.opacity = growth;
    plant.node.setAttribute('transform', `translate(${plant.x} ${plant.y}) scale(${scale * plant.size * (.2 + growth * .8)})`);
  }
  const rx = stations.rocket, ry = groundY(rx);
  beacon.setAttribute('transform', `translate(${rx} ${ry}) scale(${scale})`);
  beacon.style.opacity = state.seconds >= 41400 ? .65 : 0;
  rocket.style.opacity = state.landing < 0 ? 0 : 1;
  const landing = reduced.matches && state.landing >= 0 ? 1 : state.landing;
  const descent = 1 - smooth(landing / .6);
  rocket.setAttribute('transform', `translate(${rx} ${ry - descent * 165}) scale(${scale})`);
  rocketBody.classList.toggle('landed', landing >= .6);
  rocketBody.classList.toggle('door-open', landing >= .7);
  dust.setAttribute('transform', `translate(${rx} ${ry + 1}) scale(${scale * (1 + clamp((landing - .45) * 5))})`);
  dust.style.opacity = landing > .4 && landing < .85 ? Math.sin((landing - .4) / .45 * Math.PI) * .28 : 0;
  if (state.phase !== lastPhase) {
    document.querySelector('#planet-description').textContent = `${state.title}. A small astronaut ${state.dog ? 'and a helmeted dog tend' : 'tends'} a violet planet. The landscape follows a daily cycle in Beijing time.`;
    lastPhase = state.phase;
  }
  if (!preview.hidden) {
    clock.textContent = `${clockText(state.seconds)} · Beijing${mode === 'live' ? ' · live' : ' · preview'}`;
    chapter.textContent = state.title;
    slider.value = Math.floor(state.seconds);
  }
  landscape.dataset.phase = state.phase;
}
function humanRoute(phase) {
  const stops = actorStops(stations, scale);
  // End the day at camp, so the midnight cycle also has a continuous position.
  const routine = phase === 'rest' ? [{ station: 'camp', action: 'sit' }] : astronautRoutine(phase);
  return routine.map(({ station, action }) => ({
    x: stops[station], action, wait: action === 'rest' || action === 'sit' ? 14 : 9,
    travel: action === 'carry' ? 'carry-walk' : 'walk',
  }));
}
function companionRoute(phase) {
  const stops = actorStops(stations, scale);
  if (phase === 'rest') return [{ x: stops.camp + 32 * scale, action: 'sit', wait: 18 }];
  if (phase === 'arrival') return [{ x: stations.rocket - 27 * scale, action: 'sit', wait: 5 }];
  return [
    { x: stops.camp + 35 * scale, action: 'sit', wait: 7 },
    { x: stops.garden + 24 * scale, action: 'sniff', wait: 6, travel: 'run' },
    { x: stops.camp - 30 * scale, action: 'sniff', wait: 5, travel: 'run' },
    { x: stations.bench + 28 * scale, action: 'sit', wait: 3 },
    { x: stops.garden - 20 * scale, action: phase === 'plant' ? 'dig' : 'sniff', wait: 8, travel: 'carry' },
  ];
}
function compileTimelines() {
  const stops = actorStops(stations, scale);
  humanTimeline = compileActorTimeline(chapters.map(([hour, , phase]) => ({ start: hour * 3600, phase })), humanRoute, createActor(stops.camp), () => 22 * scale, 40 * scale);
  const dogChapters = chapters.filter(([hour]) => hour >= 12).map(([hour, , phase]) => ({ start: Math.max(43214, hour * 3600), phase }));
  dogTimeline = compileActorTimeline(dogChapters, companionRoute, createActor(stations.rocket + 5 * scale), goal => (goal.travel === 'run' ? 43 : 32) * scale, 65 * scale);
}
function renderActors(state, dt) {
  const route = humanRoute(state.phase);
  // Live visits seek the same daily motion timeline on every refresh. A selected
  // preview time starts at that exact pose, then lets activity proceed at 1x speed.
  let seconds = state.seconds;
  if (reduced.matches) {
    const phase = `${state.phase}:${state.dog}`;
    if (stillTime === null || resetActor || stillPhase !== phase) { stillTime = seconds; stillPhase = phase; }
    seconds = stillTime;
  }
  if (!humanTimeline) compileTimelines();
  let task;
  if (mode !== 'tour') {
    human = humanTimeline.at(seconds);
    task = human;
  } else {
    // The 60-second overview still uses bounded real-time movement, never fast-forwarded legs.
    if (resetActor || !human) human = { ...humanTimeline.at(state.seconds) };
    task = reduced.matches ? human : advanceActor(human, route, state.phase, dt, 22 * scale, 40 * scale);
  }
  astronaut.style.transform = `translate(${human.x}px, ${groundY(human.x)}px)`;
  facing.setAttribute('transform', `scale(${task.direction} 1)`);
  astronaut.dataset.action = task.action;
  astronaut.style.opacity = state.seconds > DAY - 2 ? .6 + .4 * state.reset : 1;

  let dogTask;
  if (mode !== 'tour') {
    companion = dogTimeline.at(seconds) || createActor(stations.rocket + 5 * scale);
    dogTask = companion.action ? companion : { action: 'sit', direction: -1 };
  } else {
    const arrival = state.phase === 'arrival';
    const dogRoute = companionRoute(state.phase);
    if (resetActor || !companion || (state.dog && !dogWasVisible)) {
      companion = { ...(dogTimeline.at(state.seconds) || createActor(stations.rocket + 5 * scale)) };
      companion.direction = arrival ? -1 : 1;
    }
    dogTask = { action: 'sit', direction: companion.direction };
    if (state.dog && !reduced.matches) {
      const goal = dogRoute[companion.routeIndex % dogRoute.length];
      dogTask = advanceActor(companion, dogRoute, state.phase, dt, (goal.travel === 'run' ? 43 : 32) * scale, 65 * scale);
    }
  }
  dogFacing.setAttribute('transform', `scale(${dogTask.direction} 1)`);
  dog.setAttribute('transform', `translate(${companion.x} ${groundY(companion.x) + 1})`);
  dog.dataset.action = dogTask.action;
  dogWasVisible = state.dog;
  resetActor = false;
}
function paint(now, dt) {
  const state = worldAt(currentTime(now));
  const worldKey = `${Math.floor(state.seconds * (state.phase === 'arrival' || state.seconds > DAY - 2 ? 30 : 2))}:${scale}`;
  if (worldKey !== lastWorldKey) { renderWorld(state); lastWorldKey = worldKey; }
  renderActors(state, dt);
  if (mode === 'tour' && now - clockStart >= 60000) {
    mode = 'preview'; selectedTime = 0; clockStart = now;
    tourButton.textContent = 'Watch a day · 60s';
  }
}
function tick(now) {
  frame = 0;
  if (!visible || document.hidden) return;
  if (now - lastFrame >= 1000 / 30) {
    paint(now, Math.min((now - lastFrame) / 1000, .1));
    lastFrame = now;
  }
  if (!reduced.matches) frame = requestAnimationFrame(tick);
}
function syncVisibility() {
  const active = visible && !document.hidden;
  landscape.dataset.visible = String(active);
  cancelAnimationFrame(frame); frame = 0;
  if (active) {
    lastWorldKey = ''; lastFrame = performance.now();
    paint(lastFrame, 0);
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  }
}
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncVisibility(); }).observe(landscape);
document.addEventListener('visibilitychange', syncVisibility);
reduced.addEventListener('change', syncVisibility);
// A reduced-motion visit updates its still illustration without a frame loop.
setInterval(() => { if (visible && !document.hidden && reduced.matches) paint(performance.now(), 0); }, 1000);

function chooseTime(time, nextMode = 'preview') {
  selectedTime = clamp(time, 0, DAY - 1); mode = nextMode;
  clockStart = performance.now(); resetActor = true; lastWorldKey = '';
  tourButton.textContent = nextMode === 'tour' ? 'Stop preview' : 'Watch a day · 60s';
  paint(clockStart, 0);
}
slider.addEventListener('input', () => chooseTime(Number(slider.value)));
preview.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => chooseTime(Number(button.dataset.time), button.textContent === 'Landing' ? 'event' : 'preview')));
tourButton.addEventListener('click', () => mode === 'tour' ? chooseTime(currentTime(performance.now())) : chooseTime(0, 'tour'));
preview.querySelector('.planet-live').addEventListener('click', () => chooseTime(0, 'live'));
if (!preview.hidden && params.has('time')) {
  const time = Number(params.get('time'));
  if (Number.isFinite(time)) chooseTime(time * 3600);
}
measure();
