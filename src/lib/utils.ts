import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debug configuration
const DEBUG_ENABLED = import.meta.env.DEV && false; // Set to false to disable all debug logs

// Debug logging utility
export const debugLog = {
  log: (...args: any[]) => {
    if (DEBUG_ENABLED) {
    }
  },
  warn: (...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.error(...args);
    }
  },
  info: (...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.info(...args);
    }
  }
};
