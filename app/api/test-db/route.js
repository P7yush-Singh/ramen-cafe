import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return Response.json(
      {
        success: true,
        message: "MongoDB connected successfully.",
        database: "connected",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "MongoDB test failed:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "MongoDB connection failed.",
        error: error.message,
        code: error.code || null,
        codeName:
          error.codeName || null,
      },
      {
        status: 500,
      }
    );
  }
}