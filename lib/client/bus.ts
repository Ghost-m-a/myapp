"use client";

type Handler = (payload?: unknown) => void;

const listeners: Record<string, Handler[]> = {};

/** Tiny cross-component event bus ("auth:open", "business:new"). */
export const bus = {
   on(event: string, fn: Handler): () => void {
      (listeners[event] ||= []).push(fn);
      return () => {
         listeners[event] = (listeners[event] || []).filter((h) => h !== fn);
      };
   },
   emit(event: string, payload?: unknown) {
      (listeners[event] || []).forEach((fn) => fn(payload));
   },
};
