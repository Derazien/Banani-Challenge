import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type AnimationDelayProps = {
  index: number;
  initialDelay?: number;
  staggerDelay?: number;
  maxDelay?: number;
};

export function getAnimationDelay({ 
  index, 
  initialDelay = 0.1, 
  staggerDelay = 0.05, 
  maxDelay = 0.5 
}: AnimationDelayProps): number {
  const delay = initialDelay + index * staggerDelay;
  return Math.min(delay, maxDelay);
}
