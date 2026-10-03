const listeners = {};

export const bus = {
   on(event, fn) {
      (listeners[event] ||= []).push(fn);
   },
   emit(event, payload) {
      (listeners[event] || []).forEach((fn) => fn(payload));
   },
};
