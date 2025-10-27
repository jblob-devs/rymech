import { useEffect, useRef, useState } from 'react';
import { Sword, Zap } from 'lucide-react';

interface TouchControlsProps {
  onMove: (x: number, y: number) => void;
  onShoot: (x: number, y: number, active: boolean) => void;
  onDash: () => void;
  onInteract: () => void;
  onWeaponSwitch: (index: number) => void;
  weaponCount: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface JoystickState {
  x: number;
  y: number;
  active: boolean;
  startX: number;
  startY: number;
}

export default function TouchControls({
  onMove,
  onShoot,
  onDash,
  onInteract,
  onWeaponSwitch,
  weaponCount,
  isVisible,
  onToggleVisibility,
}: TouchControlsProps) {
  const [moveJoystick, setMoveJoystick] = useState<JoystickState>({
    x: 0,
    y: 0,
    active: false,
    startX: 0,
    startY: 0,
  });

  const [shootJoystick, setShootJoystick] = useState<JoystickState>({
    x: 0,
    y: 0,
    active: false,
    startX: 0,
    startY: 0,
  });

  const moveZoneRef = useRef<HTMLDivElement>(null);
  const shootZoneRef = useRef<HTMLDivElement>(null);
  const moveActiveTouchId = useRef<number | null>(null);
  const shootActiveTouchId = useRef<number | null>(null);

  const JOYSTICK_MAX_DISTANCE = 50;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!isVisible) return;

      Array.from(e.changedTouches).forEach((touch) => {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (moveZoneRef.current?.contains(target) && moveActiveTouchId.current === null) {
          const rect = moveZoneRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          moveActiveTouchId.current = touch.identifier;
          setMoveJoystick({
            x: 0,
            y: 0,
            active: true,
            startX: centerX,
            startY: centerY,
          });
        }

        if (shootZoneRef.current?.contains(target) && shootActiveTouchId.current === null) {
          const rect = shootZoneRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          shootActiveTouchId.current = touch.identifier;
          setShootJoystick({
            x: 0,
            y: 0,
            active: true,
            startX: centerX,
            startY: centerY,
          });
        }
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isVisible) return;
      e.preventDefault();

      Array.from(e.changedTouches).forEach((touch) => {
        if (touch.identifier === moveActiveTouchId.current && moveJoystick.active) {
          const dx = touch.clientX - moveJoystick.startX;
          const dy = touch.clientY - moveJoystick.startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const clampedDistance = Math.min(distance, JOYSTICK_MAX_DISTANCE);
          const angle = Math.atan2(dy, dx);

          const clampedX = Math.cos(angle) * clampedDistance;
          const clampedY = Math.sin(angle) * clampedDistance;

          setMoveJoystick((prev) => ({
            ...prev,
            x: clampedX,
            y: clampedY,
          }));

          onMove(clampedX / JOYSTICK_MAX_DISTANCE, clampedY / JOYSTICK_MAX_DISTANCE);
        }

        if (touch.identifier === shootActiveTouchId.current && shootJoystick.active) {
          const dx = touch.clientX - shootJoystick.startX;
          const dy = touch.clientY - shootJoystick.startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const clampedDistance = Math.min(distance, JOYSTICK_MAX_DISTANCE);
          const angle = Math.atan2(dy, dx);

          const clampedX = Math.cos(angle) * clampedDistance;
          const clampedY = Math.sin(angle) * clampedDistance;

          setShootJoystick((prev) => ({
            ...prev,
            x: clampedX,
            y: clampedY,
          }));

          onShoot(clampedX / JOYSTICK_MAX_DISTANCE, clampedY / JOYSTICK_MAX_DISTANCE, true);
        }
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        if (touch.identifier === moveActiveTouchId.current) {
          moveActiveTouchId.current = null;
          setMoveJoystick({
            x: 0,
            y: 0,
            active: false,
            startX: 0,
            startY: 0,
          });
          onMove(0, 0);
        }

        if (touch.identifier === shootActiveTouchId.current) {
          shootActiveTouchId.current = null;
          setShootJoystick({
            x: 0,
            y: 0,
            active: false,
            startX: 0,
            startY: 0,
          });
          onShoot(0, 0, false);
        }
      });
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isVisible, moveJoystick.active, shootJoystick.active, moveJoystick.startX, moveJoystick.startY, shootJoystick.startX, shootJoystick.startY, onMove, onShoot]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 backdrop-blur-sm border-2 border-cyan-500/50 rounded-full p-3 shadow-lg"
      >
        <span className="text-xs text-cyan-300 font-bold px-2">SHOW TOUCH CONTROLS</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={onToggleVisibility}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800/70 backdrop-blur-sm border border-cyan-500/30 rounded-full px-3 py-1 shadow-lg"
      >
        <span className="text-xs text-slate-400">Hide Controls</span>
      </button>

