"use client";

import { useState } from "react";
import { Icon } from "@/lib/client/icons";

export function PasswordField({
   label = "Password",
   name = "password",
   placeholder = "Password",
   minLength,
   autoComplete = "current-password",
   value,
   onChange,
}: {
   label?: string;
   name?: string;
   placeholder?: string;
   minLength?: number;
   autoComplete?: string;
   value?: string;
   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
   const [show, setShow] = useState(false);
   return (
      <label className="field-label">
         {label}
         <span className="input-wrap has-action">
            <span className="input-icon">
               <Icon name="lock" />
            </span>
            <input
               type={show ? "text" : "password"}
               name={name}
               placeholder={placeholder}
               autoComplete={autoComplete}
               minLength={minLength || undefined}
               required
               value={value}
               onChange={onChange}
            />
            <button
               type="button"
               className="eye"
               aria-label={show ? "Hide password" : "Show password"}
               onClick={() => setShow((s) => !s)}
            >
               <span className="eye-open" hidden={show}>
                  <Icon name="eye" />
               </span>
               <span className="eye-closed" hidden={!show}>
                  <Icon name="eyeOff" />
               </span>
            </button>
         </span>
      </label>
   );
}
