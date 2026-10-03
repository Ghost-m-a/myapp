"use client";

import { useSession } from "@/lib/client/store";

export default function BillingPage() {
   const { user } = useSession();
   if (!user) return null;

   return (
      <div className="page">
         <h1>Billing</h1>
         <p className="muted">Your credit balance.</p>
         <section className="panel">
            <h3>Credits</h3>
            <p className="big-number">{user.credits}</p>
            <p className="muted">
               Buying more credits arrives with the payments step.
            </p>
         </section>
      </div>
   );
}
