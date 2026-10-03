import { NextResponse } from "next/server";

/** Expected, client-facing error with a status code. */
export class ApiError extends Error {
   constructor(
      public status: number,
      message: string,
   ) {
      super(message);
      this.name = "ApiError";
   }
}

export function fail(status: number, message: string): NextResponse {
   return NextResponse.json({ message }, { status });
}

interface MongoLikeError {
   code?: number;
   name?: string;
   errors?: Record<string, { message: string }>;
}

/** Turns any thrown error into the same JSON shape the Express app used. */
export function handleError(err: unknown): NextResponse {
   if (err instanceof ApiError) return fail(err.status, err.message);

   const e = err as MongoLikeError;
   if (e?.code === 11000) return fail(409, "That value is already taken.");
   if (e?.name === "ValidationError") {
      const first = Object.values(e.errors ?? {})[0];
      return fail(400, first?.message ?? "Invalid input.");
   }
   if (e?.name === "CastError") return fail(400, "Invalid id.");

   console.error(err);
   return fail(500, "Server error. Please try again.");
}

type RouteHandler<A extends unknown[]> = (...args: A) => Promise<Response>;

/** Wraps a route handler so thrown errors become JSON responses. */
export function route<A extends unknown[]>(fn: RouteHandler<A>) {
   return async (...args: A): Promise<Response> => {
      try {
         return await fn(...args);
      } catch (err) {
         return handleError(err);
      }
   };
}

export function escapeRegex(s: string): string {
   return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
