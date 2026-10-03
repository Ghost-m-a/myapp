import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
   title: "MyApp",
   description: "Build something great.",
};

export const viewport: Viewport = {
   width: "device-width",
   initialScale: 1,
   viewportFit: "cover",
};

// Set the theme before first paint to avoid a flash of the wrong theme.
const themeInit = `(function(){try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <script dangerouslySetInnerHTML={{ __html: themeInit }} />
         </head>
         <body>
            <Providers>{children}</Providers>
         </body>
      </html>
   );
}
