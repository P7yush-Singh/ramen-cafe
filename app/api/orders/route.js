import mongoose from "mongoose";
import { randomUUID } from "crypto";

import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";
import Order from "@/models/Order";

// ============================================================
// CONFIGURATION
// ============================================================

const TAX_RATE = 5;

const MIN_PREPARATION_MINUTES = 15;
const MAX_PREPARATION_MINUTES = 25;

const MAX_ITEMS_PER_ORDER = 50;
const MAX_QUANTITY_PER_ITEM = 99;

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 10;
const MAX_EMAIL_LENGTH = 254;

const ORDER_NUMBER_RETRY_LIMIT = 5;

// ============================================================
// RESPONSE HELPERS
// ============================================================

function successResponse(data, status = 200) {
  return Response.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

function errorResponse(
  message,
  status = 400,
  extra = {}
) {
  return Response.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    { status }
  );
}

// ============================================================
// BASIC HELPERS
// ============================================================

function normalizeText(
  value,
  maxLength = 500
) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function normalizeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function roundMoney(value) {
  const number =
    normalizeNumber(value);

  return (
    Math.round(
      (number + Number.EPSILON) * 100
    ) / 100
  );
}

// ============================================================
// TABLE HELPERS
// ============================================================

function normalizeTableId(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function isValidTableId(tableId) {
  return /^T[A-Z0-9-]+$/.test(
    tableId
  );
}

// ============================================================
// CUSTOMER HELPERS
// ============================================================

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .trim();
}

function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(
    phone
  );
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <=
      MAX_EMAIL_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  );
}

// ============================================================
// ORDER NUMBER
// ============================================================

function generateOrderNumber() {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(
      now.getMonth() + 1
    ).padStart(2, "0"),
    String(
      now.getDate()
    ).padStart(2, "0"),
  ].join("");

  const uniquePart =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  return `RC-${date}-${uniquePart}`;
}

// ============================================================
// ADDONS
// ============================================================

function normalizeAddons(addons) {
  if (!Array.isArray(addons)) {
    return [];
  }

  return addons
    .map((addon) => {
      if (
        !addon ||
        typeof addon !== "object" ||
        Array.isArray(addon)
      ) {
        return null;
      }

      const name =
        normalizeText(
          addon.name ||
            addon.title ||
            "",
          100
        );

      const price =
        roundMoney(
          normalizeNumber(
            addon.price
          )
        );

      if (!name) {
        return null;
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return null;
      }

      return {
        name,
        price,
      };
    })
    .filter(Boolean);
}

// ============================================================
// NORMALIZE CART ITEM
// ============================================================

