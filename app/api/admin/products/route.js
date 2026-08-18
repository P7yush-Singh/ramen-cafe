import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

import {
  requireProductAccess,
} from "@/lib/admin-auth";

// ============================================================
// HELPERS
// ============================================================

function slugify(value) {
  return String(
    value || ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      "");
}

function normalizeAddOns(
  addOns
) {
  if (
    !Array.isArray(
      addOns
    )
  ) {
    return [];
  }

  return addOns
    .map((item) => {
      const price =
        Number(
          item?.price
        );

      return {
        name: String(
          item?.name || ""
        )
          .trim()
          .slice(0, 100),

        price,

        isAvailable:
          item?.isAvailable !==
          false,
      };
    })
    .filter(
      (item) =>
        item.name &&
        Number.isFinite(
          item.price
        ) &&
        item.price >= 0
    );
}

function normalizeProduct(
  body
) {
  return {
    name: String(
      body.name || ""
    ).trim(),

    description: String(
      body.description || ""
    ).trim(),

    category: String(
      body.category || ""
    ).trim(),

    price:
      Number(body.price),

    image: String(
      body.image || ""
    ).trim(),

    foodType:
      body.foodType ===
      "non-veg"
        ? "non-veg"
        : "veg",

    isAvailable:
      body.isAvailable !==
      false,

    isPopular:
      body.isPopular ===
      true,

    isFeatured:
      body.isFeatured ===
      true,

    addOns:
      normalizeAddOns(
        body.addOns
      ),

    customization: {
      noodles:
        Array.isArray(
          body.customization
            ?.noodles
        )
          ? body.customization.noodles
              .map(
                (item) =>
                  String(
                    item
                  ).trim()
              )
              .filter(Boolean)
          : [],

      spiceLevels:
        Array.isArray(
          body.customization
            ?.spiceLevels
        )
          ? body.customization.spiceLevels
              .map(
                (item) =>
                  String(
                    item
                  ).trim()
              )
              .filter(Boolean)
          : [],
    },

    sortOrder:
      Number(
        body.sortOrder
      ) || 0,

    metaTitle: String(
      body.metaTitle || ""
    ).trim(),

    metaDescription:
      String(
        body.metaDescription ||
          ""
      ).trim(),
  };
}

// ============================================================
// GET PRODUCTS
// ============================================================

export async function GET() {
  try {
    const auth =
      await requireProductAccess();

    if (auth.response) {
      return auth.response;
    }

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
      "GET ADMIN PRODUCTS ERROR:",
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

export async function POST(
  request
) {
  try {
    const auth =
      await requireProductAccess();

    if (auth.response) {
      return auth.response;
    }

    await connectDB();

    let body;

    try {
      body =
        await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const product =
      normalizeProduct(
        body
      );

    if (!product.name) {
      return Response.json(
        {
          success: false,
          error:
            "Product name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!product.category) {
      return Response.json(
        {
          success: false,
          error:
            "Product category is required.",
        },
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // SLUG
    // --------------------------------------------------------

    const baseSlug =
      slugify(
        product.name
      );

    if (!baseSlug) {
      return Response.json(
        {
          success: false,
          error:
            "Product name cannot generate a valid slug.",
        },
        {
          status: 400,
        }
      );
    }

    let slug =
      baseSlug;

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

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    const created =
      await Product.create({
        ...product,
        slug,
      });

    return Response.json(
      {
        success: true,
        product:
          created,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE ADMIN PRODUCT ERROR:",
      error
    );

    if (
      error?.code ===
      11000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "A product with this information already exists.",
        },
        {
          status: 409,
        }
      );
    }

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