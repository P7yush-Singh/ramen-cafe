import mongoose from "mongoose";

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

// ============================================================
// GET SINGLE PRODUCT
// ============================================================

export async function GET(
  request,
  { params }
) {
  try {
    const auth =
      await requireProductAccess();

    if (auth.response) {
      return auth.response;
    }

    await connectDB();

    const {
      id,
    } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

    const product =
      await Product.findById(
        id
      ).lean();

    if (!product) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "GET ADMIN PRODUCT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to load product.",
      },
      {
        status: 500,
      }
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
    const auth =
      await requireProductAccess();

    if (auth.response) {
      return auth.response;
    }

    await connectDB();

    const {
      id,
    } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

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

    const update = {};

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    if (
      "name" in body
    ) {
      const name =
        String(
          body.name || ""
        ).trim();

      if (!name) {
        return Response.json(
          {
            success: false,
            error:
              "Product name cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      update.name =
        name;
    }

    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    if (
      "description" in
      body
    ) {
      update.description =
        String(
          body.description ||
            ""
        ).trim();
    }

    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (
      "category" in
      body
    ) {
      const category =
        String(
          body.category ||
            ""
        ).trim();

      if (!category) {
        return Response.json(
          {
            success: false,
            error:
              "Product category cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      update.category =
        category;
    }

    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    if (
      "price" in body
    ) {
      const price =
        Number(
          body.price
        );

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
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

      update.price =
        price;
    }

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    if (
      "image" in body
    ) {
      update.image =
        String(
          body.image || ""
        ).trim();
    }

    // --------------------------------------------------------
    // FOOD TYPE
    // --------------------------------------------------------

    if (
      "foodType" in
      body
    ) {
      update.foodType =
        body.foodType ===
        "non-veg"
          ? "non-veg"
          : "veg";
    }

    // --------------------------------------------------------
    // AVAILABILITY
    // --------------------------------------------------------

    if (
      "isAvailable" in
      body
    ) {
      update.isAvailable =
        body.isAvailable ===
        true;
    }

    // --------------------------------------------------------
    // POPULAR
    // --------------------------------------------------------

    if (
      "isPopular" in
      body
    ) {
      update.isPopular =
        body.isPopular ===
        true;
    }

    // --------------------------------------------------------
    // FEATURED
    // --------------------------------------------------------

    if (
      "isFeatured" in
      body
    ) {
      update.isFeatured =
        body.isFeatured ===
        true;
    }

    // --------------------------------------------------------
    // ADD-ONS
    // --------------------------------------------------------

    if (
      "addOns" in body
    ) {
      update.addOns =
        normalizeAddOns(
          body.addOns
        );
    }

    // --------------------------------------------------------
    // CUSTOMIZATION
    // --------------------------------------------------------

    if (
      "customization" in
      body
    ) {
      update.customization = {
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
                .filter(
                  Boolean
                )
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
                .filter(
                  Boolean
                )
            : [],
      };
    }

    // --------------------------------------------------------
    // SORT ORDER
    // --------------------------------------------------------

    if (
      "sortOrder" in
      body
    ) {
      const sortOrder =
        Number(
          body.sortOrder
        );

      update.sortOrder =
        Number.isFinite(
          sortOrder
        )
          ? sortOrder
          : 0;
    }

    // --------------------------------------------------------
    // SEO
    // --------------------------------------------------------

    if (
      "metaTitle" in
      body
    ) {
      update.metaTitle =
        String(
          body.metaTitle ||
            ""
        ).trim();
    }

    if (
      "metaDescription" in
      body
    ) {
      update.metaDescription =
        String(
          body.metaDescription ||
            ""
        ).trim();
    }

    // --------------------------------------------------------
    // SLUG
    // --------------------------------------------------------

    if (update.name) {
      const baseSlug =
        slugify(
          update.name
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
        await Product.exists(
          {
            slug,
            _id: {
              $ne: id,
            },
          }
        )
      ) {
        slug =
          `${baseSlug}-${counter}`;

        counter++;
      }

      update.slug =
        slug;
    }

    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    const product =
      await Product.findByIdAndUpdate(
        id,
        update,
        {
          new: true,
          runValidators:
            true,
        }
      );

    if (!product) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "UPDATE ADMIN PRODUCT ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to update product.",
      },
      {
        status: 500,
      }
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
    const auth =
      await requireProductAccess();

    if (auth.response) {
      return auth.response;
    }

    await connectDB();

    const {
      id,
    } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid product ID.",
        },
        {
          status: 400,
        }
      );
    }

    const deleted =
      await Product.findByIdAndDelete(
        id
      );

    if (!deleted) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE ADMIN PRODUCT ERROR:",
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