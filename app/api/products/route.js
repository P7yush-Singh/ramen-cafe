import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      isAvailable: true,
    })
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .lean();

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Public products API error:", error);

    return Response.json(
      {
        success: false,
        error: "Unable to load menu.",
      },
      {
        status: 500,
      }
    );
  }
}