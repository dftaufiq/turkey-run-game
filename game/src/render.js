// Everything the player sees: parallax stage backgrounds, the turkey, the
// farmer, obstacles, particles, the HUD, and the title / pause / end screens.
// The canvas is a fixed 1280x720 logical frame, scaled to the window.
import { ESCAPE_DISTANCE, GROUND_Y, STAGES, VIEW } from './config.js';
import { PHASE } from './world.js';
import { drawTurkey } from './turkey.js';
import { drawItem } from './obstacles.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  function fit() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
    canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  }
  window.addEventListener('resize', fit);
  fit();

  // ---- Backgrounds ----
  function sky(stageIndex, scroll) {
    const stage = STAGES[stageIndex];
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, stage.sky[2]);
    gradient.addColorStop(0.55, stage.sky[1]);
    gradient.addColorStop(1, stage.sky[0]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, GROUND_Y);

    if (stageIndex === 0) {
      // Morning sun + drifting clouds.
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.arc(1050, 110, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 4; i += 1) {
        const cx = ((i * 360 - scroll * 0.12) % 1500 + 1500) % 1500 - 110;
        cloud(cx, 90 + i * 36);
      }
      // Rolling green hills.
      ctx.fillStyle = '#7cb342';
      hill(scroll * 0.25, 560, 420, 90);
      ctx.fillStyle = '#558b2f';
      hill(scroll * 0.4, 590, 520, 70);
    } else if (stageIndex === 1) {
      // Dusk: low sun, barn silhouette, lantern glow.
      ctx.fillStyle = '#ffdf8a';
      ctx.beginPath();
      ctx.arc(180, 470, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a2c4a';
      barnSilhouette(scroll * 0.3);
      ctx.fillStyle = '#8d6e63';
      hill(scroll * 0.45, 600, 500, 60);
    } else {
      // Kitchen night: moon in the window, warm tiles below.
      ctx.fillStyle = '#f4f6f7';
      ctx.beginPath();
      ctx.arc(1120, 120, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d5d8dc';
      ctx.beginPath();
      ctx.arc(1106, 110, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(244,246,247,0.25)';
      for (let i = 0; i < 12; i += 1) {
        const sx = 60 + i * 104;
        const sy = 60 + (i % 3) * 44;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function cloud(x, y) {
    ctx.beginPath();
    ctx.ellipse(x, y, 52, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 34, y + 6, 40, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 36, y + 8, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function hill(offset, baseY, width, height) {
    ctx.beginPath();
    for (let x = -width; x <= VIEW.width + width; x += 40) {
      const xx = x - (offset % (width * 2));
      const yy = baseY - Math.sin((xx / width) * Math.PI) * height * 0.4 - height * 0.3;
      if (x === -width) ctx.moveTo(xx, GROUND_Y);
      else ctx.lineTo(xx, yy);
    }
    ctx.lineTo(VIEW.width + width, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  function barnSilhouette(offset) {
    for (let i = 0; i < 3; i += 1) {
      const bx = 900 + i * 420 - (offset % 1260);
      ctx.fillRect(bx, 420, 150, 200);
      ctx.beginPath();
      ctx.moveTo(bx - 10, 420);
      ctx.lineTo(bx + 75, 350);
      ctx.lineTo(bx + 160, 420);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f7dc6f';
      ctx.fillRect(bx + 60, 480, 30, 40);
      ctx.fillStyle = '#4a2c4a';
    }
  }

  function ground(stageIndex, scroll) {
    if (stageIndex === 2) {
      // Kitchen checkerboard floor.
      for (let row = 0; row < 2; row += 1) {
        for (let col = -1; col < 17; col += 1) {
          const x = col * 80 - (scroll % 80);
          ctx.fillStyle = (row + col) % 2 === 0 ? '#b5651d' : '#8a5a2b';
          ctx.fillRect(x, GROUND_Y + row * 50, 80, 50);
        }
      }
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(0, GROUND_Y, VIEW.width, 4);
      return;
    }
    const dirt = stageIndex === 0 ? '#a1887f' : '#6d4c41';
    const grass = stageIndex === 0 ? '#7cb342' : '#8d6e63';
    ctx.fillStyle = dirt;
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    ctx.fillStyle = grass;
    ctx.fillRect(0, GROUND_Y, VIEW.width, 12);
    // Dirt speckles scrolling past.
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < 24; i += 1) {
      const x = (i * 173 - scroll * 1.0) % 1400;
      const xx = x < 0 ? x + 1400 : x;
      ctx.fillRect(xx, GROUND_Y + 24 + (i % 5) * 14, 10, 4);
    }
    // Fence posts in the farmyard.
    if (stageIndex === 0) {
      ctx.fillStyle = '#8d6e63';
      for (let i = 0; i < 9; i += 1) {
        const x = (i * 180 - scroll) % 1620;
        const xx = x < -20 ? x + 1620 : x;
        ctx.fillRect(xx, GROUND_Y - 34, 8, 34);
      }
      ctx.fillRect(0, GROUND_Y - 30, VIEW.width, 5);
    }
  }

  // ---- HUD ----
  function hud(state, best) {
    const distance = Math.floor(state.distance);
    // Top bar.
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    ctx.beginPath();
    ctx.roundRect(16, 14, 330, 92, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${state.score}`, 32, 48);
    ctx.font = 'bold 20px Verdana, sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`BEST ${Math.max(best, state.score)}`, 32, 78);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Verdana, sans-serif';
    ctx.fillText(`DISTANCE ${distance}m / ${ESCAPE_DISTANCE}m`, 32, 100 - 4);

    // Distance progress bar with stage marks and the freedom flag.
    const barX = 380;
    const barW = 520;
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    ctx.beginPath();
    ctx.roundRect(barX - 8, 22, barW + 16, 34, 12);
    ctx.fill();
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(barX, 34, barW, 10);
    const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(barX, 34, barW * progress, 10);
    ctx.fillStyle = '#ffffff';
    for (const mark of [300, 600]) {
      const mx = barX + (mark / ESCAPE_DISTANCE) * barW;
      ctx.fillRect(mx - 1, 30, 2, 18);
    }
    ctx.font = 'bold 15px Verdana, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 FREEDOM', barX + barW + 62, 46);
    ctx.textAlign = 'left';
    ctx.font = 'bold 17px Verdana, sans-serif';
    ctx.fillStyle = '#ffe082';
    ctx.fillText(STAGES[state.stageIndex].name, barX, 76);

    // Lives as hearts.
    for (let i = 0; i < 3; i += 1) {
      drawHeart(1150 + i * 38, 40, i < state.lives ? '#e74c3c' : 'rgba(255,255,255,0.25)');
    }
    // Farmer gap meter: how close the farmer is.
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    ctx.beginPath();
    ctx.roundRect(1060, 62, 190, 30, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Verdana, sans-serif';
    ctx.fillText('FARMER', 1070, 82);
    const gapW = 100 * (state.gap / 88);
    ctx.fillStyle = state.gap < 25 ? '#e74c3c' : '#f39c12';
    ctx.fillRect(1140, 68, gapW, 18);
  }

  function drawHeart(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-12, -4, -6, -14, 0, -6);
    ctx.bezierCurveTo(6, -14, 12, -4, 0, 8);
    ctx.fill();
    ctx.restore();
  }

  function banner(text, subtext) {
    ctx.fillStyle = 'rgba(20,16,12,0.6)';
    ctx.fillRect(0, 250, VIEW.width, 120);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 56px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, VIEW.width / 2, 310);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Verdana, sans-serif';
    ctx.fillText(subtext, VIEW.width / 2, 350);
    ctx.textAlign = 'left';
  }

  // ---- Screens ----
  function titleScreen(world, best) {
    sky(0, world.state.scroll);
    ground(0, world.state.scroll);
    // Big hero turkey, centre-left, with the farmer peeking from the left edge.
    ctx.save();
    ctx.translate(430, 470);
    ctx.scale(2.1, 2.1);
    ctx.translate(-230, -620);
    drawTurkey(ctx, world.turkey, world.state.time);
    ctx.restore();
    world.farmer.draw(ctx, 96, world.state.time);

    ctx.fillStyle = 'rgba(20,16,12,0.45)';
    ctx.fillRect(0, 60, VIEW.width, 190);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 84px Verdana, sans-serif';
    ctx.fillText('GOBBLE DASH', VIEW.width / 2, 140);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Verdana, sans-serif';
    ctx.fillText('THE GREAT TURKEY ESCAPE', VIEW.width / 2, 186);
    ctx.font = '20px Verdana, sans-serif';
    ctx.fillStyle = '#ffe082';
    ctx.fillText('Thanksgiving is coming. Run, Gobble — run for your life!', VIEW.width / 2, 224);

    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    ctx.beginPath();
    ctx.roundRect(390, 560, 500, 110, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Verdana, sans-serif';
    ctx.fillText('SPACE / CLICK — jump      ↓ / S — slide', VIEW.width / 2, 596);
    ctx.fillText('SHIFT — dash      P — pause      M — sound', VIEW.width / 2, 628);
    ctx.font = 'bold 26px Verdana, sans-serif';
    ctx.fillStyle = Math.floor(world.state.time * 2) % 2 === 0 ? '#ffd166' : '#ffffff';
    ctx.fillText('PRESS SPACE OR CLICK TO START', VIEW.width / 2, 700 - 8);
    ctx.textAlign = 'left';
    if (best > 0) {
      // Below the hero turkey, clear of its head and of the controls box.
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`BEST SCORE ${best}`, VIEW.width / 2, 522);
      ctx.textAlign = 'left';
    }
  }

  function endScreen(world, best, escaped) {
    // The last play frame is already painted behind; dim it and show the result.
    ctx.fillStyle = escaped ? 'rgba(27,94,32,0.55)' : 'rgba(40,10,10,0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 96px Verdana, sans-serif';
      ctx.fillText('ESCAPED!', VIEW.width / 2, 240);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Verdana, sans-serif';
      ctx.fillText('Gobble is free — Thanksgiving can wait.', VIEW.width / 2, 296);
    } else {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 96px Verdana, sans-serif';
      ctx.fillText('CAUGHT!', VIEW.width / 2, 240);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Verdana, sans-serif';
      ctx.fillText('Dinner is served… for the farmer.', VIEW.width / 2, 296);
    }
    ctx.font = 'bold 34px Verdana, sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`SCORE ${world.state.score}   •   ${Math.floor(world.state.distance)}m`, VIEW.width / 2, 380);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Verdana, sans-serif';
    ctx.fillText(`BEST ${Math.max(best, world.state.score)}`, VIEW.width / 2, 420);
    ctx.font = 'bold 26px Verdana, sans-serif';
    ctx.fillStyle = Math.floor(world.state.time * 2) % 2 === 0 ? '#ffd166' : '#ffffff';
    ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW.width / 2, 500);
    ctx.textAlign = 'left';
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return {
    draw(world, screen, best) {
      const state = world.state;
      ctx.save();
      if (state.shake > 0) {
        const s = state.shake * 8;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }
      if (screen === SCREEN_TITLE) {
        titleScreen(world, best);
        ctx.restore();
        return;
      }
      sky(state.stageIndex, state.scroll);
      ground(state.stageIndex, state.scroll);
      for (const item of world.obstacles.items) drawItem(ctx, item, state.time);
      world.farmer.draw(ctx, state.gap, state.time);
      drawTurkey(ctx, world.turkey, state.time);
      drawParticles(state);
      hud(state, best);
      if (state.stageBanner > 0 && screen === SCREEN_PLAY) {
        const name = STAGES[state.stageIndex].name;
        const sub = state.stageIndex === 0
          ? 'Outrun the farmer — 900m to freedom'
          : state.stageIndex === 1
            ? 'Mind the pitchforks — and the knives'
            : 'The oven is lit. Do NOT get caught.';
        banner(name, sub);
      }
      if (screen === SCREEN_PAUSED) {
        ctx.fillStyle = 'rgba(20,16,12,0.6)';
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px Verdana, sans-serif';
        ctx.fillText('PAUSED', VIEW.width / 2, 340);
        ctx.font = 'bold 24px Verdana, sans-serif';
        ctx.fillText('Press P to keep running', VIEW.width / 2, 390);
        ctx.textAlign = 'left';
      }
      if (screen === SCREEN_OVER) {
        endScreen(world, best, state.phase === PHASE.ESCAPED);
      }
      if (state.flash > 0) {
        ctx.fillStyle = `rgba(231,76,60,${state.flash})`;
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      }
      ctx.restore();
    },
  };
}
