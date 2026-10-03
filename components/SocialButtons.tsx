"use client";

import { Icon, type IconName } from "@/lib/client/icons";
import { toast } from "@/lib/client/toast";

const providerIcons: Record<string, IconName> = {
   Google: "google",
   Apple: "apple",
   Facebook: "facebook",
};

export function SocialButtons({
   providers = ["Google", "Apple"],
   label = "or continue with",
   onSocial,
}: {
   providers?: string[];
   label?: string;
   onSocial?: (provider: string) => void;
}) {
   return (
      <>
         <div className="divider">
            <span>{label}</span>
         </div>
         <div className="socials">
            {providers.map((name) => (
               <button
                  key={name}
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                     onSocial
                        ? onSocial(name)
                        : toast(`${name} sign-in isn't available yet.`)
                  }
               >
                  <Icon name={providerIcons[name]} /> Continue with {name}
               </button>
            ))}
         </div>
      </>
   );
}
