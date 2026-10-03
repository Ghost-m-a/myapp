"use client";

export class ApiRequestError extends Error {
   constructor(
      message: string,
      public status: number,
   ) {
      super(message);
      this.name = "ApiRequestError";
   }
}

interface ApiOptions {
   method?: string;
   body?: unknown;
}

/** Same-origin fetch wrapper for /api — cookies ride along automatically. */
export async function api<T = Record<string, unknown>>(
   path: string,
   { method = "GET", body }: ApiOptions = {},
): Promise<T> {
   const res = await fetch(`/api${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
   });

   const data = (await res.json().catch(() => ({}))) as { message?: string };
   if (!res.ok) {
      throw new ApiRequestError(
         data.message || "Something went wrong.",
         res.status,
      );
   }
   return data as T;
}
