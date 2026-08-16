import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


// ============================================================
// GET SINGLE PRODUCT
// ============================================================

export async function GET(
  request,
  { params }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const product =
      await Product.findById(id).lean();

    if (!product) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "GET PRODUCT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to load product.",
      },
      { status: 500 }
    );
  }
}


// ============================================================
// UPDATE PRODUCT
// ============================================================

export async function PATCH(
  request,
  { params }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const update = {};

    if ("name" in body) {
      update.name =
        String(body.name).trim();
    }

    if ("description" in body) {
      update.description =
        String(
          body.description || ""
        ).trim();
    }

    if ("category" in body) {
      update.category =
        String(
          body.category || ""
        ).trim();
    }

    if ("price" in body) {
      update.price =
        Number(body.price);
    }

    if ("image" in body) {
      update.image =
        String(
          body.image || ""
        ).trim();
    }

    if ("foodType" in body) {
      update.foodType =
        body.foodType === "non-veg"
          ? "non-veg"
          : "veg";
    }

    if ("isAvailable" in body) {
      update.isAvailable =
        body.isAvailable === true;
    }

    if ("isPopular" in body) {
      update.isPopular =
        body.isPopular === true;
    }

    if ("isFeatured" in body) {
      update.isFeatured =
        body.isFeatured === true;
    }

    if ("addOns" in body) {
      update.addOns =
        Array.isArray(body.addOns)
          ? body.addOns
          : [];
    }

    if ("customization" in body) {
      update.customization = {
        noodles:
          Array.isArray(
            body.customization?.noodles
          )
            ? body.customization.noodles
            : [],

        spiceLevels:
          Array.isArray(
            body.customization
              ?.spiceLevels
          )
            ? body.customization
                .spiceLevels
            : [],
      };
    }

    if ("sortOrder" in body) {
      update.sortOrder =
        Number(body.sortOrder) || 0;
    }

    if ("metaTitle" in body) {
      update.metaTitle =
        String(
          body.metaTitle || ""
        ).trim();
    }

    if ("metaDescription" in body) {
      update.metaDescription =
        String(
          body.metaDescription || ""
        ).trim();
    }

    if (update.name) {
      update.slug =
        slugify(update.name);
    }

    const product =
      await Product.findByIdAndUpdate(
        id,
        update,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!product) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to update product.",
      },
      { status: 500 }
    );
  }
}


// ============================================================
// DELETE PRODUCT
// ============================================================

export async function DELETE(
  request,
  { params }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const deleted =
      await Product.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to delete product.",
      },
      {
        status: 500,
      }
    );
  }
}