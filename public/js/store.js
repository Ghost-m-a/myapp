const state = {
   user: null,
   businesses: [],
   notifications: [],
   workspace: "personal", // "personal" or a business id
};
const listeners = new Set();

export const getState = () => state;

export function setState(patch) {
   Object.assign(state, patch);
   listeners.forEach((fn) => fn(state));
}

export function setWorkspace(id) {
   localStorage.setItem("workspace", id);
   setState({ workspace: id });
}

// Runs fn now, and again every time the state changes
export function subscribe(fn) {
   listeners.add(fn);
   fn(state);
   return () => listeners.delete(fn);
}
