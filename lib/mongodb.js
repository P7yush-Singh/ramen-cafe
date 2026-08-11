import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined in .env.local"
  );
}

let cached =
  global.mongooseConnection;

if (!cached) {
  cached =
    global.mongooseConnection = {
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
      mongoose.connect(
        MONGODB_URI,
        {
          bufferCommands: false,
        }
      );
  }

  try {
    cached.conn =
      await cached.promise;

    console.log(
      "MongoDB connected successfully"
    );

    return cached.conn;
  } catch (error) {
    cached.promise = null;

    console.error(
      "MongoDB connection failed:",
      error
    );

    throw error;
  }
}