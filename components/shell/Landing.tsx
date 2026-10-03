"use client";

import { bus } from "@/lib/client/bus";

/** Logged-out hero shown in place of the app. */
export function Landing() {
   return (
      <section id="landing" className="landing">
         <h1>Build something great.</h1>
         <p>Log in or create an account to get started.</p>
         <button
            className="btn btn-primary btn-lg"
            onClick={() => bus.emit("auth:open", "signup")}
         >
            Get started
         </button>
      </section>
   );
}