      <div
        ref={moveZoneRef}
        className="fixed bottom-8 left-8 z-50 w-32 h-32 bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-500/30 rounded-full flex items-center justify-center touch-none"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border border-cyan-500/20 rounded-full" />
        </div>
        {moveJoystick.active && (
          <div
            className="absolute w-12 h-12 bg-cyan-500/60 rounded-full border-2 border-cyan-300 shadow-lg transition-transform"
            style={{
              transform: `translate(${moveJoystick.x}px, ${moveJoystick.y}px)`,
            }}
          />
        )}
        {!moveJoystick.active && (
          <div className="w-12 h-12 bg-cyan-500/30 rounded-full border-2 border-cyan-400/50" />
        )}
        <span className="absolute -bottom-6 text-xs text-slate-400 font-bold">MOVE</span>
      </div>

      <div
        ref={shootZoneRef}
        className="fixed bottom-8 right-8 z-50 w-32 h-32 bg-slate-800/50 backdrop-blur-sm border-2 border-red-500/30 rounded-full flex items-center justify-center touch-none"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border border-red-500/20 rounded-full" />
        </div>
        {shootJoystick.active && (
          <div
            className="absolute w-12 h-12 bg-red-500/60 rounded-full border-2 border-red-300 shadow-lg transition-transform"
            style={{
              transform: `translate(${shootJoystick.x}px, ${shootJoystick.y}px)`,
            }}
          />
        )}
        {!shootJoystick.active && (
          <div className="w-12 h-12 bg-red-500/30 rounded-full border-2 border-red-400/50" />
        )}
        <span className="absolute -bottom-6 text-xs text-slate-400 font-bold">AIM</span>
      </div>

      <div className="fixed bottom-48 left-8 z-50 flex flex-col gap-2">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onDash();
          }}
          className="w-16 h-16 bg-slate-800/70 backdrop-blur-sm border-2 border-yellow-500/50 rounded-full flex items-center justify-center shadow-lg active:bg-yellow-500/30 transition-colors touch-none"
        >
          <Zap className="w-6 h-6 text-yellow-400" />
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInteract();
          }}
          className="w-16 h-16 bg-slate-800/70 backdrop-blur-sm border-2 border-purple-500/50 rounded-full flex items-center justify-center shadow-lg active:bg-purple-500/30 transition-colors touch-none"
        >
          <span className="text-xl font-bold text-purple-400">F</span>
        </button>
      </div>

      <div className="fixed bottom-48 right-8 z-50 flex flex-col gap-2">
        {Array.from({ length: Math.min(weaponCount, 4) }).map((_, i) => (
          <button
            key={i}
            onTouchStart={(e) => {
              e.preventDefault();
              onWeaponSwitch(i);
            }}
            className="w-12 h-12 bg-slate-800/70 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg flex items-center justify-center shadow-lg active:bg-cyan-500/30 transition-colors text-sm font-bold text-cyan-300 touch-none"
          >
            {i + 1}
          </button>
        ))}
      </div>
    </>
  );
}
