// Screenshot scenes behind ?shot=start|play|kitchen|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (jump the next jumpable danger, slide under hangers),
// so every frame is what a short game really looks like and the same seed
// always gives the same frame.
import { GROUND_Y, STEP } from './config.js';
import { KIND } from './obstacles.js';
import { PHASE } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 15;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** The autopilot's move: jump, slide, or run on. Holds a jump for a few
 * steps so the turkey gets a full-height leap, not a tap-hop. */
export function createAutopilot() {
  let jumpHold = 0;
  return function autopilot(world) {
    const box = world.turkey.box;
    let nearest = null;
    let nearestX = Infinity;
    let second = null;
    let secondX = Infinity;
    for (const item of world.obstacles.items) {
      if (!item.active) continue;
      if (item.kind === KIND.CORN || item.kind === KIND.FEATHER || item.kind === KIND.DRUMSTICK) continue;
      const dx = item.x - (box.x + box.width);
      // Track an item until it is fully past the turkey (dx > -80): a knife
      // still overlaps the turkey's front at dx -15, and dropping it from
      // the nearest list there makes the turkey stand up into the blade.
      if (dx > -80 && dx < nearestX) {
        second = nearest;
        secondX = nearestX;
        nearestX = dx;
        nearest = item;
      } else if (dx > -80 && dx < secondX) {
        secondX = dx;
        second = item;
      }
    }
    if (jumpHold > 0) {
      jumpHold -= 1;
      return { jumpHeld: true, sliding: false };
    }
    if (!nearest) return { jumpHeld: false, sliding: false };
    const isHanger = nearest.kind === KIND.KNIFE || nearest.kind === KIND.POT;
    const isPuddle = nearest.kind === KIND.PUDDLE;
    // A hanger right behind the jumpable in front: queue the slide now so
    // it engages the instant the turkey lands from the jump.
    const hangerBehind = second && (second.kind === KIND.KNIFE || second.kind === KIND.POT) && secondX < 330;
    if (isHanger) return { jumpHeld: false, sliding: nearestX < 150 };
    if (isPuddle) return { jumpHeld: nearestX < 120, sliding: false };
    // Jumpables: jump late enough that the turkey is near its apex (t≈0.34 s
    // after take-off) while the obstacle passes under it — jumping early
    // means landing on a wide obstacle on the way down. The far edge of a
    // 72 px hay bale must clear before the arc drops under 62 px, so the
    // lead stays tight and grows only gently with speed.
    const lead = Math.max(80, world.state.speed * 0.4 - 45);
    if (nearestX < lead && world.turkey.state.onGround) {
      jumpHold = 10;
      // The jump itself takes priority over the queued slide: the slide is
      // (re-)queued on the very next calls, while the turkey is airborne,
      // and engages on landing.
      return { jumpHeld: true, sliding: false };
    }
    return { jumpHeld: false, sliding: Boolean(hangerBehind) };
  };
}

function simulate(world, seconds, dashEvery) {
  const steps = Math.floor(seconds / STEP);
  const autopilot = createAutopilot();
  let dashTimer = 0;
  for (let i = 0; i < steps; i += 1) {
    dashTimer += STEP;
    const input = autopilot(world);
    const dash = dashEvery && dashTimer > dashEvery ? (dashTimer = 0, true) : false;
    const events = world.step(STEP, input, dash);
    if (events.includes('caught')) break;
    if (events.includes('escaped')) break;
  }
}

// Like simulate, but runs until the turkey reaches `target` metres (the
// kitchen starts at 600 m) instead of for a fixed time.
function simulateToDistance(world, target, dashEvery, maxSeconds) {
  const steps = Math.floor(maxSeconds / STEP);
  const autopilot = createAutopilot();
  let dashTimer = 0;
  for (let i = 0; i < steps; i += 1) {
    if (world.state.distance >= target) break;
    dashTimer += STEP;
    const input = autopilot(world);
    const dash = dashEvery && dashTimer > dashEvery ? (dashTimer = 0, true) : false;
    const events = world.step(STEP, input, dash);
    if (events.includes('caught')) break;
    if (events.includes('escaped')) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Any other name stages the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, { jumpHeld: false, sliding: false }, false);
    return { screen: SCREEN_TITLE, best: 1250 };
  }
  world.start();
  if (name === 'play') {
    simulate(world, PLAY_SECONDS, 9);
    return { screen: SCREEN_PLAY, best: Math.max(1250, world.state.score) };
  }
  if (name === 'kitchen') {
    // Run until the turkey is just inside the kitchen (600 m+). Seed 5's
    // pilot gets there with one life left; stopping at 610 m frames the
    // kitchen in play, before the pilot's luck runs out past 630 m.
    simulateToDistance(world, 610, 9, 120);
    return { screen: world.state.phase === PHASE.CAUGHT ? SCREEN_OVER : SCREEN_PLAY, best: Math.max(1250, world.state.score) };
  }
  // End: run until escaped (or caught, then force the escape screen from a
  // long, high-scoring run so the frame shows the win state). A forced win
  // is staged as a live turkey: at least one life left and the farmer a
  // healthy distance behind, as a real escape would show.
  simulate(world, END_LIMIT_SECONDS, 8);
  if (world.state.phase !== PHASE.ESCAPED) {
    world.state.distance = 900;
    world.state.score = world.state.score + 250;
    world.state.phase = PHASE.ESCAPED;
    world.state.stageIndex = 2;
    world.state.lives = Math.max(world.state.lives, 2);
    world.state.gap = Math.max(world.state.gap, 60);
  }
  return { screen: SCREEN_OVER, best: Math.max(1250, world.state.score) };
}
