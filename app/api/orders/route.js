import mongoose from "mongoose";
import { randomUUID } from "crypto";

import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";

import Order from "@/models/Order";
import Product from "@/models/Product";
import Table from "@/models/Table";

// ============================================================
// CONFIG
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


function successResponse(
  data,
  status = 200
) {
  return Response.json(
    {
      success: true,
      ...data,
    },
    {
      status,
    }
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
    {
      status,
    }
  );
}

// ============================================================
// NORMALIZATION
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
      (number + Number.EPSILON) *
        100
    ) / 100
  );
}

// ============================================================
// TABLE
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
// CUSTOMER
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

  const randomPart =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  return `RC-${date}-${randomPart}`;
}

// ============================================================
// PRODUCT ID
// ============================================================

function normalizeProductId(
  item
) {
  return normalizeText(
    item?.productId ||
      item?.id ||
      item?._id ||
      "",
    100
  );
}

// ============================================================
// ADD-ON NORMALIZATION
// ============================================================

function getRequestedAddons(item) {
  const addons =
    Array.isArray(item?.addons)
      ? item.addons
      : Array.isArray(item?.addOns)
      ? item.addOns
      : [];

  return addons
    .filter(
      (addon) =>
        addon &&
        typeof addon === "object"
    )
    .map((addon) => ({
      id: normalizeText(
        addon._id ||
          addon.id ||
          "",
        100
      ),

      name: normalizeText(
        addon.name ||
          addon.title ||
          "",
        100
      ),
    }));
}

// ============================================================
// FIND DATABASE ADD-ON
// ============================================================

function findProductAddon(
  product,
  requestedAddon
) {
  const productAddons =
    Array.isArray(
      product.addOns
    )
      ? product.addOns
      : [];

  // ----------------------------------------------------------
  // Match by MongoDB add-on ID first
  // ----------------------------------------------------------

  if (requestedAddon.id) {
    const byId =
      productAddons.find(
        (addon) =>
          String(
            addon._id
          ) ===
          requestedAddon.id
      );

    if (byId) {
      return byId;
    }
  }

  // ----------------------------------------------------------
  // Backward-compatible name matching
  // ----------------------------------------------------------

  if (requestedAddon.name) {
    const requestedName =
      requestedAddon.name
        .trim()
        .toLowerCase();

    const byName =
      productAddons.find(
        (addon) =>
          String(
            addon.name || ""
          )
            .trim()
            .toLowerCase() ===
            requestedName
      );

    if (byName) {
      return byName;
    }
  }

  return null;
}

// ============================================================
// VALIDATE CUSTOMIZATION
// ============================================================

function validateCustomization(
  product,
  item,
  productName
) {
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

  // ----------------------------------------------------------
  // NOODLES
  // ----------------------------------------------------------

  const allowedNoodles =
    Array.isArray(
      product.customization
        ?.noodles
    )
      ? product.customization
          .noodles
      : [];

  if (noodles) {
    if (
      !allowedNoodles.some(
        (value) =>
          String(value)
            .trim()
            .toLowerCase() ===
          noodles
            .trim()
            .toLowerCase()
      )
    ) {
      throw new Error(
        `${productName}: selected noodle option is unavailable.`
      );
    }
  }

  // ----------------------------------------------------------
  // SPICE
  // ----------------------------------------------------------

  const allowedSpiceLevels =
    Array.isArray(
      product.customization
        ?.spiceLevels
    )
      ? product.customization
          .spiceLevels
      : [];

  if (spice) {
    if (
      !allowedSpiceLevels.some(
        (value) =>
          String(value)
            .trim()
            .toLowerCase() ===
          spice
            .trim()
            .toLowerCase()
      )
    ) {
      throw new Error(
        `${productName}: selected spice level is unavailable.`
      );
    }
  }

  return {
    noodles,
    spice,
  };
}

// ============================================================
// NORMALIZE + VALIDATE ONE CART ITEM
// ============================================================

