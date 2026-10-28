import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to capture keyboard controls for movement (WASD / Arrows)
 * and actions (Space for mining, E for vehicle cargo deposit, C for crafting, Esc).
 */
export const useKeyboard = (enabled = true) => {
  const [keys, setKeys] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    e: false,
  });

  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(() => {
    if (!enabled) {
      setKeys({ up: false, down: false, left: false, right: false, space: false, e: false });
      return;
    }

    const handleKeyDown = (e) => {
      // Prevent browser scroll on space and arrows while in-game
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      const keyLow = e.key ? e.key.toLowerCase() : '';
      const isUp = e.code === 'KeyW' || e.code === 'ArrowUp' || keyLow === 'w' || keyLow === 'ص' || e.key === 'ArrowUp';
      const isDown = e.code === 'KeyS' || e.code === 'ArrowDown' || keyLow === 's' || keyLow === 'س' || e.key === 'ArrowDown';
      const isLeft = e.code === 'KeyA' || e.code === 'ArrowLeft' || keyLow === 'a' || keyLow === 'ش' || e.key === 'ArrowLeft';
      const isRight = e.code === 'KeyD' || e.code === 'ArrowRight' || keyLow === 'd' || keyLow === 'ي' || e.key === 'ArrowRight';
      const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
      const isE = e.code === 'KeyE' || keyLow === 'e' || keyLow === 'ث';

      if (isUp) setKeys((prev) => (prev.up ? prev : { ...prev, up: true }));
      else if (isDown) setKeys((prev) => (prev.down ? prev : { ...prev, down: true }));
      else if (isLeft) setKeys((prev) => (prev.left ? prev : { ...prev, left: true }));
      else if (isRight) setKeys((prev) => (prev.right ? prev : { ...prev, right: true }));
      else if (isSpace) setKeys((prev) => (prev.space ? prev : { ...prev, space: true }));
      else if (isE) setKeys((prev) => (prev.e ? prev : { ...prev, e: true }));
    };

    const handleKeyUp = (e) => {
      const keyLow = e.key ? e.key.toLowerCase() : '';
      const isUp = e.code === 'KeyW' || e.code === 'ArrowUp' || keyLow === 'w' || keyLow === 'ص' || e.key === 'ArrowUp';
      const isDown = e.code === 'KeyS' || e.code === 'ArrowDown' || keyLow === 's' || keyLow === 'س' || e.key === 'ArrowDown';
      const isLeft = e.code === 'KeyA' || e.code === 'ArrowLeft' || keyLow === 'a' || keyLow === 'ش' || e.key === 'ArrowLeft';
      const isRight = e.code === 'KeyD' || e.code === 'ArrowRight' || keyLow === 'd' || keyLow === 'ي' || e.key === 'ArrowRight';
      const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
      const isE = e.code === 'KeyE' || keyLow === 'e' || keyLow === 'ث';

      if (isUp) setKeys((prev) => (!prev.up ? prev : { ...prev, up: false }));
      if (isDown) setKeys((prev) => (!prev.down ? prev : { ...prev, down: false }));
      if (isLeft) setKeys((prev) => (!prev.left ? prev : { ...prev, left: false }));
      if (isRight) setKeys((prev) => (!prev.right ? prev : { ...prev, right: false }));
      if (isSpace) setKeys((prev) => (!prev.space ? prev : { ...prev, space: false }));
      if (isE) setKeys((prev) => (!prev.e ? prev : { ...prev, e: false }));
    };

    const handleBlur = () => {
      setKeys({ up: false, down: false, left: false, right: false, space: false, e: false });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled]);

  return keys;
};
