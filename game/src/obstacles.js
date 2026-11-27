// Obstacles and pickups: what spawns, how it moves, what it looks like, and
// whether the turkey hit it. Each stage has its own danger set; difficulty
// grows with distance (tighter spacing, mixed pairs, faster pumpkins).
//   jump-over: fence, hay bale, pumpkin, pitchfork, oven, puddle
//   slide-under: hanging carving knife, hanging pot
//   pickups: corn (+50), feather (+25), golden drumstick (+200)
import { GROUND_Y } from './config.js';

export const KIND = {
  FENCE: 'fence',
  HAY: 'hay',
  PUMPKIN: 'pumpkin',
  PITCHFORK: 'pitchfork',
  OVEN: 'oven',
  PUDDLE: 'puddle',
  KNIFE: 'knife',
  POT: 'pot',
  CORN: 'corn',
  FEATHER: 'feather',
  DRUMSTICK: 'drumstick',
};

const JUMPERS = [KIND.FENCE, KIND.HAY, KIND.PUMPKIN, KIND.PITCHFORK, KIND.OVEN, KIND.PUDDLE];
const HANGERS = [KIND.KNIFE, KIND.POT];

function dims(kind) {
  switch (kind) {
    case KIND.FENCE: return { w: 44, h: 62 };
    case KIND.HAY: return { w: 72, h: 62 };
    case KIND.PITCHFORK: return { w: 30, h: 72 };
    case KIND.PUMPKIN: return { w: 54, h: 52 };
    case KIND.OVEN: return { w: 112, h: 98 };
    case KIND.PUDDLE: return { w: 130, h: 16 };
    case KIND.KNIFE: return { w: 26, h: 120 };
    case KIND.POT: return { w: 64, h: 70 };
    case KIND.CORN: return { w: 34, h: 44 };
    case KIND.FEATHER: return { w: 26, h: 34 };
    case KIND.DRUMSTICK: return { w: 40, h: 46 };
    default: return { w: 40, h: 40 };
  }
}

// Dangers per stage: 0 farmyard, 1 barn, 2 kitchen.
const STAGE_DANGERS = [
  [KIND.FENCE, KIND.HAY, KIND.PUMPKIN, KIND.PUDDLE],
  [KIND.FENCE, KIND.HAY, KIND.PITCHFORK, KIND.KNIFE, KIND.PUMPKIN],
  [KIND.OVEN, KIND.KNIFE, KIND.POT, KIND.PITCHFORK, KIND.PUMPKIN],
];

export function createObstacles(random) {
  let items = [];
  let nextSpawnX = 1400;
  let lastKind = null;

  function spawnAt(x, distance) {
    const stage = distance < 300 ? 0 : distance < 600 ? 1 : 2;
    const pool = STAGE_DANGERS[stage];
    let kind = random.pick(pool);
    // Avoid three identical obstacles in a row.
    if (kind === lastKind && random.chance(0.6)) kind = random.pick(pool);
    lastKind = kind;
    const d = dims(kind);
    const item = { kind, x, y: 0, w: d.w, h: d.h, active: true, passed: false, roll: random.next() * Math.PI * 2 };
    if (kind === KIND.KNIFE) item.y = GROUND_Y - 168; // hangs: bottom at 620-48, a standing turkey's head is at 620-72
    else if (kind === KIND.POT) item.y = GROUND_Y - 132; // hangs: bottom at 620-62, clears a sliding turkey
    else if (kind === KIND.PUDDLE) item.y = GROUND_Y - d.h;
    else item.y = GROUND_Y - d.h;
    items.push(item);

    // Pickups: a corn trail over low obstacles, a feather line, or a rare
    // golden drumstick high above a jump.
    const roll = random.next();
    if (roll < 0.4 && JUMPERS.includes(kind) && kind !== KIND.PUDDLE) {
      for (let i = 0; i < 3; i += 1) {
        items.push({ kind: KIND.CORN, x: x - 30 + i * 40, y: GROUND_Y - 150 - (i === 1 ? 34 : 0), w: 34, h: 44, active: true, passed: false, bob: random.next() * 6 });
      }
    } else if (roll < 0.55) {
      for (let i = 0; i < 3; i += 1) {
        items.push({ kind: KIND.FEATHER, x: x + 60 + i * 44, y: GROUND_Y - 120, w: 26, h: 34, active: true, passed: false, bob: random.next() * 6 });
      }
    } else if (roll < 0.62) {
      items.push({ kind: KIND.DRUMSTICK, x: x + 10, y: GROUND_Y - 210, w: 40, h: 46, active: true, passed: false, bob: 0 });
    }
    // Mixed pairs get harder with distance: a hanger after a jumper, with
    // enough room to land from the jump before sliding under it.
    if (distance > 220 && random.chance(0.3)) {
      const hang = random.pick(HANGERS);
      const hd = dims(hang);
      const y = hang === KIND.KNIFE ? GROUND_Y - 168 : GROUND_Y - 132;
      items.push({ kind: hang, x: x + 270, y, w: hd.w, h: hd.h, active: true, passed: false, roll: 0 });
    }
  }

  return {
    reset() {
      items = [];
      nextSpawnX = 1400;
      lastKind = null;
    },
    get items() {
      return items;
    },
    // Move everything left by the scroll; spawn ahead; drop what passed.
    update(dt, speed, distance) {
      const move = speed * dt;
      for (const item of items) {
        item.x -= move;
        if (item.kind === KIND.PUMPKIN) {
          item.x -= 55 * dt; // pumpkins roll toward the turkey
          item.roll += dt * 5;
        }
        if (item.kind === KIND.KNIFE || item.kind === KIND.POT) {
          item.y += Math.sin((item.x + item.roll * 40) * 0.01) * 0.15; // gentle sway
        }
      }
      items = items.filter((item) => item.x + item.w > -80);
      nextSpawnX -= move;
      if (nextSpawnX <= 1280) {
        const gap = 420 + random.range(0, 260) - Math.min(140, distance * 0.12);
        spawnAt(1280 + 80, distance);
        nextSpawnX = 1280 + 80 + Math.max(300, gap);
      }
    },
    // Collision of one item with the turkey's box. Returns 'hit' | 'puddle' |
    // 'corn' | 'feather' | 'drumstick' | null. Pickups are consumed on touch.
    collide(box, sliding) {
      for (const item of items) {
        if (!item.active) continue;
        const overlapX = item.x + 8 < box.x + box.width && item.x + item.w - 8 > box.x;
        const overlapY = item.y + 4 < box.y + box.height && item.y + item.h - 4 > box.y;
        if (!overlapX || !overlapY) continue;
        if (item.kind === KIND.CORN || item.kind === KIND.FEATHER || item.kind === KIND.DRUMSTICK) {
          item.active = false;
          return item.kind;
        }
        if (HANGERS.includes(item.kind)) {
          // Hangers only hurt a standing turkey; sliding ducks under them.
          if (sliding) continue;
          item.active = false;
          return 'hit';
        }
        if (item.kind === KIND.PUDDLE) {
          item.active = false;
          return 'puddle';
        }
        item.active = false;
        return 'hit';
      }
      return null;
    },
  };
}

