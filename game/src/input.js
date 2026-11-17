const movementCodes = new Set([
  'KeyW', 'ArrowUp', 'KeyA', 'ArrowLeft',
  'KeyS', 'ArrowDown', 'KeyD', 'ArrowRight',
]);
const actionCodes = new Set(['Space', 'Enter', 'Escape', 'KeyP']);

export function createInput() {
  const held = new Set();
  const pressed = new Set();

  window.addEventListener('keydown', (event) => {
    const code = event.code;
    const isAction = actionCodes.has(code);
    const isMove = movementCodes.has(code);
    if (!isAction && !isMove) return;
    if (event.target instanceof HTMLElement && event.target.closest('button, a, input')) return;
    if (isAction || isMove) event.preventDefault();
    held.add(code);
    if (!event.repeat) pressed.add(code);
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });

  window.addEventListener('blur', () => {
    held.clear();
    pressed.clear();
  });

  return {
    read() {
      const x = Number(held.has('KeyD') || held.has('ArrowRight')) - Number(held.has('KeyA') || held.has('ArrowLeft'));
      const y = Number(held.has('KeyS') || held.has('ArrowDown')) - Number(held.has('KeyW') || held.has('ArrowUp'));
      const length = Math.hypot(x, y) || 1;
      const result = {
        x: x / length,
        y: y / length,
        dashPressed: pressed.has('Space'),
        confirmPressed: pressed.has('Enter') || pressed.has('Space'),
        pausePressed: pressed.has('Escape') || pressed.has('KeyP'),
      };
      pressed.clear();
      return result;
    },
  };
}
