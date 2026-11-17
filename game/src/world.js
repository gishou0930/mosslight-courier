import { FLIGHT_SECONDS, HEIGHT, MOON_BLOOM, PLAYER_START, POLLEN_GOAL, WIDTH } from './config.js';

const pollenPlaces = [
  [228, 142], [328, 300], [427, 468], [515, 170],
  [594, 364], [674, 126], [735, 476], [793, 262],
];

const thornPaths = [
  { x: 365, y: 166, rx: 78, ry: 42, phase: .2, speed: 1.18, radius: 22 },
  { x: 544, y: 429, rx: 88, ry: 40, phase: 2.6, speed: -1.05, radius: 24 },
  { x: 716, y: 214, rx: 42, ry: 88, phase: 4.1, speed: 1.23, radius: 21 },
];

export function createWorld() {
  return {
    elapsed: 0,
    timeLeft: FLIGHT_SECONDS,
    score: 0,
    pollenCount: 0,
    health: 3,
    chain: 0,
    chainTimer: 0,
    mode: 'ready',
    player: {
      x: PLAYER_START.x, y: PLAYER_START.y, vx: 0, vy: 0,
      facing: 0, dashTimer: 0, dashCooldown: 0, invulnerable: 0,
      trail: [],
    },
    pollen: pollenPlaces.map(([x, y], index) => ({ x, y, index, taken: false })),
    thorns: thornPaths.map((thorn, index) => ({ ...thorn, index, angle: thorn.phase, px: thorn.x, py: thorn.y })),
    motes: [],
  };
}

function burst(world, x, y, color, count = 10) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + world.elapsed * .8;
    const speed = 42 + (index % 4) * 17;
    world.motes.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: .48 + (index % 3) * .12, maxLife: .6, color,
    });
  }
}

export function stepWorld(world, controls, dt) {
  if (world.mode !== 'playing') return [];
  const events = [];
  const player = world.player;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, world.timeLeft - dt);
  world.chainTimer = Math.max(0, world.chainTimer - dt);
  if (world.chainTimer === 0) world.chain = 0;

  for (const thorn of world.thorns) {
    thorn.angle += thorn.speed * dt;
    thorn.px = thorn.x + Math.cos(thorn.angle) * thorn.rx;
    thorn.py = thorn.y + Math.sin(thorn.angle * .86) * thorn.ry;
  }

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashTimer = Math.max(0, player.dashTimer - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);

  const inputLength = Math.hypot(controls.x, controls.y);
  if (inputLength > .01) player.facing = Math.atan2(controls.y, controls.x);

  if (controls.dashPressed && player.dashCooldown === 0) {
    let dashX = controls.x;
    let dashY = controls.y;
    if (Math.hypot(dashX, dashY) < .01) {
      dashX = Math.cos(player.facing);
      dashY = Math.sin(player.facing);
    }
    player.vx = dashX * 560;
    player.vy = dashY * 560;
    player.dashTimer = .2;
    player.dashCooldown = 2.15;
    burst(world, player.x, player.y, '#c4f2a0', 8);
    events.push({ type: 'dash' });
  }

  if (player.dashTimer <= 0) {
    player.vx += controls.x * 690 * dt;
    player.vy += controls.y * 690 * dt;
    const drag = Math.exp(-4.5 * dt);
    player.vx *= drag;
    player.vy *= drag;
    const speed = Math.hypot(player.vx, player.vy);
    const maxSpeed = 248;
    if (speed > maxSpeed) {
      player.vx = (player.vx / speed) * maxSpeed;
      player.vy = (player.vy / speed) * maxSpeed;
    }
  }

  player.x = Math.max(26, Math.min(WIDTH - 26, player.x + player.vx * dt));
  player.y = Math.max(42, Math.min(HEIGHT - 31, player.y + player.vy * dt));
  player.trail.unshift({ x: player.x, y: player.y });
  if (player.trail.length > 16) player.trail.pop();

  if (player.invulnerable === 0 && player.dashTimer === 0) {
    for (const thorn of world.thorns) {
      if (Math.hypot(player.x - thorn.px, player.y - thorn.py) < thorn.radius + 13) {
        world.health -= 1;
        world.score = Math.max(0, world.score - 50);
        player.invulnerable = 1.2;
        const angle = Math.atan2(player.y - thorn.py, player.x - thorn.px);
        player.vx = Math.cos(angle) * 190;
        player.vy = Math.sin(angle) * 190;
        burst(world, player.x, player.y, '#ff9d9d', 12);
        events.push({ type: 'hurt', health: world.health });
        break;
      }
    }
  }

  for (const bloom of world.pollen) {
    if (bloom.taken || Math.hypot(player.x - bloom.x, player.y - bloom.y) > 23) continue;
    bloom.taken = true;
    world.pollenCount += 1;
    world.chain += 1;
    world.chainTimer = 3.2;
    const gained = 100 + Math.max(0, world.chain - 1) * 25;
    world.score += gained;
    burst(world, bloom.x, bloom.y, '#ffe7a3', 11);
    events.push({ type: 'pollen', count: world.pollenCount, gained, chain: world.chain });
  }

  for (const mote of world.motes) {
    mote.x += mote.vx * dt;
    mote.y += mote.vy * dt;
    mote.vx *= Math.exp(-2.2 * dt);
    mote.vy *= Math.exp(-2.2 * dt);
    mote.life -= dt;
  }
  world.motes = world.motes.filter((mote) => mote.life > 0);

  if (world.health <= 0 || world.timeLeft <= 0) {
    world.mode = 'lost';
    events.push({ type: 'lost' });
  } else if (world.pollenCount >= POLLEN_GOAL && Math.hypot(player.x - MOON_BLOOM.x, player.y - MOON_BLOOM.y) < 47) {
    world.mode = 'won';
    world.score += Math.ceil(world.timeLeft) * 12;
    burst(world, MOON_BLOOM.x, MOON_BLOOM.y, '#fbe4a0', 28);
    events.push({ type: 'won' });
  }
  return events;
}
