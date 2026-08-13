import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAddOns(addOns) {
  if (!Array.isArray(addOns)) {
    return [];
  }

  return addOns
    .map((item) => ({
      name: String(item.name || "").trim(),
      price: Number(item.price) || 0,
      isAvailable:
        item.isAvailable !== false,
    }))
    .filter((item) => item.name);
}

function normalizeProduct(body) {
  return {
    name: String(body.name || "").trim(),

    description: String(
      body.description || ""
    ).trim(),

    category: String(
      body.category || ""
    ).trim(),

    price: Number(body.price),

    image: String(
      body.image || ""
    ).trim(),

    foodType:
      body.foodType === "non-veg"
        ? "non-veg"
        : "veg",

    isAvailable:
      body.isAvailable !== false,

    isPopular:
      body.isPopular === true,

    isFeatured:
      body.isFeatured === true,

    addOns: normalizeAddOns(
      body.addOns
    ),

    customization: {
      noodles:
        Array.isArray(
          body.customization?.noodles
        )
          ? body.customization.noodles
              .map((item) =>
                String(item).trim()
              )
              .filter(Boolean)
          : [],

      spiceLevels:
        Array.isArray(
          body.customization
            ?.spiceLevels
        )
          ? body.customization.spiceLevels
              .map((item) =>
                String(item).trim()
              )
              .filter(Boolean)
          : [],
    },

    sortOrder:
      Number(body.sortOrder) || 0,

    metaTitle: String(
      body.metaTitle || ""
    ).trim(),

    metaDescription: String(
      body.metaDescription || ""
    ).trim(),
  };
}


// ============================================================
// GET PRODUCTS
// ============================================================

export async function GET() {
  try {
    await connectDB();

    const products =
      await Product.find({})
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
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to load products.",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// CREATE PRODUCT
// ============================================================

export async function POST(request) {
  try {
    await connectDB();

    const body =
      await request.json();

    const product =
      normalizeProduct(body);

    if (!product.name) {
      return Response.json(
        {
          success: false,
          error:
            "Product name is required.",
        },
        { status: 400 }
      );
    }

    if (!product.category) {
      return Response.json(
        {
          success: false,
          error:
            "Product category is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(
        product.price
      ) ||
      product.price < 0
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Valid product price is required.",
        },
        { status: 400 }
      );
    }

    const baseSlug =
      slugify(product.name);

    let slug = baseSlug;
    let counter = 1;

    while (
      await Product.exists({
        slug,
      })
    ) {
      slug =
        `${baseSlug}-${counter}`;

      counter++;
    }

    const created =
      await Product.create({
        ...product,
        slug,
      });

    return Response.json(
      {
        success: true,
        product: created,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to create product.",
      },
      {
        status: 500,
      }
    );
  }
}