function normalizeCartItem(
  item,
  index
) {
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    throw new Error(
      `Invalid cart item at position ${
        index + 1
      }.`
    );
  }

  // ----------------------------------------------------------
  // PRODUCT ID
  // ----------------------------------------------------------

  const productId =
    normalizeText(
      item.productId ||
        item.id ||
        item._id ||
        "",
      200
    );

  if (!productId) {
    throw new Error(
      `Cart item ${
        index + 1
      } is missing a product ID.`
    );
  }

  // ----------------------------------------------------------
  // PRODUCT NAME
  // ----------------------------------------------------------

  const name =
    normalizeText(
      item.name ||
        item.productName ||
        "",
      MAX_NAME_LENGTH
    );

  if (!name) {
    throw new Error(
      `Cart item ${
        index + 1
      } is missing a product name.`
    );
  }

  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  const image =
    normalizeText(
      item.image ||
        item.imageUrl ||
        "",
      1000
    );

  // ----------------------------------------------------------
  // QUANTITY
  // ----------------------------------------------------------

  const quantity =
    Math.floor(
      normalizeNumber(
        item.quantity
      )
    );

  if (
    quantity < 1 ||
    quantity >
      MAX_QUANTITY_PER_ITEM
  ) {
    throw new Error(
      `Invalid quantity for ${name}.`
    );
  }

  // ----------------------------------------------------------
  // CUSTOMIZATION
  // ----------------------------------------------------------

  const noodles =
    normalizeText(
      item.noodles ||
        item.noodle ||
        "",
      100
    );

  const spice =
    normalizeText(
      item.spice ||
        item.spiceLevel ||
        "",
      100
    );

  const addons =
    normalizeAddons(
      item.addons ||
        item.addOns ||
        []
    );

  // ----------------------------------------------------------
  // PRICE
  // ----------------------------------------------------------

  const suppliedPrice =
    roundMoney(
      normalizeNumber(
        item.price
      )
    );

  const suppliedTotal =
    roundMoney(
      normalizeNumber(
        item.total
      )
    );

  // ----------------------------------------------------------
  // ADDON TOTAL
  // ----------------------------------------------------------

  const addonUnitTotal =
    roundMoney(
      addons.reduce(
        (sum, addon) =>
          sum +
          normalizeNumber(
            addon.price
          ),
        0
      )
    );

  // ----------------------------------------------------------
  // DETERMINE PRODUCT PRICE
  // ----------------------------------------------------------

  let price =
    suppliedPrice;

  /*
   * Backward compatibility for existing
   * cart objects where price was saved as 0.
   *
   * Example:
   *
   * Product      ₹179
   * Extra Egg     ₹40
   * Extra Noodles ₹50
   * Total        ₹269
   *
   * 269 - 40 - 50 = 179
   */

  if (
    price <= 0 &&
    suppliedTotal > 0
  ) {
    const addonTotal =
      addonUnitTotal *
      quantity;

    const baseTotal =
      suppliedTotal -
      addonTotal;

    const derivedPrice =
      baseTotal /
      quantity;

    if (
      Number.isFinite(
        derivedPrice
      ) &&
      derivedPrice > 0
    ) {
      price =
        roundMoney(
          derivedPrice
        );
    }
  }

  // ----------------------------------------------------------
  // PRICE VALIDATION
  // ----------------------------------------------------------

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error(
      `Invalid product price for ${name}.`
    );
  }

  // ----------------------------------------------------------
  // SERVER CALCULATION
  // ----------------------------------------------------------

  const baseTotal =
    price * quantity;

  const addonTotal =
    addonUnitTotal *
    quantity;

  const calculatedTotal =
    roundMoney(
      baseTotal +
        addonTotal
    );

  if (
    !Number.isFinite(
      calculatedTotal
    ) ||
    calculatedTotal <= 0
  ) {
    throw new Error(
      `Unable to calculate total for ${name}.`
    );
  }

  // ----------------------------------------------------------
  // NORMALIZED ITEM
  // ----------------------------------------------------------

  return {
    productId,
    name,
    image,
    price,
    quantity,
    noodles,
    spice,
    addons,
    total: calculatedTotal,
  };
}

// ============================================================
// PREPARATION TIME
// ============================================================

function getPreparationMinutes() {
  const range =
    MAX_PREPARATION_MINUTES -
    MIN_PREPARATION_MINUTES +
    1;

  return (
    MIN_PREPARATION_MINUTES +
    Math.floor(
      Math.random() * range
    )
  );
}

// ============================================================
// GET /api/orders
//
// Used by:
// /orders
//
// Returns the logged-in user's orders.
// ============================================================

