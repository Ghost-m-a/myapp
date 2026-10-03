import { Icon } from "@/lib/client/icons";

export function AuthHeader({
   title,
   subtitle,
}: {
   title: string;
   subtitle: string;
}) {
   return (
      <div className="auth-header">
         <span className="auth-logo">
            <Icon name="logo" />
         </span>
         <h2>{title}</h2>
         <p>{subtitle}</p>
      </div>
   );
}
