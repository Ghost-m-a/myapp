"use client";

/** Crops the picture to a centered square and shrinks it to 128x128. */
export function fileToAvatar(file: File): Promise<string> {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
         const img = new Image();
         img.onerror = reject;
         img.onload = () => {
            const size = 128;
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = size;
            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            canvas
               .getContext("2d")!
               .drawImage(img, sx, sy, side, side, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
         };
         img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
   });
}

/** "Spark & Learn" -> "SL" */
export function initials(name = ""): string {
   return name
      .trim()
      .split(/\s+/)
      .filter((w) => /^[\p{L}\p{N}]/u.test(w))
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
}

export function timeAgo(date: string | Date): string {
   const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
   for (const [label, size] of [
      ["d", 86400],
      ["h", 3600],
      ["m", 60],
   ] as const) {
      if (s >= size) return `${Math.floor(s / size)}${label} ago`;
   }
   return "just now";
}

export const referralLink = (code: string): string =>
   `${location.origin}/?ref=${code}`;

export async function copyText(text: string): Promise<boolean> {
   try {
      await navigator.clipboard.writeText(text);
      return true;
   } catch {
      return false;
   }
}
