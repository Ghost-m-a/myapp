const mongoose = require("mongoose");

const cache = (global._mongoose ||= { conn: null, promise: null });

module.exports = async function connectDB() {
   if (cache.conn) return cache.conn;
   if (!process.env.MONGODB_URI)
      throw new Error("MONGODB_URI is missing. Check your .env file.");

   try {
      cache.promise ||= mongoose.connect(process.env.MONGODB_URI, {
         bufferCommands: false,
      });
      cache.conn = await cache.promise;
   } catch (err) {
      cache.promise = null;
      throw err;
   }
   return cache.conn;
};
