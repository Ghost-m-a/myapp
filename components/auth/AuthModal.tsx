"use client";

import {
   useCallback,
   useEffect,
   useRef,
   useState,
   type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { bus } from "@/lib/client/bus";
import { api } from "@/lib/client/api";
import { useSession } from "@/lib/client/store";
import { fileToAvatar } from "@/lib/client/utils";
import { Icon } from "@/lib/client/icons";
import { AuthHeader } from "@/components/AuthHeader";
import { InputField } from "@/components/Field";
import { PasswordField } from "@/components/PasswordField";
import { SocialButtons } from "@/components/SocialButtons";
import type { UserDTO } from "@/lib/types";

type Tab = "login" | "signup";

export function AuthModal() {
   const router = useRouter();
   const { startSession } = useSession();
   const [open, setOpen] = useState(false);
   const [tab, setTab] = useState<Tab>("login");
   const [error, setError] = useState("");
   const [resetKey, setResetKey] = useState(0);

   useEffect(
      () =>
         bus.on("auth:open", (t) => {
            setTab(t === "signup" ? "signup" : "login");
            setError("");
            setOpen(true);
         }),
      [],
   );

   useEffect(() => {
      document.body.classList.toggle("modal-open", open);
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") close();
      };
      if (open) document.addEventListener("keydown", onKey);
      return () => {
         document.body.classList.remove("modal-open");
         document.removeEventListener("keydown", onKey);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open]);

   const close = useCallback(() => {
      setOpen(false);
      setError("");
      setResetKey((k) => k + 1); // remount faces to reset the forms
   }, []);

   function showTab(t: Tab) {
      setTab(t);
      setError("");
   }

   async function onSuccess(user: UserDTO) {
      await startSession(user); // loads businesses + notifications
      router.push("/");
      close();
   }

   return (
      <div
         id="authModal"
         className="modal"
         hidden={!open}
         onClick={(e) => {
            if (e.target === e.currentTarget) close();
         }}
      >
         <div
            className={`auth-card${tab === "signup" ? " flipped" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Log in or sign up"
         >
            <button
               className="icon-btn modal-close"
               aria-label="Close"
               onClick={close}
            >
               <Icon name="close" />
            </button>
            <div key={resetKey} style={{ display: "contents" }}>
               <LoginFace
                  active={tab === "login"}
                  error={error}
                  onError={setError}
                  onSuccess={onSuccess}
                  onFlip={() => showTab("signup")}
               />
               <SignupFace
                  active={tab === "signup"}
                  error={error}
                  onError={setError}
                  onSuccess={onSuccess}
                  onFlip={() => showTab("login")}
               />
            </div>
         </div>
      </div>
   );
}

interface FaceProps {
   active: boolean;
   error: string;
   onError: (msg: string) => void;
   onSuccess: (user: UserDTO) => Promise<void>;
   onFlip: () => void;
}

function useAutoFocus(active: boolean) {
   const ref = useRef<HTMLElement>(null);
   useEffect(() => {
      if (!active) return;
      const first = ref.current?.querySelector<HTMLInputElement>(
         "input:not([type=file]):not([type=checkbox])",
      );
      const t = setTimeout(() => first?.focus(), 350); // wait for the flip
      return () => clearTimeout(t);
   }, [active]);
   return ref;
}

function LoginFace({ active, error, onError, onSuccess, onFlip }: FaceProps) {
   const ref = useAutoFocus(active);
   const [busy, setBusy] = useState(false);

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      setBusy(true);
      try {
         const { user } = await api<{ user: UserDTO }>("/auth/login", {
            method: "POST",
            body: {
               identifier: data.get("identifier"),
               password: data.get("password"),
               remember:
                  (form.elements.namedItem("remember") as HTMLInputElement)
                     ?.checked ?? true,
            },
         });
         await onSuccess(user);
      } catch (err) {
         onError((err as Error).message);
      } finally {
         setBusy(false);
      }
   }

   return (
      <section
         className="auth-face front"
         data-face="login"
         inert={!active}
         ref={ref}
      >
         <AuthHeader
            title="Welcome back"
            subtitle="Enter your credentials to access your workspace"
         />
         <p className="error" role="alert" hidden={!error}>
            {error}
         </p>

         <form id="loginForm" className="auth-form" onSubmit={onSubmit}>
            <InputField
               label="Email or Username"
               icon="mail"
               name="identifier"
               placeholder="name@company.com"
               autoComplete="username"
            />
            <PasswordField placeholder="Your password" />

            <div className="auth-row">
               <label className="check">
                  <input type="checkbox" name="remember" defaultChecked />{" "}
                  Remember me
               </label>
               <button
                  type="button"
                  className="link-btn underline"
                  onClick={() => onError("Password reset isn't available yet.")}
               >
                  Forgot Password?
               </button>
            </div>

            <button
               type="submit"
               className="btn btn-primary btn-block"
               disabled={busy}
            >
               Log In
            </button>
         </form>

         <SocialButtons
            providers={["Google", "Apple"]}
            label="or continue with"
            onSocial={(p) => onError(`${p} login isn't available yet.`)}
         />

         <p className="switch-text">
            Don&apos;t have an account?{" "}
            <button type="button" className="link-btn" onClick={onFlip}>
               Sign up
            </button>
         </p>
      </section>
   );
}

function SignupFace({ active, error, onError, onSuccess, onFlip }: FaceProps) {
   const ref = useAutoFocus(active);
   const [avatar, setAvatar] = useState<string | null>(null);
   const [busy, setBusy] = useState(false);

   async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
         setAvatar(await fileToAvatar(file));
      } catch {
         onError("Could not read that image. Try another one.");
      }
   }

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const data = new FormData(e.currentTarget);

      if (data.get("password") !== data.get("confirm")) {
         return onError("Passwords do not match.");
      }

      setBusy(true);
      try {
         const { user } = await api<{ user: UserDTO }>("/auth/signup", {
            method: "POST",
            body: {
               name: data.get("name"),
               email: data.get("email"),
               password: data.get("password"),
               role: data.get("role"),
               avatar,
               ref: localStorage.getItem("ref") || undefined, // referral link code
            },
         });
         localStorage.removeItem("ref");
         await onSuccess(user);
      } catch (err) {
         onError((err as Error).message);
      } finally {
         setBusy(false);
      }
   }

   return (
      <section
         className="auth-face signup-face"
         data-face="signup"
         inert={!active}
         ref={ref}
      >
         <AuthHeader
            title="Create Account"
            subtitle="Get started with your secure cloud workspace today"
         />
         <p className="error" role="alert" hidden={!error}>
            {error}
         </p>

         <form id="signupForm" className="auth-form" onSubmit={onSubmit}>
            <label className="avatar-upload">
               <span
                  className="avatar avatar-lg"
                  style={
                     avatar ? { backgroundImage: `url(${avatar})` } : undefined
                  }
               >
                  {!avatar && "+"}
               </span>
               <span>
                  Add a profile picture <small>(optional)</small>
               </span>
               <input
                  type="file"
                  name="avatarFile"
                  accept="image/*"
                  hidden
                  onChange={onPickAvatar}
               />
            </label>

            <InputField
               label="Full Name"
               icon="user"
               name="name"
               placeholder="John Doe"
               autoComplete="name"
            />
            <InputField
               label="Email"
               icon="mail"
               name="email"
               type="email"
               placeholder="name@company.com"
               autoComplete="email"
            />
            <PasswordField
               placeholder="At least 6 characters"
               minLength={6}
               autoComplete="new-password"
            />
            <PasswordField
               label="Confirm Password"
               name="confirm"
               placeholder="Repeat your password"
               autoComplete="new-password"
            />

            <label className="field-label">
               Role
               <span className="input-wrap has-action">
                  <span className="input-icon">
                     <Icon name="briefcase" />
                  </span>
                  <select name="role" required defaultValue="">
                     <option value="" disabled>
                        Select your role
                     </option>
                     <option value="advertiser">Advertiser</option>
                     <option value="creator">Content creator</option>
                  </select>
                  <span className="input-icon right">
                     <Icon name="chevronDown" />
                  </span>
               </span>
            </label>

            <label className="check">
               <input type="checkbox" name="terms" required />
               <span>
                  I agree to the{" "}
                  <a href="#" className="underline">
                     Terms and Conditions
                  </a>
               </span>
            </label>

            <button
               type="submit"
               className="btn btn-primary btn-block"
               disabled={busy}
            >
               Sign Up
            </button>
         </form>

         <SocialButtons
            providers={["Google", "Apple", "Facebook"]}
            label="or sign up with"
            onSocial={(p) => onError(`${p} login isn't available yet.`)}
         />

         <p className="switch-text">
            Already have an account?{" "}
            <button type="button" className="link-btn" onClick={onFlip}>
               Log in
            </button>
         </p>
      </section>
   );
}