async function normalizeCartItem(
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
    normalizeProductId(item);

  if (!productId) {
    throw new Error(
      `Cart item ${
        index + 1
      } is missing a product ID.`
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    throw new Error(
      `Invalid product ID for cart item ${
        index + 1
      }.`
    );
  }

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
      "Invalid product quantity."
    );
  }

  // ----------------------------------------------------------
  // FETCH PRODUCT FROM DATABASE
  // ----------------------------------------------------------

  const product =
    await Product.findById(
      productId
    ).lean();

  if (!product) {
    throw new Error(
      "One of the products in your cart no longer exists."
    );
  }

  // ----------------------------------------------------------
  // AVAILABILITY
  // ----------------------------------------------------------

  if (
    product.isAvailable !== true
  ) {
    throw new Error(
      `${product.name} is currently unavailable.`
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE PRODUCT DATA
  // ----------------------------------------------------------

  const name =
    normalizeText(
      product.name,
      MAX_NAME_LENGTH
    );

  const image =
    normalizeText(
      product.image || "",
      1000
    );

  // IMPORTANT:
  // NEVER use item.price here.
  //
  // MongoDB Product.price is authoritative.

  const price =
    roundMoney(
      product.price
    );

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error(
      `Invalid database price for ${name}.`
    );
  }

  // ----------------------------------------------------------
  // CUSTOMIZATION
  // ----------------------------------------------------------

  const customization =
    validateCustomization(
      product,
      item,
      name
    );

  // ----------------------------------------------------------
  // ADD-ONS
  // ----------------------------------------------------------

  const requestedAddons =
    getRequestedAddons(item);

  const validatedAddons = [];

  for (
    const requestedAddon of requestedAddons
  ) {
    const databaseAddon =
      findProductAddon(
        product,
        requestedAddon
      );

    if (!databaseAddon) {
      throw new Error(
        `${name}: selected add-on is unavailable.`
      );
    }

    if (
      databaseAddon.isAvailable ===
      false
    ) {
      throw new Error(
        `${name}: ${databaseAddon.name} is currently unavailable.`
      );
    }

    validatedAddons.push({
      name:
        databaseAddon.name,

      // IMPORTANT:
      // Database price only.
      price:
        roundMoney(
          databaseAddon.price
        ),
    });
  }

  // ----------------------------------------------------------
  // ADD-ON TOTAL
  // ----------------------------------------------------------

  const addonUnitTotal =
    roundMoney(
      validatedAddons.reduce(
        (sum, addon) =>
          sum +
          addon.price,
        0
      )
    );

  // ----------------------------------------------------------
  // LINE TOTAL
  // ----------------------------------------------------------

  const baseTotal =
    roundMoney(
      price * quantity
    );

  const addonTotal =
    roundMoney(
      addonUnitTotal *
        quantity
    );

  const total =
    roundMoney(
      baseTotal +
        addonTotal
    );

  if (
    !Number.isFinite(total) ||
    total < 0
  ) {
    throw new Error(
      `Unable to calculate total for ${name}.`
    );
  }

  // ----------------------------------------------------------
  // RETURN ORDER ITEM
  // ----------------------------------------------------------

  return {
    productId,

    name,

    image,

    // DATABASE PRICE
    price,

    quantity,

    noodles:
      customization.noodles,

    spice:
      customization.spice,

    addons:
      validatedAddons,

    total,
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
// ============================================================

export async function GET(request) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
    // ========================================================

    const user = await getServerUser();

    if (!user) {
      return errorResponse(
        "You must be logged in to view your orders.",
        401
      );
    }

    // ========================================================
    // 2. VALIDATE USER ID
    // ========================================================

    const userId = user?._id
      ? String(user._id)
      : "";

    if (
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return errorResponse(
        "Invalid authenticated user.",
        401
      );
    }

    // ========================================================
    // 3. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 4. GET USER ORDERS
    // ========================================================

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    // ========================================================
    // 5. RESPONSE
    // ========================================================

    return successResponse({
      orders: orders.map((order) => ({
        _id: order._id.toString(),

        orderId: order._id.toString(),

        orderNumber:
          order.orderNumber,

        userId:
          order.userId?.toString(),

        customer:
          order.customer || null,

        tableId:
          order.tableId,

        items:
          Array.isArray(order.items)
            ? order.items
            : [],

        subtotal:
          Number(order.subtotal || 0),

        taxRate:
          Number(order.taxRate || 0),

        taxAmount:
          Number(order.taxAmount || 0),

        total:
          Number(order.total || 0),

        status:
          order.status,

        paymentStatus:
          order.paymentStatus,

        paymentMethod:
          order.paymentMethod || null,

        estimatedPreparationMinutes:
          order.estimatedPreparationMinutes,

        estimatedReadyAt:
          order.estimatedReadyAt,

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt,
      })),
    });
  } catch (error) {
    console.error(
      "GET /api/orders error:",
      error
    );

    // ========================================================
    // MONGOOSE
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
    // DATABASE
    // ========================================================

    if (
      error?.name ===
        "MongoServerSelectionError" ||
      error?.name ===
        "MongoNetworkError" ||
      error?.code === "ECONNREFUSED" ||
      error?.code === "ETIMEDOUT" ||
      error?.code === "ENOTFOUND"
    ) {
      return errorResponse(
        "Database is temporarily unavailable. Please try again.",
        503
      );
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    return errorResponse(
      "Unable to load your orders.",
      500
    );
  }
}

// ============================================================
// POST /api/orders
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
      typeof body !== "object" ||
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
// 3.1 VERIFY TABLE EXISTS AND IS ACTIVE
// ========================================================

const table =
  await Table.findOne({
    tableId,
    isActive: true,
  })
    .select(
      "tableId name capacity location"
    )
    .lean();

if (!table) {
  return errorResponse(
    "This table is unavailable. Please scan the table QR code again.",
    404
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

    if (!customerName) {
      return errorResponse(
        "Customer name is required.",
        400
      );
    }

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
    // 5. ITEMS
    // ========================================================

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
    // 6. DATABASE CONNECTION
    // ========================================================

    await connectDB();

    // ========================================================
    // 7. NORMALIZE + VALIDATE ITEMS
    // ========================================================

    let items;

    try {
      items =
        await Promise.all(
          rawItems.map(
            (
              item,
              index
            ) =>
              normalizeCartItem(
                item,
                index
              )
          )
        );
    } catch (error) {
      return errorResponse(
        error?.message ||
          "Invalid order item.",
        400
      );
    }

    // ========================================================
    // 8. SUBTOTAL
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
      subtotal < 0
    ) {
      return errorResponse(
        "Invalid order subtotal.",
        400
      );
    }

    // ========================================================
    // 9. GST
    // ========================================================

    const taxAmount =
      roundMoney(
        subtotal *
          (TAX_RATE / 100)
      );

    // ========================================================
    // 10. FINAL TOTAL
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
      total < 0
    ) {
      return errorResponse(
        "Invalid order total.",
        400
      );
    }

    // ========================================================
    // 11. PREPARATION TIME
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
        // UNIQUE ORDER NUMBER COLLISION
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
    // 15. SUCCESS
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
    // ========================================================
    // GLOBAL ERROR
    // ========================================================

    console.error(
      "POST /api/orders error:",
      error
    );

    // --------------------------------------------------------
    // MONGOOSE VALIDATION
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // INVALID OBJECT ID
    // --------------------------------------------------------

    if (
      error?.name ===
      "CastError"
    ) {
      return errorResponse(
        "Invalid order data.",
        400
      );
    }

    // --------------------------------------------------------
    // DATABASE CONNECTION
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // DUPLICATE
    // --------------------------------------------------------

    if (
      error?.code === 11000
    ) {
      return errorResponse(
        "Duplicate order data detected. Please try again.",
        409
      );
    }

    // --------------------------------------------------------
    // FALLBACK
    // --------------------------------------------------------

    return errorResponse(
      error?.message ||
        "Unable to create order.",
      500
    );
  }
}