import { POLLEN_GOAL, STEP } from './config.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createWorld, stepWorld } from './world.js';

const canvas = document.querySelector('#game');
const statusLine = document.querySelector('#status');
const hud = document.querySelector('#hud');
const veil = document.querySelector('#veil');
const dialogKicker = document.querySelector('#dialog-kicker');
const dialogTitle = document.querySelector('#dialog-title');
const dialogCopy = document.querySelector('#dialog-copy');
const dialogNote = document.querySelector('#dialog-note');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const goalRibbon = document.querySelector('#goal-ribbon');
const goalNote = document.querySelector('#goal-note');
const bestLabel = document.querySelector('#best-score');
const pollenLabel = document.querySelector('#pollen-count');
const scoreLabel = document.querySelector('#flight-score');
const timeLabel = document.querySelector('#time-left');
const livesLabel = document.querySelector('#lives');
const pollenPips = [...document.querySelectorAll('#pollen-pips i')];

const seedValue = Number.parseInt(new URLSearchParams(window.location.search).get('seed') ?? '', 10);
const seed = Number.isInteger(seedValue) ? seedValue : 41;
const renderer = createRenderer(canvas, seed);
const input = createInput();
const bestKey = 'mosslight-courier-best';
let world = createWorld();
let screen = 'title';
let best = readBest();
let accumulator = 0;
let visualTime = 0;
let lastFrame = performance.now();
let lastPollenCount = -1;
let lastHealth = -1;

function setText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(bestKey) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(bestKey, String(value));
  } catch {
    // The current visit still shows the new record when browser storage is disabled.
  }
}

function updateHud() {
  setText(pollenLabel, String(world.pollenCount));
  setText(scoreLabel, String(world.score).padStart(4, '0'));
  setText(timeLabel, String(Math.ceil(world.timeLeft)).padStart(2, '0'));
  setText(bestLabel, String(best).padStart(4, '0'));
  if (lastHealth !== world.health) {
    livesLabel.replaceChildren(...Array.from({ length: 3 }, (_, index) => {
      const mark = document.createElement('span');
      mark.textContent = '✦';
      mark.className = index < world.health ? 'life-on' : 'life-off';
      return mark;
    }));
    lastHealth = world.health;
  }
  if (lastPollenCount !== world.pollenCount) {
    for (const [index, pip] of pollenPips.entries()) {
      pip.classList.toggle('filled', index < world.pollenCount);
    }
    lastPollenCount = world.pollenCount;
  }
  const ready = world.pollenCount >= POLLEN_GOAL;
  setText(goalRibbon, ready ? 'MOON BLOOM OPEN · FLY EAST' : 'GATHER 6 · FOLLOW THE GOLDEN THREAD');
  setText(goalNote, ready
    ? 'The moon bloom is awake. Bring the seed to its heart.'
    : 'Six pollen lights open the moon bloom.');
  goalRibbon.hidden = screen !== 'playing' && screen !== 'paused';
  pauseButton.hidden = screen !== 'playing';
  hud.hidden = screen === 'title';
}

function showOverlay(kicker, title, copy, buttonText, note) {
  dialogKicker.textContent = kicker;
  dialogTitle.innerHTML = title;
  dialogCopy.textContent = copy;
  startButton.innerHTML = buttonText + ' <span aria-hidden="true">↗</span>';
  dialogNote.textContent = note;
  veil.hidden = false;
  pauseButton.hidden = true;
}

function beginFlight() {
  world = createWorld();
  world.mode = 'playing';
  screen = 'playing';
  accumulator = 0;
  veil.hidden = true;
  hud.hidden = false;
  pauseButton.hidden = false;
  updateHud();
  statusLine.textContent = 'Flight started. Gather six pollen lights, avoid thorn sprites, then reach the moon bloom.';
  canvas.focus({ preventScroll: true });
}

