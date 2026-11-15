import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useVelocity, useTransform, useSpring } from 'framer-motion';

interface PlumbBobProps {
  className?: string;
  stringLength?: number;
  showLabel?: boolean;
}

export const PlumbBob: React.FC<PlumbBobProps> = ({ 
  className = '',
  stringLength = 100,
  showLabel = true
}) => {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Velocity-driven angular deflection with underdamped spring physics
  // Scrolling down pushes velocity positive; scrolling up pushes negative
  const rawTilt = useTransform(scrollVelocity, [-2500, 0, 2500], [-14, 0, 14]);
  const springRotate = useSpring(rawTilt, {
    stiffness: 190,
    damping: 9, // Underdamped: creates natural harmonic wobble/shake when scrolling
    mass: 1.4,
  });

  // Track active scroll events to amplify realistic mechanical vibration while scrolling
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastY);
      lastY = currentY;

      if (delta > 0.5) {
        setIsScrolling(true);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = window.setTimeout(() => {
          setIsScrolling(false);
        }, 180);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const totalHeight = stringLength + 36;

  return (
    <div className={`relative select-none pointer-events-none flex flex-col items-center ${className}`}>
      {/* Outer physics-driven swing anchor pivoting around top attachment point */}
      <motion.div
        style={{
          rotate: springRotate,
          transformOrigin: '12px 0px',
        }}
        className="relative"
      >
        {/* Inner high-frequency vibration/shake when scrolling + gentle ambient sway when idle */}
        <motion.div
          animate={
            isScrolling
              ? {
                  rotate: [-3.5, 3.5, -2.5, 2.5, -1, 1, 0],
                  transition: {
                    duration: 0.28,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }
              : {
                  rotate: [-1.2, 1.2, -1.2],
                  transition: {
                    duration: 3.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }
          }
          style={{ transformOrigin: '12px 0px' }}
        >
          <svg
            width="24"
            height={totalHeight}
            viewBox={`0 0 24 ${totalHeight}`}
            fill="none"
            className="overflow-visible"
          >
            {/* Top Anchor Ring / Eyelet */}
            <circle
              cx="12"
              cy="1.5"
              r="1.5"
              className="fill-indigo-400 dark:fill-indigo-300 stroke-indigo-600 dark:stroke-indigo-400"
              strokeWidth="0.75"
            />

            {/* Dashed Suspension Line directly matching reference image */}
            <line
              x1="12"
              y1="3"
              x2="12"
              y2={stringLength}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3.5 3.5"
              className="text-indigo-400/80 dark:text-indigo-400/70"
            />

            {/* Faceted 3D Plumb Bob Weight at bottom */}
            <g transform={`translate(0, ${stringLength})`} className="filter drop-shadow(0 4px 10px rgba(99,102,241,0.45))">
              {/* Left facet (darker purple tone) */}
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
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.75"
              />

              {/* Top connector bead */}
              <circle
                cx="12"
                cy="0"
                r="1.5"
                className="fill-indigo-200 dark:fill-white"
              />
            </g>
          </svg>
        </motion.div>
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
