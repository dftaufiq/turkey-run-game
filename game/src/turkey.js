// The turkey: physics (run, jump, slide, dash) and all of its drawing.
// Hitbox is forgiving: inset from the drawn sprite so near-misses feel fair.
import { GROUND_Y, PLAYER } from './config.js';

export function createTurkey() {
  const state = {
    y: GROUND_Y - PLAYER.height, // top edge
    vy: 0,
    onGround: true,
    sliding: false,
    dashTime: 0,
    dashCooldown: 0,
    runCycle: 0,
    invulnerable: 0,
    squash: 0,
  };

  function height() {
    return state.sliding && state.onGround ? PLAYER.slideHeight : PLAYER.height;
  }

  function box() {
    const h = height();
    // The box follows the turkey's real vertical position: state.y is the
    // sprite's top edge, so a jump lifts the box off the ground with it.
    // Sliding shortens the box from the top (the turkey ducks, feet stay put).
    return {
      x: PLAYER.x + 10,
      y: state.y + (PLAYER.height - h) + 6,
      width: PLAYER.width - 20,
      height: h - 6,
    };
  }

  return {
    state,
    reset() {
      state.y = GROUND_Y - PLAYER.height;
      state.vy = 0;
      state.onGround = true;
      state.sliding = false;
      state.dashTime = 0;
      state.dashCooldown = 0;
      state.runCycle = 0;
      state.invulnerable = 0;
      state.squash = 0;
    },
    // Returns 'jump' | 'dash' | null for sound effects.
    update(dt, input, speed) {
      let event = null;
      state.runCycle += dt * (speed / 28);
      if (state.invulnerable > 0) state.invulnerable -= dt;
      if (state.dashCooldown > 0) state.dashCooldown -= dt;
      if (state.squash > 0) state.squash -= dt * 4;

      // Sliding engages on the ground — and in the last few pixels before
      // landing, so a slide queued for a hanger behind a jump starts the
      // instant the turkey touches down instead of one frame too late.
      const aboutToLand = state.y >= GROUND_Y - PLAYER.height - 6;
      state.sliding = input.sliding && (state.onGround || aboutToLand);

      if (input.jumpHeld && state.onGround && !state.sliding) {
        // Variable jump height: holding jump a little longer lifts a little more.
        state.vy = PLAYER.jumpVelocity;
        state.onGround = false;
        state.squash = 0.25;
        event = 'jump';
      }
      if (!state.onGround) {
        state.vy += PLAYER.gravity * dt;
        // Short-hop: releasing jump early cuts the rise — but never below a
        // hop that still clears a fence (vy -620 -> ~77 px), so a quick tap
        // is always a real jump, and holding gives the full 148 px.
        if (!input.jumpHeld && state.vy < -620) state.vy = -620;
        state.y += state.vy * dt;
        if (state.y >= GROUND_Y - PLAYER.height) {
          state.y = GROUND_Y - PLAYER.height;
          state.vy = 0;
          state.onGround = true;
          state.squash = 0.3;
        }
      }
      if (state.dashTime > 0) state.dashTime -= dt;
      return event;
    },
    tryDash() {
      if (state.dashCooldown <= 0 && state.dashTime <= 0) {
        state.dashTime = PLAYER.dashTime;
        state.dashCooldown = PLAYER.dashCooldown;
        return true;
      }
      return false;
    },
    get dashing() {
      return state.dashTime > 0;
    },
    get box() {
      return box();
    },
    get height() {
      return height();
    },
  };
}

// Draw the turkey at its logical x, facing right. `t` is seconds for animation.
export function drawTurkey(ctx, turkey, t) {
  const s = turkey.state;
  const x = PLAYER.x + PLAYER.width / 2;
  const groundY = GROUND_Y;
  const squash = s.squash > 0 ? 1 - s.squash * 0.25 : 1;
  const stretch = s.onGround ? 1 : 1.12;
  const blink = s.invulnerable > 0 && Math.floor(t * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;

  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(1, squash * stretch);

  const legSwing = s.onGround ? Math.sin(s.runCycle * 2) * 14 : 10;
  const sliding = s.sliding && s.onGround;

  if (sliding) {
    // Low slide: body flattened, legs tucked, tail up.
    ctx.translate(0, -PLAYER.slideHeight / 2);
    drawBody(ctx, 0, 0, 1.25, 0.62, t);
    drawHead(ctx, 30, -18, t, true);
  } else {
    // Legs (two, alternating while running; tucked while airborne).
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const legY = s.onGround ? -6 : -2;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(-8 + legSwing, legY);
    ctx.moveTo(8, -14);
    ctx.lineTo(8 - legSwing, legY);
    ctx.stroke();
    // Tail feather fan behind the body.
    drawTail(ctx, -30, -58, t);
    drawBody(ctx, 0, -44, 1, 1, t);
    // Wing, flapping gently; tucked flat while dashing.
    const flap = s.dashTime > 0 ? -0.9 : Math.sin(s.runCycle * 2) * 0.25;
    ctx.save();
    ctx.translate(-2, -48);
    ctx.rotate(flap);
    ctx.fillStyle = '#a8642a';
    ctx.beginPath();
    ctx.ellipse(-6, 6, 20, 11, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawHead(ctx, 26, -82, t, false);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawBody(ctx, x, y, sx, sy, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  // Plump brown body with a lighter belly and feather scallops.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a4b';
  ctx.beginPath();
  ctx.ellipse(6, 8, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8642a';
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.arc(-14 + i * 14, 14, 7, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawTail(ctx, x, y, t) {
  const wag = Math.sin(t * 6) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wag);
  const colors = ['#b5651d', '#d2691e', '#8b4513', '#cd853f', '#a0522d'];
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + (i - 2) * 0.34;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.ellipse(0, -30, 9, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(0, -52, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawHead(ctx, x, y, t, sliding) {
  ctx.save();
  ctx.translate(x, y);
  // Neck and head.
  ctx.fillStyle = '#c98a4b';
  ctx.fillRect(-6, -2, 12, 16);
  ctx.fillStyle = '#d2691e';
  ctx.beginPath();
  ctx.arc(0, -8, 12, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f7b731';
  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.lineTo(24, -5);
  ctx.lineTo(10, -1);
  ctx.closePath();
  ctx.fill();
  // Wattle (the red dangle) and snood.
  ctx.fillStyle = '#d63031';
  ctx.beginPath();
  ctx.ellipse(12, 2, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e17055';
  ctx.beginPath();
  ctx.arc(2, -18, 3, 0, Math.PI * 2);
  ctx.fill();
  // Eye, wide with panic.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(3, -11, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(4, -11, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
