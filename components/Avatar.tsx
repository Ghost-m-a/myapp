interface AvatarUser {
   name?: string | null;
   avatar?: string | null;
}

/** Shows the picture if there is one, otherwise the first letter of the name. */
export function Avatar({
   user,
   size = "",
}: {
   user: AvatarUser | null | undefined;
   size?: "" | "avatar-lg" | "avatar-xl";
}) {
   const cls = `avatar ${size}`.trim();
   if (user?.avatar && user.avatar.startsWith("data:image/")) {
      return (
         <span
            className={cls}
            style={{ backgroundImage: `url('${user.avatar}')` }}
            aria-hidden="true"
         />
      );
   }
   return (
      <span className={cls} aria-hidden="true">
         {(user?.name ?? "").trim().charAt(0) || "?"}
      </span>
   );
}
