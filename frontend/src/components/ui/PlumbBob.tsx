import React, { useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';

interface PlumbBobProps {
  className?: string;
  stringLength?: number;
  showLabel?: boolean;
}

export const PlumbBob: React.FC<PlumbBobProps> = ({ 
  className = '',
  stringLength = 190, // Lengthy suspension string matching reference
  showLabel = true
}) => {
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const rotateValue = useMotionValue(0);

  // Pure continuous physics simulation on native animation frame
  // Generates fluid, organic pendulum motion with natural scroll-shake and harmonic damping
  useAnimationFrame((time, delta) => {
    // Normalized delta time (~1.0 at 60fps)
    const dt = Math.min(delta, 34) / 16.67;

    const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const scrollDelta = currentScrollY - lastScrollYRef.current;
    lastScrollYRef.current = currentScrollY;

    // Scroll impulse: scrolling generates directional inertial torque
    if (Math.abs(scrollDelta) > 0.05) {
      // Scale scroll velocity into angular impulse, clamped to prevent unnatural over-rotation
      const impulse = Math.max(-6, Math.min(6, -scrollDelta * 0.10));
      velocityRef.current += impulse;
    }

    // Pendulum gravity restoring torque: pulls bob back toward true vertical center (0 deg)
    const restoringTorque = -0.042 * angleRef.current;
    velocityRef.current += restoringTorque * dt;

    // Smooth aerodynamic & internal string friction damping
    velocityRef.current *= Math.pow(0.962, dt);

    // Clamp maximum angular velocity for rock-solid stability
    velocityRef.current = Math.max(-12, Math.min(12, velocityRef.current));

    // Integrate angle
    angleRef.current += velocityRef.current * dt;

    // Clamp swing envelope to realistic ±18 degrees
    angleRef.current = Math.max(-18, Math.min(18, angleRef.current));

    // Subtle, continuous organic breathing sway when at rest (~3.4s sine wave)
    const ambientFloat = Math.sin(time * 0.0018) * 0.9;

    // Set final composite rotation angle
    rotateValue.set(angleRef.current + ambientFloat);
  });

  const totalHeight = stringLength + 38;

  return (
    <div className={`relative select-none pointer-events-none flex flex-col items-center ${className}`}>
      {/* Physics-driven pendulum pivoting smoothly from the exact top anchor ring */}
      <motion.div
        style={{
          rotate: rotateValue,
          transformOrigin: '12px 3px', // Exactly at the center of the top anchor eyelet
        }}
        className="relative will-change-transform"
      >
        <svg
          width="24"
          height={totalHeight}
          viewBox={`0 0 24 ${totalHeight}`}
          fill="none"
          className="overflow-visible"
        >
          {/* Top Anchor Ring / Eyelet directly matching reference */}
          <circle
            cx="12"
            cy="3"
            r="2"
            className="fill-indigo-400 dark:fill-indigo-300 stroke-indigo-600 dark:stroke-indigo-400"
            strokeWidth="0.75"
          />

          {/* Lengthy Dashed Suspension Line */}
          <line
            x1="12"
            y1="5"
            x2="12"
            y2={stringLength}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="text-indigo-400/85 dark:text-indigo-400/75"
          />

          {/* Faceted 3D Plumb Bob Weight at bottom */}
          <g transform={`translate(0, ${stringLength})`} className="filter drop-shadow(0 4px 10px rgba(99,102,241,0.4))">
            {/* Left facet (darker violet tone) */}
            <polygon
              points="12,0 2,12 12,34"
              className="fill-[#4f46e5] dark:fill-[#5b4be0]"
            />

            {/* Right facet (lighter lavender tone) */}
            <polygon
              points="12,0 22,12 12,34"
              className="fill-[#818cf8] dark:fill-[#93a4fc]"
            />

            {/* Center ridge divider highlight */}
            <line
              x1="12"
              y1="0"
              x2="12"
              y2="34"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.75"
            />

            {/* Top connector bead */}
            <circle
              cx="12"
              cy="0"
              r="1.75"
              className="fill-indigo-200 dark:fill-white"
            />
          </g>
        </svg>
      </motion.div>

      {/* Vertical 'TRUE VERTICAL' label matching reference */}
      {showLabel && (
        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 mt-2 rotate-90 origin-left translate-x-3 translate-y-3 whitespace-nowrap">
          TRUE VERTICAL
        </span>
      )}
    </div>
  );
};