// ---- Drawing: one function per kind, all canvas vector art. ----
export function drawItem(ctx, item, t) {
  const { kind, x, y, w, h } = item;
  ctx.save();
  switch (kind) {
    case KIND.FENCE: {
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(x, y, 6, h);
      ctx.fillRect(x + w - 6, y, 6, h);
      ctx.fillRect(x - 4, y + 8, w + 8, 8);
      ctx.fillRect(x - 4, y + 30, w + 8, 8);
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(x - 4, y + 8, w + 8, 3);
      break;
    }
    case KIND.HAY: {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a67c2e';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 6, h / 2 - 6, 0, i * 0.5, i * 0.5 + 0.6);
        ctx.stroke();
      }
      break;
    }
    case KIND.PUMPKIN: {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(item.roll || 0);
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b95a00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 4, h / 2 - 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(-3, -h / 2 - 6, 6, 10);
      ctx.restore();
      break;
    }
    case KIND.PITCHFORK: {
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h);
      ctx.lineTo(x + w / 2, y + 18);
      ctx.stroke();
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 18);
        ctx.lineTo(x + w / 2 + i * 9, y);
        ctx.stroke();
      }
      break;
    }
    case KIND.OVEN: {
      // A roaring oven, door open, fire inside — the fate Gobble is fleeing.
      ctx.fillStyle = '#4a4a55';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.fillStyle = '#2c2c34';
      ctx.fillRect(x + 8, y + 8, w - 16, 16);
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.roundRect(x + 14, y + 34, w - 28, h - 46, 6);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 22, 26, 16, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 16, 16, 12, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#e0e0e0';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(x + 24 + i * 22, y + 16, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case KIND.PUDDLE: {
      ctx.fillStyle = '#5dade2';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#aed6f1';
      ctx.beginPath();
      ctx.ellipse(x + w / 2 - 20, y + h / 2, w / 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case KIND.KNIFE: {
      // The carving knife, hanging by a rope from above, blade glinting.
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, 0);
      ctx.lineTo(x + w / 2, y);
      ctx.stroke();
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(x + 4, y, 18, 34);
      ctx.fillStyle = '#eceff1';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 34);
      ctx.lineTo(x + w - 2, y + 34);
      ctx.lineTo(x + w / 2 + 4, y + h);
      ctx.lineTo(x + w / 2 - 4, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 44);
      ctx.lineTo(x + 12, y + h - 14);
      ctx.stroke();
      break;
    }
    case KIND.POT: {
      // A heavy pot hanging by a rope — duck under it.
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, 0);
      ctx.lineTo(x + w / 2, y + 8);
      ctx.stroke();
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 14, w / 2, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 2, y + 10, w - 4, h - 26);
      ctx.fillStyle = '#546e7a';
      ctx.fillRect(x - 6, y + 16, 10, 8);
      ctx.fillRect(x + w - 4, y + 16, 10, 8);
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 12, w / 3, 5, 0, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case KIND.CORN: {
      const bob = Math.sin(t * 4 + (item.bob || 0)) * 3;
      ctx.save();
      ctx.translate(0, bob);
      ctx.fillStyle = '#f7dc6f';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, 13, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      for (let r = -1; r <= 1; r += 1) {
        for (let c = -1; c <= 1; c += 1) {
          ctx.beginPath();
          ctx.arc(x + w / 2 + c * 7, y + h / 2 + r * 10, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case KIND.FEATHER: {
      const bob = Math.sin(t * 3 + (item.bob || 0)) * 4;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2 + bob);
      ctx.rotate(0.5);
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 18);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case KIND.DRUMSTICK: {
      const bob = Math.sin(t * 3) * 5;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2 + bob);
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath();
      ctx.arc(-8, 16, 4, 0, Math.PI * 2);
      ctx.arc(0, 18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d2691e';
      ctx.beginPath();
      ctx.ellipse(2, -4, 14, 18, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.ellipse(2, -4, 8, 11, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}
