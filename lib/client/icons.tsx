/**
 * The legacy SVG icon set, ported 1:1. Stroke icons render with class
 * "icon", brand icons with class "icon-fill" (the CSS styles both).
 */
interface IconDef {
   inner: string;
   fill?: boolean;
}

const i = (inner: string): IconDef => ({ inner });
const f = (inner: string): IconDef => ({ inner, fill: true });

export const icons = {
   menu: i('<path d="M3 6h18M3 12h18M3 18h18" />'),
   search: i('<circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />'),
   bell: i(
      '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />',
   ),
   coin: i(
      '<circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />',
   ),
   close: i('<path d="M6 6l12 12M18 6 6 18" />'),
   eye: i(
      '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />',
   ),
   eyeOff: i(
      '<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.7A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" />',
   ),
   logo: i(
      '<path d="M12 2.5 20.5 7.25v9.5L12 21.5l-8.5-4.75v-9.5z" /><circle cx="12" cy="12" r="3" />',
   ),
   mail: i('<rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />'),
   lock: i(
      '<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />',
   ),
   user: i('<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />'),
   briefcase: i(
      '<rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />',
   ),
   chevronDown: i('<path d="m6 9 6 6 6-6" />'),
   home: i(
      '<path d="M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />',
   ),
   messages: i(
      '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />',
   ),
   townhall: i(
      '<rect x="5" y="8" width="14" height="12" rx="2" /><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M5 13h14" />',
   ),
   partners: i(
      '<circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />',
   ),
   affiliates: i(
      '<circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />',
   ),
   discover: i('<circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" />'),
   settings: i(
      '<circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />',
   ),
   panel: i('<rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" />'),
   help: i(
      '<circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />',
   ),
   sparkle: i(
      '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />',
   ),
   plus: i('<path d="M12 5v14M5 12h14" />'),
   chevronRight: i('<path d="m9 6 6 6-6 6" />'),
   megaphone: i(
      '<path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1zM18 9a4 4 0 0 1 0 6" />',
   ),
   chart: i('<path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-7" />'),
   creators: i(
      '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />',
   ),
   shield: i(
      '<path d="M12 3 4.5 6v5.5c0 4.4 3 8.2 7.5 9.5 4.5-1.3 7.5-5.1 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" />',
   ),
   orders: i('<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />'),
   globe: i(
      '<circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />',
   ),
   legal: i(
      '<path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M9.5 14l2 2 3.5-4" />',
   ),
   moon: i('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />'),
   logout: i(
      '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M20 12H9" />',
   ),
   box: i(
      '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" />',
   ),
   card: i('<rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" />'),
   users: i(
      '<circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.3A6.5 6.5 0 0 1 21.5 20" />',
   ),
   rocket: i(
      '<path d="M5 19c0-3 1-4 3-4l1 1c0 2-1 3-4 3zM9 15l-1-1c0-5 4-10 11-11 0 7-5 11-10 11zM14.5 9.5h.01" />',
   ),
   cards: i(
      '<rect x="6" y="4" width="15" height="11" rx="2" /><path d="M3 8v9a3 3 0 0 0 3 3h12M6 9h15" />',
   ),
   support: i(
      '<path d="M4 8c0-2 3.6-3.5 8-3.5S20 6 20 8s-3.6 3.5-8 3.5S4 10 4 8zM4 8v8c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V8" />',
   ),
   dots: i('<path d="M5 12h.01M12 12h.01M19 12h.01" />'),
   plusCircle: i('<circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" />'),
   code: i('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />'),
   google: f(
      '<path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" /><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.29v3.09A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3V6.61H1.29a12 12 0 0 0 0 10.78l4-3.09z" /><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l4 3.09C6.23 6.86 8.88 4.75 12 4.75z" />',
   ),
   github: f(
      '<path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />',
   ),
   apple: f(
      '<path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />',
   ),
   facebook: f(
      '<path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />',
   ),
   edit: i('<path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" />'),
   heart: i(
      '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />',
   ),
   bars: i('<path d="M5 20v-8M12 20V5M19 20v-9" />'),
   share: i('<path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" />'),
   send: i('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />'),
   link: i(
      '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />',
   ),
   trash: i('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />'),
   back: i('<path d="m15 6-6 6 6 6" />'),
   bolt: i('<path d="M13 3 5 14h6l-1 7 8-11h-6z" />'),
   check: i('<path d="m5 12 5 5 9-10" />'),
   receipt: i('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" />'),
   tag: i('<path d="M3 12V4h8l10 10-8 8z" /><path d="M7.5 8h.01" />'),
   arrowRight: i('<path d="M5 12h14M13 6l6 6-6 6" />'),
   download: i('<path d="M12 4v11M7 11l5 5 5-5M5 20h14" />'),
} as const;

export type IconName = keyof typeof icons;

export function Icon({
   name,
   className,
}: {
   name: IconName;
   className?: string;
}) {
   const def = icons[name];
   return (
      <svg
         viewBox="0 0 24 24"
         className={className ?? (def.fill ? "icon-fill" : "icon")}
         aria-hidden="true"
         dangerouslySetInnerHTML={{ __html: def.inner }}
      />
   );
}
