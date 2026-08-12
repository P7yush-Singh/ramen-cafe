import dns from "node:dns";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define MONGODB_URI in .env.local"
  );
}

let cached =
  global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise =
      mongoose
        .connect(MONGODB_URI)
        .then((mongoose) => {
          console.log(
            "MongoDB connected successfully"
          );

          return mongoose;
        })
        .catch((error) => {
          cached.promise = null;

          console.error(
            "MongoDB connection failed:",
            error
          );

          throw error;
        });
  }

  cached.conn =
    await cached.promise;

  return cached.conn;
}