export async function GET(request) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
    // ========================================================

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "You must be logged in to view your orders.",
        401
      );
    }

    // ========================================================
    // 2. USER ID
    // ========================================================

    const userId =
      user?._id
        ? String(user._id)
        : "";

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return errorResponse(
        "Invalid authenticated user.",
        401
      );
    }

    const userObjectId =
      new mongoose.Types.ObjectId(
        userId
      );

    // ========================================================
    // 3. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 4. QUERY PARAMETERS
    // ========================================================

    const url =
      new URL(request.url);

    const searchParams =
      url.searchParams;

    const pageValue =
      Number(
        searchParams.get(
          "page"
        ) || 1
      );

    const limitValue =
      Number(
        searchParams.get(
          "limit"
        ) || 10
      );

    const page =
      Number.isFinite(
        pageValue
      ) &&
      pageValue >= 1
        ? Math.floor(
            pageValue
          )
        : 1;

    const limit =
      Number.isFinite(
        limitValue
      ) &&
      limitValue >= 1
        ? Math.min(
            Math.floor(
              limitValue
            ),
            50
          )
        : 10;

    const skip =
      (page - 1) *
      limit;

    // ========================================================
    // 5. STATUS FILTER
    // ========================================================

    const filter = {
      userId:
        userObjectId,
    };

    const status =
      normalizeText(
        searchParams.get(
          "status"
        ) || "",
        50
      ).toLowerCase();

    if (status) {
      filter.status =
        status;
    }

    // ========================================================
    // 6. FETCH ORDERS
    // ========================================================

    const [
      orders,
      totalOrders,
    ] =
      await Promise.all([
        Order.find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Order.countDocuments(
          filter
        ),
      ]);

    // ========================================================
    // 7. NORMALIZE ORDERS
    // ========================================================

    const normalizedOrders =
      orders.map(
        (order) => ({
          id:
            order._id
              ? String(
                  order._id
                )
              : null,

          orderId:
            order._id
              ? String(
                  order._id
                )
              : null,

          orderNumber:
            order.orderNumber,

          tableId:
            order.tableId,

          customer:
            order.customer ||
            null,

          items:
            Array.isArray(
              order.items
            )
              ? order.items
              : [],

          subtotal:
            Number(
              order.subtotal ||
                0
            ),

          taxRate:
            Number(
              order.taxRate ||
                0
            ),

          taxAmount:
            Number(
              order.taxAmount ||
                0
            ),

          total:
            Number(
              order.total ||
                0
            ),

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

          paymentMethod:
            order.paymentMethod ||
            null,

          estimatedPreparationMinutes:
            order.estimatedPreparationMinutes ||
            null,

          estimatedReadyAt:
            order.estimatedReadyAt ||
            null,

          createdAt:
            order.createdAt,

          updatedAt:
            order.updatedAt,
        })
      );

    // ========================================================
    // 8. PAGINATION
    // ========================================================

    const totalPages =
      totalOrders > 0
        ? Math.ceil(
            totalOrders /
              limit
          )
        : 0;

    // ========================================================
    // 9. RESPONSE
    // ========================================================

    return successResponse({
      orders:
        normalizedOrders,

      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/orders error:",
      error
    );

    // ========================================================
    // DATABASE ERRORS
    // ========================================================

    if (
      error?.name ===
        "MongoServerSelectionError" ||
      error?.name ===
        "MongoNetworkError" ||
      error?.code ===
        "ECONNREFUSED" ||
      error?.code ===
        "ETIMEDOUT" ||
      error?.code ===
        "ENOTFOUND"
    ) {
      return errorResponse(
        "Database is temporarily unavailable. Please try again.",
        503
      );
    }

    return errorResponse(
      error?.message ||
        "Unable to load orders.",
      500
    );
  }
}

// ============================================================
// POST /api/orders
//
// Creates a new order.
// ============================================================