function finishFlight(result) {
  screen = result;
  accumulator = 0;
  if (world.score > best) {
    best = world.score;
    saveBest(best);
  }
  updateHud();
  if (result === 'won') {
    showOverlay(
      'DELIVERY COMPLETE',
      'The garden<br><em>remembers you.</em>',
      'The moonseed is home. Your careful flight scored ' + world.score + ' points.',
      'Fly again',
      'ENTER or SPACE to start a new delivery',
    );
    statusLine.textContent = 'You delivered the moonseed. Final score ' + world.score + '. Press Enter or Space to fly again.';
  } else {
    const reason = world.health <= 0 ? 'The thorn sprites clipped your wings.' : 'Dawn reached the garden before the delivery.';
    showOverlay(
      'FLIGHT ENDED',
      'The night<br><em>slips away.</em>',
      reason + ' You gathered ' + world.pollenCount + ' of 6 pollen lights and scored ' + world.score + ' points.',
      'Try another flight',
      'ENTER or SPACE to try again',
    );
    statusLine.textContent = 'Flight ended. Score ' + world.score + '. Press Enter or Space to try again.';
  }
}

function pauseFlight() {
  if (screen !== 'playing') return;
  screen = 'paused';
  accumulator = 0;
  showOverlay(
    'QUIET MOMENT',
    'Rest your<br><em>wings.</em>',
    'Your pollen and time are safe. Resume when you are ready.',
    'Resume flight',
    'P or ESC to resume',
  );
  statusLine.textContent = 'Flight paused. Press P, Escape or the button to resume.';
}

function resumeFlight() {
  if (screen !== 'paused') return;
  screen = 'playing';
  veil.hidden = true;
  pauseButton.hidden = false;
  canvas.focus({ preventScroll: true });
  statusLine.textContent = 'Flight resumed.';
}

function reportEvents(events) {
  for (const event of events) {
    if (event.type === 'pollen') {
      const chainText = event.chain > 1 ? ' Chain ' + event.chain + ' for ' + event.gained + ' points.' : ' +' + event.gained + ' points.';
      statusLine.textContent = 'Pollen ' + event.count + ' of 6.' + chainText;
    } else if (event.type === 'hurt') {
      statusLine.textContent = event.health > 0 ? 'A thorn sprite caught you. ' + event.health + ' wingbeats remain.' : 'Your last wingbeat is gone.';
    } else if (event.type === 'dash') {
      statusLine.textContent = 'Dash used. Recharge takes just over two seconds.';
    } else if (event.type === 'won') {
      finishFlight('won');
    } else if (event.type === 'lost') {
      finishFlight('lost');
    }
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min((now - lastFrame) / 1000, .25);
  lastFrame = now;
  visualTime += elapsed;
  const controls = input.read();

  if (screen === 'title' && controls.confirmPressed) beginFlight();
  else if (screen === 'paused' && (controls.pausePressed || controls.confirmPressed)) resumeFlight();
  else if (screen === 'playing' && controls.pausePressed) pauseFlight();

  if (screen === 'playing') {
    accumulator += elapsed;
    while (accumulator >= STEP && screen === 'playing') {
      reportEvents(stepWorld(world, controls, STEP));
      accumulator -= STEP;
    }
    updateHud();
  } else if (screen === 'title' || screen === 'paused') {
    world.player.trail.length = 0;
  }

  renderer.draw(world, visualTime);
}

startButton.addEventListener('click', () => {
  if (screen === 'paused') resumeFlight();
  else beginFlight();
});
pauseButton.addEventListener('click', pauseFlight);
canvas.addEventListener('click', () => {
  if (screen === 'title') beginFlight();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseFlight();
});

showOverlay(
  'A SMALL LIGHT IN THE DARK',
  'Bring the<br><em>moonseed home.</em>',
  'Slip through the moss, gather six drifting pollen lights, and wake the moon bloom. Thorn sprites sting; three wingbeats are all you have.',
  'Begin the flight',
  'WASD / ARROWS to glide · SPACE to dash',
);
bestLabel.textContent = String(best).padStart(4, '0');
updateHud();
requestAnimationFrame(frame);
