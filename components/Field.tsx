import type { InputHTMLAttributes } from "react";
import { Icon, type IconName } from "@/lib/client/icons";

/** A labeled input with an icon on the left. */
export function InputField({
   label,
   icon,
   name,
   type = "text",
   placeholder = "",
   autoComplete,
   required = true,
   ...rest
}: {
   label: string;
   icon: IconName;
} & InputHTMLAttributes<HTMLInputElement>) {
   return (
      <label className="field-label">
         {label}
         <span className="input-wrap">
            <span className="input-icon">
               <Icon name={icon} />
            </span>
            <input
               type={type}
               name={name}
               placeholder={placeholder}
               autoComplete={autoComplete}
               required={required}
               {...rest}
            />
         </span>
      </label>
   );
}
