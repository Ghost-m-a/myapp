import mongoose from "mongoose";

interface MongooseCache {
   conn: typeof mongoose | null;
   promise: Promise<typeof mongoose> | null;
}

declare global {
   // eslint-disable-next-line no-var
   var _mongoose: MongooseCache | undefined;
}

const cache: MongooseCache = (global._mongoose ??= {
   conn: null,
   promise: null,
});

export default async function connectDB(): Promise<typeof mongoose> {
   if (cache.conn) return cache.conn;
   if (!process.env.MONGODB_URI)
      throw new Error("MONGODB_URI is missing. Check your .env file.");

   try {
      cache.promise ??= mongoose.connect(process.env.MONGODB_URI, {
         bufferCommands: false,
      });
      cache.conn = await cache.promise;
   } catch (err) {
      cache.promise = null;
      throw err;
   }
   return cache.conn;
}
