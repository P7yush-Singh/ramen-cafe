import { MongoClient } from "mongodb";
import "dotenv/config";

const uri = process.env.MONGODB_URI;

console.log(
  "MongoDB URI exists:",
  Boolean(uri)
);

const client =
  new MongoClient(uri);

try {
  await client.connect();

  await client.db().command({
    ping: 1,
  });

  console.log(
    "✅ MongoDB Atlas connected successfully!"
  );
} catch (error) {
  console.error(
    "❌ MongoDB connection failed:"
  );

  console.error(
    error.message
  );
} finally {
  await client.close();
}