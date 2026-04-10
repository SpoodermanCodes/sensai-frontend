'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ThinkingPattern {
  keystrokes: number;
  pauses: number[];
  deletions: number;
  timeSpent: number;
  startTime: number;
}

interface ThinkingPatternTrackerProps {
  onPatternUpdate?: (pattern: ThinkingPattern) => void;
  enabled?: boolean;
}

export default function ThinkingPatternTracker({ 
  onPatternUpdate, 
  enabled = true 
}: ThinkingPatternTrackerProps) {
  const patternRef = useRef<ThinkingPattern>({
    keystrokes: 0,
    pauses: [],
    deletions: 0,
    timeSpent: 0,
    startTime: Date.now()
  });
  
  const lastKeystrokeTime = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  const notifyUpdate = useCallback(() => {
    if (onPatternUpdate) {
      onPatternUpdate(patternRef.current);
    }
  }, [onPatternUpdate]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeystrokeTime.current;
      
      patternRef.current = {
        ...patternRef.current,
        keystrokes: patternRef.current.keystrokes + 1,
        deletions: (e.key === 'Backspace' || e.key === 'Delete') 
          ? patternRef.current.deletions + 1 
          : patternRef.current.deletions,
        pauses: timeSinceLastKey > 2000 
          ? [...patternRef.current.pauses, timeSinceLastKey] 
          : patternRef.current.pauses,
        timeSpent: now - patternRef.current.startTime
      };
      
      lastKeystrokeTime.current = now;
      notifyUpdate();
    };

    intervalRef.current = setInterval(() => {
      patternRef.current = {
        ...patternRef.current,
        timeSpent: Date.now() - patternRef.current.startTime
      };
      notifyUpdate();
    }, 1000);

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, notifyUpdate]);

  return null;
}
