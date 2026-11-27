// The world: run state, distance, score, lives, the farmer gap, stage
// progression, particles, and the win/lose conditions. Knows nothing about
// the canvas; the renderer reads this state.
import { ESCAPE_DISTANCE, FARMER, STAGES, WORLD } from './config.js';
import { createRandom } from './random.js';
import { createTurkey } from './turkey.js';
import { createFarmer } from './farmer.js';
import { createObstacles, KIND } from './obstacles.js';

export const PHASE = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  CAUGHT: 'caught',
  ESCAPED: 'escaped',
};

export function createWorld(seed) {
  const random = createRandom(seed);
  const turkey = createTurkey();
  const farmer = createFarmer();
  const obstacles = createObstacles(random);

  const state = {
    phase: PHASE.TITLE,
    distance: 0, // metres
    scroll: 0, // px scrolled (drives the background)
    score: 0,
    best: 0,
    lives: WORLD.lives,
    gap: FARMER.startGap,
    stageIndex: 0,
    stageBanner: 0, // seconds left showing the stage name
    speed: 0,
    shake: 0,
    flash: 0,
    time: 0,
    particles: [],
    events: [],
  };

  function speedFor(distance) {
    return Math.min(540, 320 + distance * WORLD.speedPerMetre);
  }

  function stageFor(distance) {
    if (distance < STAGES[0].until) return 0;
    if (distance < STAGES[1].until) return 1;
    return 2;
  }

  function burst(x, y, color, count, power) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (random.next() - 0.5) * power,
        vy: -random.next() * power * 0.8,
        life: 0.5 + random.next() * 0.5,
        max: 1,
        size: 3 + random.next() * 5,
        color,
        gravity: 500,
      });
    }
  }

  function dust() {
    // Cosmetic only, and deliberately unseeded: dust must never consume the
    // seeded stream, or the obstacle pattern would change between runs.
    state.particles.push({
      x: 210 + (Math.random() - 0.5) * 16,
      y: 616,
      vx: -40 - Math.random() * 40,
      vy: -20 - Math.random() * 30,
      life: 0.4,
      max: 0.4,
      size: 4 + Math.random() * 4,
      color: '#d8cbb0',
      gravity: -40,
    });
  }

  const world = {
    state,
    turkey,
    farmer,
    obstacles,
    reset() {
      state.phase = PHASE.TITLE;
      state.distance = 0;
      state.scroll = 0;
      state.score = 0;
      state.pickupScore = 0;
      state.lives = WORLD.lives;
      state.gap = FARMER.startGap;
      state.stageIndex = 0;
      state.stageBanner = 0;
      state.speed = 0;
      state.shake = 0;
      state.flash = 0;
      state.time = 0;
      state.particles = [];
      state.events = [];
      turkey.reset();
      farmer.reset();
      obstacles.reset();
    },
    start() {
      world.reset();
      state.phase = PHASE.PLAY;
      state.stageBanner = 2.2;
    },
    // One fixed step. `input` is { jumpHeld, sliding }; `sfx` names the
    // sound the caller should play ('jump' | 'dash' | null). Returns events
    // the caller turns into sounds/announcements.
    step(dt, input, dashPressed) {
      state.events = [];
      state.time += dt;
      if (state.phase === PHASE.TITLE) {
        // Title demo: the turkey jogs in place, the farmer paces behind.
        turkey.state.runCycle += dt * 8;
        farmer.update(dt, 200, state.gap);
        state.scroll += 40 * dt;
        return state.events;
      }
      if (state.phase !== PHASE.PLAY) {
        for (const p of state.particles) {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += p.gravity * dt;
        }
        state.particles = state.particles.filter((p) => p.life > 0);
        if (state.shake > 0) state.shake -= dt * 2;
        return state.events;
      }

      // Speed, distance, score.
      let speed = speedFor(state.distance);
      if (turkey.dashing) speed += 260;
      state.speed = speed;
      const metres = (speed * dt) / 40;
      state.distance += metres;
      state.scroll += speed * dt;
      state.score = Math.floor(state.distance) + state.pickupScore;

      // Stage transitions.
      const stage = stageFor(state.distance);
      if (stage !== state.stageIndex) {
        state.stageIndex = stage;
        state.stageBanner = 2.4;
        state.pickupScore += WORLD.stageBonus; // score is distance + pickupScore, recomputed each step
        state.events.push('stage');
      }
      if (state.stageBanner > 0) state.stageBanner -= dt;

      // Turkey + dash.
      if (dashPressed && turkey.tryDash()) state.events.push('dash');
      const jumpEvent = turkey.update(dt, input, speed);
      if (jumpEvent) state.events.push(jumpEvent);
      if (turkey.state.invulnerable > 0) turkey.state.invulnerable -= dt;
      if (turkey.state.onGround && Math.random() < 0.3) dust();

      // Farmer gap: clean running widens it; stumbles close it.
      state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.cleanRecovery * dt);
      farmer.update(dt, speed, state.gap);

      // Obstacles.
      obstacles.update(dt, speed, state.distance);
      const box = turkey.box;
      const hit = obstacles.collide(box, turkey.state.sliding);
      if (hit === 'hit' && turkey.state.invulnerable <= 0 && !turkey.dashing) {
        state.lives -= 1;
        state.gap = Math.max(0, state.gap - FARMER.hitPenalty);
        turkey.state.invulnerable = 1.3;
        state.shake = 0.7;
        state.flash = 0.25;
        farmer.state.stumble = 0.4;
        burst(box.x + box.width / 2, box.y + 10, '#e67e22', 18, 320);
        burst(box.x + box.width / 2, box.y + 10, '#ffffff', 8, 200);
        state.events.push('hit');
        if (state.lives <= 0 || state.gap <= 0) {
          state.phase = PHASE.CAUGHT;
          state.events.push('caught');
        }
      } else if (hit === 'puddle') {
        state.gap = Math.max(0, state.gap - FARMER.puddlePenalty);
        state.events.push('splash');
        if (state.gap <= 0) {
          state.phase = PHASE.CAUGHT;
          state.events.push('caught');
        }
      } else if (hit === KIND.CORN) {
        state.pickupScore += 50;
        state.events.push('pickup');
        burst(box.x + box.width, box.y, '#f7dc6f', 8, 160);
      } else if (hit === KIND.FEATHER) {
        state.pickupScore += 25;
        state.events.push('pickup');
        burst(box.x + box.width, box.y, '#e67e22', 6, 140);
      } else if (hit === KIND.DRUMSTICK) {
        state.pickupScore += 200;
        state.events.push('drumstick');
        burst(box.x + box.width, box.y, '#f39c12', 14, 220);
      }

      // Particles.
      for (const p of state.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
      }
      state.particles = state.particles.filter((p) => p.life > 0);
      if (state.shake > 0) state.shake -= dt * 2;
      if (state.flash > 0) state.flash -= dt;

      // Escape!
      if (state.distance >= ESCAPE_DISTANCE) {
        state.phase = PHASE.ESCAPED;
        state.events.push('escaped');
        for (let i = 0; i < 5; i += 1) {
          burst(300 + i * 180, 200 + (i % 2) * 120, ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#f368e0'][i], 22, 380);
        }
      }
      return state.events;
    },
  };

  // Pickup points live beside the distance score so stage bonuses add cleanly.
  state.pickupScore = 0;
  return world;
}
