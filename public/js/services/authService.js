import { api } from "./api.js";

export async function getCurrentUser() {
   try {
      return (await api("/auth/me")).user;
   } catch {
      return null; // not logged in (a 401 here is normal)
   }
}

export async function signup(data) {
   return (await api("/auth/signup", { method: "POST", body: data })).user;
}

export async function login(data) {
   return (await api("/auth/login", { method: "POST", body: data })).user;
}

export async function logout() {
   await api("/auth/logout", { method: "POST" }).catch(() => {});
}
