// Keyboard + mouse input. Jump: Space / ArrowUp / W / click. Slide: ArrowDown / S.
// Dash: Shift. Pause: P. Mute: M. Restart: R. Confirm (start / restart): Space,
// Enter or click. Actions are consumed once per press so holding a key does
// not repeat them; held direction is read every frame.
export const ACTION_CONFIRM = 1;
export const ACTION_JUMP = 2;
export const ACTION_SLIDE = 4;
export const ACTION_DASH = 8;
export const ACTION_PAUSE = 16;
export const ACTION_RESTART = 32;
export const ACTION_MUTE = 64;

export function createInput(canvas) {
  let actions = 0;
  let slideHeld = false;
  let jumpHeld = false;

  function press(action) {
    actions |= action;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault();
        press(ACTION_JUMP | ACTION_CONFIRM);
        jumpHeld = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        event.preventDefault();
        press(ACTION_SLIDE);
        slideHeld = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        press(ACTION_DASH);
        break;
      case 'Enter':
        press(ACTION_CONFIRM);
        break;
      case 'KeyP':
      case 'Escape':
        press(ACTION_PAUSE);
        break;
      case 'KeyR':
        press(ACTION_RESTART);
        break;
      case 'KeyM':
        press(ACTION_MUTE);
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        jumpHeld = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        slideHeld = false;
        break;
      default:
        break;
    }
  }

  function onPointerDown(event) {
    event.preventDefault();
    press(ACTION_JUMP | ACTION_CONFIRM);
    jumpHeld = true;
  }

  function onPointerUp() {
    jumpHeld = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    get sliding() {
      return slideHeld;
    },
    get jumpHeld() {
      return jumpHeld;
    },
  };
}
