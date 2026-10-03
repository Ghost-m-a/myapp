"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/client/api";
import { bus } from "@/lib/client/bus";

type Mode = "verify" | "reset";
type Status = "loading" | "ready" | "success" | "error";

export function AuthActionPage({ mode }: { mode: Mode }) {
   const [token, setToken] = useState("");
   const [status, setStatus] = useState<Status>("loading");
   const [error, setError] = useState("");
   const [busy, setBusy] = useState(false);
   const verificationRequest = useRef<Promise<unknown> | null>(null);

   useEffect(() => {
      let active = true;
      const queryToken =
         new URLSearchParams(window.location.search).get("token") || "";
      setToken(queryToken);

      if (!queryToken) {
         setError("This link is missing its security token.");
         setStatus("error");
      } else if (mode === "verify") {
         verificationRequest.current ??= api("/auth/email/verify", {
            method: "POST",
            body: { token: queryToken },
         });
         verificationRequest.current
            .then(() => {
               if (active) setStatus("success");
            })
            .catch((err: unknown) => {
               if (active) {
                  setError(
                     (err as Error).message ||
                        "This verification link is invalid or expired.",
                  );
                  setStatus("error");
               }
            });
      } else {
         api<{ valid: boolean }>(
            `/auth/password/reset?token=${encodeURIComponent(queryToken)}`,
         )
            .then(({ valid }) => {
               if (active && valid) {
                  setStatus("ready");
               } else if (active) {
                  setError("This reset link is invalid or expired.");
                  setStatus("error");
               }
            })
            .catch((err: unknown) => {
               if (active) {
                  setError(
                     (err as Error).message ||
                        "Could not check this reset link.",
                  );
                  setStatus("error");
               }
            });
      }

      return () => {
         active = false;
      };
   }, [mode]);

   async function resetPassword(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const password = String(data.get("password") || "");
      if (password !== data.get("confirm")) {
         setError("Passwords do not match.");
         setStatus("error");
         return;
      }

      setBusy(true);
      setError("");
      try {
         await api("/auth/password/reset", {
            method: "POST",
            body: { token, password },
         });
         setStatus("success");
      } catch (err) {
         setError(
            (err as Error).message || "This reset link is invalid or expired.",
         );
         setStatus("error");
      } finally {
         setBusy(false);
      }
   }

   const title =
      mode === "verify" ? "Email verification" : "Reset your password";
   const description =
      status === "loading"
         ? "Checking your secure link..."
         : status === "success"
           ? mode === "verify"
              ? "Your email is verified. You can now log in."
              : "Your password has been changed. You can log in with the new password."
           : status === "error"
             ? error
             : "Choose a new password for your account.";

   return (
      <main className="auth-action-wrap">
         <section className="auth-action panel" aria-live="polite">
            <span className="market-eyebrow">MYAPP ACCOUNT</span>
            <h1>{title}</h1>
            <p className={status === "error" ? "error" : "auth-action-copy"}>
               {description}
            </p>
            {mode === "reset" && status === "ready" && (
               <form className="form" onSubmit={resetPassword}>
                  <label className="field">
                     New password
                     <input
                        name="password"
                        type="password"
                        minLength={6}
                        maxLength={72}
                        autoComplete="new-password"
                        required
                     />
                  </label>
                  <label className="field">
                     Confirm password
                     <input
                        name="confirm"
                        type="password"
                        minLength={6}
                        maxLength={72}
                        autoComplete="new-password"
                        required
                     />
                  </label>
                  <button
                     className="btn btn-primary"
                     type="submit"
                     disabled={busy}
                  >
                     {busy ? "Saving..." : "Save new password"}
                  </button>
               </form>
            )}
            {status === "success" && (
               <button
                  className="btn btn-primary"
                  onClick={() => bus.emit("auth:open", "login")}
               >
                  Log in
               </button>
            )}
            {status === "error" && mode === "verify" && (
               <button
                  className="btn btn-outline"
                  onClick={() => bus.emit("auth:open", "login")}
               >
                  Return to log in
               </button>
            )}
            {status === "error" && mode === "reset" && (
               <button
                  className="btn btn-outline"
                  onClick={() => bus.emit("auth:open", "login")}
               >
                  Return to log in
               </button>
            )}
         </section>
      </main>
   );
}
