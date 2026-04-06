import { useRef, useCallback } from "react";
import type { PanInfo } from "framer-motion";

interface UseSwipeDragOptions {
  onNext: () => void;
  onPrev: () => void;
  /** Minimum horizontal offset in px to trigger navigation (default: 60) */
  threshold?: number;
  /** Minimum horizontal velocity in px/s to trigger navigation (default: 350) */
  velocityThreshold?: number;
}

/**
 * Returns Framer Motion drag props for horizontal swipe navigation.
 * Swipe left → onNext, swipe right → onPrev.
 * Designed for mobile-first bento card carousels.
 */
export function useSwipeDrag({
  onNext,
  onPrev,
  threshold = 60,
  velocityThreshold = 350,
}: UseSwipeDragOptions) {
  const isDraggingRef = useRef(false);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;

      // Determine direction by offset or velocity
      if (offset.x < -threshold || velocity.x < -velocityThreshold) {
        onNext();
      } else if (offset.x > threshold || velocity.x > velocityThreshold) {
        onPrev();
      }

      // Reset after a short delay so click handlers can check
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    },
    [onNext, onPrev, threshold, velocityThreshold]
  );

  return {
    /** Pass these props to a `motion.div` that wraps the carousel content */
    dragProps: {
      drag: "x" as const,
      dragConstraints: { left: 0, right: 0 },
      dragElastic: { left: 0.18, right: 0.18 },
      dragMomentum: false,
      dragTransition: { bounceStiffness: 400, bounceDamping: 30 },
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      style: { touchAction: "pan-y" } as React.CSSProperties,
      whileDrag: { cursor: "grabbing" },
    },
    /** True while the user is actively dragging — use to suppress click handlers */
    isDraggingRef,
  };
}
