// The farmer: he chases from the left, his distance set by the gap meter.
// He runs, stumbles when the turkey pulls away, and lunges when he closes in.
// Drawn big and angry so the threat reads in a thumbnail.
export function createFarmer() {
  const state = { runCycle: 0, lunge: 0, stumble: 0 };
  return {
    state,
    reset() {
      state.runCycle = 0;
      state.lunge = 0;
      state.stumble = 0;
    },
    update(dt, speed, gap) {
      state.runCycle += dt * (speed / 24);
      if (state.lunge > 0) state.lunge -= dt * 3;
      if (state.stumble > 0) state.stumble -= dt * 2;
      // The closer he gets, the harder he reaches.
      if (gap < 22) state.lunge = Math.max(state.lunge, 0.6);
    },
    // Screen x of the farmer's centre: gap 88 keeps him chasing at the left
    // edge, gap 0 puts his hands on the turkey.
    xForGap(gap) {
      return 250 - gap * 2.4;
    },
    draw(ctx, gap, t) {
      const x = this.xForGap(gap);
      const s = state;
      ctx.save();
      ctx.translate(x, 620);
      if (s.stumble > 0) ctx.rotate(-0.12 * s.stumble);
      const swing = Math.sin(s.runCycle * 2) * 16;
      const reach = s.lunge > 0 ? s.lunge * 26 : 0;

      // Legs: blue overalls, running.
      ctx.strokeStyle = '#2d4a7a';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -52);
      ctx.lineTo(-6 + swing, -4);
      ctx.moveTo(6, -52);
      ctx.lineTo(6 - swing, -4);
      ctx.stroke();
      // Body: red plaid shirt.
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.roundRect(-22, -108, 44, 60, 10);
      ctx.fill();
      ctx.strokeStyle = '#7b241c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, -88);
      ctx.lineTo(22, -88);
      ctx.moveTo(-22, -68);
      ctx.lineTo(22, -68);
      ctx.moveTo(0, -108);
      ctx.lineTo(0, -48);
      ctx.stroke();
      // Overalls straps.
      ctx.strokeStyle = '#2d4a7a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-12, -108);
      ctx.lineTo(-12, -84);
      ctx.moveTo(12, -108);
      ctx.lineTo(12, -84);
      ctx.stroke();
      // Reaching arm + pitchfork, lunging forward when close.
      ctx.save();
      ctx.translate(14 + reach, -96);
      ctx.rotate(0.5 - s.lunge * 0.3);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(26, 6);
      ctx.stroke();
      // Pitchfork in hand.
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(26, 6);
      ctx.lineTo(52, -8);
      ctx.stroke();
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(52, -8);
        ctx.lineTo(62, -20 + i * 7);
        ctx.stroke();
      }
      ctx.restore();
      // Head: angry face, moustache, straw hat.
      ctx.fillStyle = '#f0c8a0';
      ctx.beginPath();
      ctx.arc(0, -126, 17, 0, Math.PI * 2);
      ctx.fill();
      // Angry eyebrows.
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -134);
      ctx.lineTo(-2, -130);
      ctx.moveTo(10, -134);
      ctx.lineTo(2, -130);
      ctx.stroke();
      // Eyes.
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-6, -127, 2, 0, Math.PI * 2);
      ctx.arc(6, -127, 2, 0, Math.PI * 2);
      ctx.fill();
      // Moustache + open shouting mouth.
      ctx.fillStyle = '#6d4c41';
      ctx.beginPath();
      ctx.ellipse(0, -118, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.ellipse(0, -111, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Straw hat.
      ctx.fillStyle = '#e8c96a';
      ctx.beginPath();
      ctx.ellipse(0, -138, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -142, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-15, -144, 30, 4);
      ctx.restore();
    },
  };
}