export async function POST(
  request
) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
    // ========================================================

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "You must be logged in to place an order.",
        401
      );
    }

    // ========================================================
    // 2. REQUEST BODY
    // ========================================================

    let body;

    try {
      body =
        await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON request body.",
        400
      );
    }

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Invalid request body.",
        400
      );
    }

    // ========================================================
    // 3. TABLE
    // ========================================================

    const tableId =
      normalizeTableId(
        body.tableId
      );

    if (!tableId) {
      return errorResponse(
        "Table ID is required.",
        400
      );
    }

    if (
      !isValidTableId(
        tableId
      )
    ) {
      return errorResponse(
        "Invalid table ID.",
        400
      );
    }

    // ========================================================
    // 4. CUSTOMER
    // ========================================================

    const customer =
      body.customer &&
      typeof body.customer ===
        "object" &&
      !Array.isArray(
        body.customer
      )
        ? body.customer
        : {};

    const customerName =
      normalizeText(
        customer.name ||
          user.name ||
          "",
        MAX_NAME_LENGTH
      );

    const customerEmail =
      normalizeText(
        user.email ||
          customer.email ||
          "",
        MAX_EMAIL_LENGTH
      ).toLowerCase();

    const customerPhone =
      normalizePhone(
        customer.phone ||
          user.phone ||
          ""
      );

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    if (!customerName) {
      return errorResponse(
        "Customer name is required.",
        400
      );
    }

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    if (!customerEmail) {
      return errorResponse(
        "Customer email is required.",
        400
      );
    }

    if (
      !isValidEmail(
        customerEmail
      )
    ) {
      return errorResponse(
        "Please enter a valid email address.",
        400
      );
    }

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    if (!customerPhone) {
      return errorResponse(
        "Customer phone number is required.",
        400
      );
    }

    if (
      customerPhone.length >
        MAX_PHONE_LENGTH ||
      !isValidIndianPhone(
        customerPhone
      )
    ) {
      return errorResponse(
        "Please enter a valid 10-digit Indian mobile number.",
        400
      );
    }

    // ========================================================
    // 5. ITEMS / CART
    // ========================================================

    /*
     * Support both:
     *
     * body.items
     *
     * and older:
     *
     * body.cart
     */

    const rawItems =
      Array.isArray(
        body.items
      )
        ? body.items
        : Array.isArray(
            body.cart
          )
          ? body.cart
          : null;

    if (!rawItems) {
      return errorResponse(
        "Order items are required.",
        400
      );
    }

    if (
      rawItems.length === 0
    ) {
      return errorResponse(
        "Your cart is empty.",
        400
      );
    }

    if (
      rawItems.length >
      MAX_ITEMS_PER_ORDER
    ) {
      return errorResponse(
        `Maximum ${MAX_ITEMS_PER_ORDER} different items are allowed per order.`,
        400
      );
    }

    // ========================================================
    // 6. NORMALIZE ITEMS
    // ========================================================

    let items;

    try {
      items =
        rawItems.map(
          (
            item,
            index
          ) =>
            normalizeCartItem(
              item,
              index
            )
        );
    } catch (error) {
      return errorResponse(
        error?.message ||
          "Invalid cart item.",
        400
      );
    }

    // ========================================================
    // 7. SUBTOTAL
    // ========================================================

    const subtotal =
      roundMoney(
        items.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item.total,
          0
        )
      );

    if (
      !Number.isFinite(
        subtotal
      ) ||
      subtotal <= 0
    ) {
      return errorResponse(
        "Invalid order subtotal.",
        400
      );
    }

    // ========================================================
    // 8. GST
    // ========================================================

    const taxAmount =
      roundMoney(
        subtotal *
          (TAX_RATE / 100)
      );

    // ========================================================
    // 9. FINAL TOTAL
    // ========================================================

    const total =
      roundMoney(
        subtotal +
          taxAmount
      );

    if (
      !Number.isFinite(
        total
      ) ||
      total <= 0
    ) {
      return errorResponse(
        "Invalid order total.",
        400
      );
    }

    // ========================================================
    // 10. PREPARATION TIME
    // ========================================================

    const estimatedPreparationMinutes =
      getPreparationMinutes();

    const estimatedReadyAt =
      new Date(
        Date.now() +
          estimatedPreparationMinutes *
            60 *
            1000
      );

    // ========================================================
    // 11. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 12. USER ID
    // ========================================================

    const userId =
      user?._id
        ? String(user._id)
        : "";

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return errorResponse(
        "Invalid authenticated user.",
        401
      );
    }

    const userObjectId =
      new mongoose.Types.ObjectId(
        userId
      );

    // ========================================================
    // 13. CREATE ORDER
    // ========================================================

    let order = null;

    for (
      let attempt = 1;
      attempt <=
        ORDER_NUMBER_RETRY_LIMIT;
      attempt++
    ) {
      const orderNumber =
        generateOrderNumber();

      try {
        order =
          await Order.create({
            orderNumber,

            userId:
              userObjectId,

            customer: {
              name:
                customerName,

              email:
                customerEmail,

              phone:
                customerPhone,
            },

            tableId,

            items,

            subtotal,

            taxRate:
              TAX_RATE,

            taxAmount,

            total,

            status:
              "pending",

            paymentStatus:
              "pending",

            paymentMethod:
              null,

            estimatedPreparationMinutes,

            estimatedReadyAt,
          });

        break;
      } catch (error) {
        // ----------------------------------------------------
        // DUPLICATE ORDER NUMBER
        // ----------------------------------------------------

        if (
          error?.code ===
            11000 &&
          error?.keyPattern
            ?.orderNumber
        ) {
          console.warn(
            `Order number collision on attempt ${attempt}. Retrying...`
          );

          if (
            attempt ===
            ORDER_NUMBER_RETRY_LIMIT
          ) {
            return errorResponse(
              "Unable to generate a unique order number. Please try again.",
              503
            );
          }

          continue;
        }

        throw error;
      }
    }

    // ========================================================
    // 14. SAFETY CHECK
    // ========================================================

    if (!order) {
      return errorResponse(
        "Unable to create order. Please try again.",
        500
      );
    }

    // ========================================================
    // 15. RESPONSE
    // ========================================================

    return successResponse(
      {
        message:
          "Order placed successfully.",

        order: {
          id:
            order._id.toString(),

          orderId:
            order._id.toString(),

          orderNumber:
            order.orderNumber,

          tableId:
            order.tableId,

          status:
            order.status,

          paymentStatus:
            order.paymentStatus,

          paymentMethod:
            order.paymentMethod,

          items:
            order.items,

          subtotal:
            order.subtotal,

          taxRate:
            order.taxRate,

          taxAmount:
            order.taxAmount,

          total:
            order.total,

          estimatedPreparationMinutes:
            order.estimatedPreparationMinutes,

          estimatedReadyAt:
            order.estimatedReadyAt,

          createdAt:
            order.createdAt,
        },
      },
      201
    );
  } catch (error) {
    console.error(
      "POST /api/orders error:",
      error
    );

    // ========================================================
    // MONGOOSE VALIDATION
    // ========================================================

    if (
      error?.name ===
      "ValidationError"
    ) {
      const details =
        Object.values(
          error.errors || {}
        ).map(
          (item) =>
            item.message
        );

      return errorResponse(
        "Order validation failed.",
        400,
        {
          details,
        }
      );
    }

    // ========================================================
    // CAST ERROR
    // ========================================================

    if (
      error?.name ===
      "CastError"
    ) {
      return errorResponse(
        "Invalid order data.",
        400
      );
    }

    // ========================================================
    // DATABASE CONNECTION
    // ========================================================

    if (
      error?.name ===
        "MongoServerSelectionError" ||
      error?.name ===
        "MongoNetworkError" ||
      error?.code ===
        "ECONNREFUSED" ||
      error?.code ===
        "ETIMEDOUT" ||
      error?.code ===
        "ENOTFOUND"
    ) {
      return errorResponse(
        "Database is temporarily unavailable. Please try again.",
        503
      );
    }

    // ========================================================
    // DUPLICATE KEY
    // ========================================================

    if (
      error?.code ===
      11000
    ) {
      return errorResponse(
        "Duplicate order data detected. Please try again.",
        409
      );
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    return errorResponse(
      error?.message ||
        "Unable to create order.",
      500
    );
  }
}