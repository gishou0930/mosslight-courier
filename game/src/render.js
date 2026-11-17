import { HEIGHT, MOON_BLOOM, POLLEN_GOAL, WIDTH } from './config.js';
import { createRandom } from './random.js';

function drawBackground(ctx, stars, time) {
  const night = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  night.addColorStop(0, '#0b1d22');
  night.addColorStop(.54, '#102b2a');
  night.addColorStop(1, '#132c28');
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const clearing = ctx.createRadialGradient(482, 296, 52, 482, 296, 505);
  clearing.addColorStop(0, 'rgba(44, 96, 70, .35)');
  clearing.addColorStop(.66, 'rgba(24, 64, 54, .17)');
  clearing.addColorStop(1, 'rgba(7, 21, 25, .5)');
  ctx.fillStyle = clearing;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const star of stars) {
    const twinkle = .24 + (Math.sin(time * .8 + star.phase) + 1) * .16;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = star.warm ? '#f3db9d' : '#c8e9cf';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.strokeStyle = 'rgba(137, 190, 142, .065)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 7; row += 1) {
    const y = 104 + row * 65;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(row) * 18);
    ctx.bezierCurveTo(180, y - 40, 280, y + 48, 478, y + 8);
    ctx.bezierCurveTo(660, y - 24, 810, y + 43, WIDTH, y - 12);
    ctx.stroke();
  }
  ctx.restore();

  drawEdgeLeaves(ctx);
  const haze = ctx.createRadialGradient(489, 306, 120, 490, 300, 455);
  haze.addColorStop(0, 'rgba(0, 0, 0, 0)');
  haze.addColorStop(1, 'rgba(2, 10, 14, .3)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawEdgeLeaves(ctx) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let side = 0; side < 2; side += 1) {
    ctx.save();
    if (side === 1) {
      ctx.translate(WIDTH, HEIGHT);
      ctx.rotate(Math.PI);
    }
    ctx.strokeStyle = 'rgba(78, 139, 93, .3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 575);
    ctx.bezierCurveTo(78, 474, 18, 348, 91, 250);
    ctx.bezierCurveTo(135, 189, 86, 85, 164, 15);
    ctx.stroke();
    for (let index = 0; index < 9; index += 1) {
      const x = 25 + (index % 3) * 24;
      const y = 522 - index * 57;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-.58 + index * .12);
      ctx.fillStyle = 'rgba(88, 151, 99, ' + (.2 + (index % 3) * .035) + ')';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(165, 207, 143, .16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawThread(ctx, open) {
  ctx.save();
  ctx.setLineDash([3, 10]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = open ? 'rgba(243, 213, 144, .35)' : 'rgba(193, 207, 151, .12)';
  ctx.beginPath();
  ctx.moveTo(119, 300);
  ctx.bezierCurveTo(333, 262, 470, 345, 648, 288);
  ctx.bezierCurveTo(744, 257, 809, 285, MOON_BLOOM.x, MOON_BLOOM.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawPollen(ctx, bloom, time) {
  if (bloom.taken) return;
  const float = Math.sin(time * 2 + bloom.index * 1.7) * 3;
  ctx.save();
  ctx.translate(bloom.x, bloom.y + float);
  ctx.globalAlpha = .22;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(0, 0, 20 + Math.sin(time * 2.4 + bloom.index) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  for (let petal = 0; petal < 5; petal += 1) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * petal) / 5 + time * .12);
    ctx.fillStyle = 'rgba(255, 222, 140, .87)';
    ctx.beginPath();
    ctx.ellipse(0, -7, 3.1, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#fff1bb';
  ctx.shadowColor = '#ffd978';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, 3.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMoonBloom(ctx, open, time) {
  const pulse = Math.sin(time * 1.6) * 2;
  ctx.save();
  ctx.translate(MOON_BLOOM.x, MOON_BLOOM.y);
  ctx.globalAlpha = open ? .3 : .12;
  ctx.fillStyle = open ? '#ffe49e' : '#9ebc91';
  ctx.beginPath();
  ctx.arc(0, 0, open ? 47 + pulse : 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = open ? 1 : .55;
  for (let petal = 0; petal < 12; petal += 1) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * petal) / 12 + time * .08);
    ctx.fillStyle = open ? '#f7d88e' : '#a5c28f';
    ctx.beginPath();
    ctx.ellipse(0, -19 - pulse * .3, 8, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = open ? '#fff0bb' : '#d3dfae';
  ctx.shadowColor = open ? '#ffe99d' : '#b6d9a1';
  ctx.shadowBlur = open ? 19 : 9;
  ctx.beginPath();
  ctx.arc(0, 0, 10 + pulse * .2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = open ? 'rgba(255, 239, 177, .8)' : 'rgba(204, 220, 175, .4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 31 + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawThorn(ctx, thorn, time) {
  const throb = Math.sin(time * 4 + thorn.index) * 2;
  ctx.save();
  ctx.translate(thorn.px, thorn.py);
  ctx.rotate(time * (thorn.index % 2 ? -.42 : .34) + thorn.index);
  ctx.strokeStyle = 'rgba(246, 151, 157, .31)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, thorn.radius + 9 + throb, 0, Math.PI * 2);
  ctx.stroke();
  for (let point = 0; point < 8; point += 1) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * point) / 8);
    ctx.fillStyle = point % 2 ? '#682f48' : '#8a4052';
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-3, -thorn.radius - 10);
    ctx.lineTo(3, -thorn.radius - 15);
    ctx.lineTo(6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const core = ctx.createRadialGradient(-5, -6, 1, 0, 0, thorn.radius + 2);
  core.addColorStop(0, '#d77c87');
  core.addColorStop(.5, '#9d4c63');
  core.addColorStop(1, '#4b2a43');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, thorn.radius + throb * .4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 204, 173, .9)';
  ctx.beginPath();
  ctx.arc(-4, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMoth(ctx, player, time) {
  for (let index = player.trail.length - 1; index >= 0; index -= 2) {
    const point = player.trail[index];
    const alpha = .13 * (1 - index / player.trail.length);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#b9ed9a';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2 + (1 - index / player.trail.length) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (player.invulnerable > 0 && Math.floor(time * 15) % 2 === 0) return;

  const flap = Math.sin(time * 18) * .42;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.facing);
  ctx.shadowColor = '#c8f3a3';
  ctx.shadowBlur = player.dashTimer > 0 ? 24 : 14;

  ctx.globalAlpha = .82;
  ctx.fillStyle = '#c5e9c5';
  ctx.beginPath();
  ctx.ellipse(-2, -8, 10, 6 + flap * 3, -.25, 0, Math.PI * 2);
  ctx.ellipse(-2, 8, 10, 6 - flap * 3, .25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#d6d68c';
  ctx.beginPath();
  ctx.ellipse(2, 0, 10, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5edc0';
  ctx.beginPath();
  ctx.arc(9, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(242, 235, 191, .8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, -2);
  ctx.quadraticCurveTo(15, -10, 19, -8);
  ctx.moveTo(10, 2);
  ctx.quadraticCurveTo(15, 10, 19, 8);
  ctx.stroke();
  ctx.restore();
}

function drawMotes(ctx, motes) {
  for (const mote of motes) {
    ctx.globalAlpha = Math.max(0, mote.life / mote.maxLife);
    ctx.fillStyle = mote.color;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function createRenderer(canvas, seed = 1) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const random = createRandom(seed);
  const stars = Array.from({ length: 108 }, () => ({
    x: random() * WIDTH,
    y: random() * HEIGHT,
    radius: .35 + random() * 1.1,
    phase: random() * Math.PI * 2,
    warm: random() > .72,
  }));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = WIDTH * ratio;
  canvas.height = HEIGHT * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return {
    draw(world, visualTime) {
      const time = reducedMotion ? 0 : visualTime;
      drawBackground(ctx, stars, time);
      drawThread(ctx, world.pollenCount >= POLLEN_GOAL);
      drawMoonBloom(ctx, world.pollenCount >= POLLEN_GOAL, time);
      for (const bloom of world.pollen) drawPollen(ctx, bloom, time);
      for (const thorn of world.thorns) drawThorn(ctx, thorn, time);
      drawMotes(ctx, world.motes);
      drawMoth(ctx, world.player, time);
      if (world.mode === 'ready') {
        ctx.globalAlpha = .5;
        ctx.fillStyle = '#fff1bf';
        ctx.beginPath();
        ctx.arc(119, 300, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    },
  };
}
