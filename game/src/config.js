// GOBBLE DASH — The Great Turkey Escape. Shared tuning for the whole game.
// One logical frame: 1280 x 720, ground line at y = 620. The turkey runs to the
// right while the world scrolls left; distance is measured in metres.
export const VIEW = { width: 1280, height: 720 };
export const GROUND_Y = 620;
export const PX_PER_METRE = 40;
export const ESCAPE_DISTANCE = 900; // metres to freedom

// Stage boundaries (metres): farmyard -> barn -> kitchen.
export const STAGES = [
  { name: 'THE FARMYARD', until: 300, sky: ['#ffd166', '#ff8c42', '#3d9bd6'] },
  { name: 'THE BARN', until: 600, sky: ['#f7a35c', '#c65d7b', '#5b4a8a'] },
  { name: 'THE KITCHEN', until: ESCAPE_DISTANCE, sky: ['#3a2b4a', '#6b3a4a', '#2a1e33'] },
];

export const PLAYER = {
  x: 230,
  width: 62,
  height: 78,
  slideHeight: 42,
  jumpVelocity: -860,
  gravity: 2500,
  dashSpeed: 260,
  dashTime: 0.22,
  dashCooldown: 1.6,
};

export const FARMER = {
  startGap: 70, // 0..100; 0 means caught
  cleanRecovery: 1.4, // gap points regained per clean second
  hitPenalty: 26, // gap lost on a stumble
  puddlePenalty: 8,
  maxGap: 88,
};

export const WORLD = {
  startSpeed: 320, // px/s of scroll
  maxSpeed: 540,
  speedPerMetre: 0.24,
  lives: 3,
  invulnerableSeconds: 1.3,
  cornScore: 50,
  featherScore: 25,
  drumstickScore: 200,
  stageBonus: 250,
};

export const BEST_KEY = 'gobble-dash-best';
export const STEP = 1 / 60;
