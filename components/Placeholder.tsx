import Link from "next/link";
import { Icon } from "@/lib/client/icons";
import { titleFor } from "@/lib/nav";

/** Empty-state page for nav items that have no content yet (or 404). */
export function Placeholder({ path }: { path: string }) {
   const title = titleFor(path);

   if (!title) {
      return (
         <div className="page">
            <h1>Page not found</h1>
            <Link href="/" className="btn btn-primary">
               Back to Home
            </Link>
         </div>
      );
   }

   return (
      <div className="page">
         <h1>{title}</h1>
         <div className="empty">
            <span className="empty-icon">
               <Icon name="sparkle" />
            </span>
            <h3>Nothing here yet</h3>
            <p className="muted">The {title} page is ready for its content.</p>
         </div>
      </div>
   );
}
