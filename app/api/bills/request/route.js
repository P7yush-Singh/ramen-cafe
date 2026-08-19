import mongoose from "mongoose";
import { Resend } from "resend";

import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";

import Order from "@/models/Order";
import User from "@/models/User";

// ============================================================
// RESEND
// ============================================================

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// ============================================================
// CONSTANTS
// ============================================================

// Orders for which a customer can request the bill.
//
// "completed" is included because your latest Order model
// supports this status.
const BILL_ELIGIBLE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
];

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
// GENERAL HELPERS
// ============================================================

function normalizeText(value, max = 500) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function normalizeTableId(value) {
  return normalizeText(value, 50).toUpperCase();
}

function roundMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return (
    Math.round(
      (number + Number.EPSILON) * 100
    ) / 100
  );
}

function getUserObjectId(user) {
  const id = user?._id
    ? String(user._id)
    : "";

  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return null;
  }

  return new mongoose.Types.ObjectId(id);
}

// ============================================================
// BILL SERIALIZER
// ============================================================

function serializeBill(orders, tableId) {
  if (!orders.length) {
    return null;
  }

  const amount = roundMoney(
    orders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    )
  );

  const requestedAt =
    orders
      .map(
        (order) =>
          order?.bill?.requestedAt
      )
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b).getTime() -
          new Date(a).getTime()
      )[0] || null;

  return {
    status: "requested",

    tableId,

    amount,

    orderIds: orders.map(
      (order) => String(order._id)
    ),

    orderNumbers: orders.map(
      (order) => order.orderNumber
    ),

    orderCount: orders.length,

    requestedAt,
  };
}

// ============================================================
// STAFF / OWNER NOTIFICATION
// ============================================================

async function notifyStaff(bill) {
  try {
    const recipients =
      await User.find({
        role: {
          $in: [
            "owner",
            "staff",
          ],
        },

        isActive: true,

        email: {
          $exists: true,
          $ne: "",
        },
      })
        .select(
          "email name role"
        )
        .lean();

    const emails = recipients
      .map((user) =>
        String(
          user.email || ""
        )
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    if (!emails.length) {
      console.warn(
        "No active owner/staff email recipients found."
      );

      return;
    }

    if (
      !process.env.RESEND_API_KEY ||
      !process.env.RESEND_FROM_EMAIL
    ) {
      console.warn(
        "Resend environment variables are missing."
      );

      return;
    }

    const { error } =
      await resend.emails.send({
        from:
          process.env
            .RESEND_FROM_EMAIL,

        to: emails,

        subject:
          `Bill Request · Table ${bill.tableId} · ${formatPrice(
            bill.amount
          )}`,

        html: `
          <!DOCTYPE html>
          <html>
            <body
              style="
                margin:0;
                padding:0;
                background:#F5F0E8;
                font-family:Arial,sans-serif;
              "
            >
              <div
                style="
                  max-width:600px;
                  margin:40px auto;
                  padding:32px;
                  background:#FFFDF8;
                  border-radius:20px;
                "
              >
                <h1
                  style="
                    margin:0;
                    color:#171513;
                  "
                >
                  Ramen Cafe
                </h1>

                <p
                  style="
                    margin-top:8px;
                    color:#6B6258;
                  "
                >
                  New bill request
                </p>

                <div
                  style="
                    margin-top:24px;
                    padding:20px;
                    background:#F5F0E8;
                    border-radius:16px;
                  "
                >
                  <p style="margin:0 0 10px;">
                    <strong>Table:</strong>
                    ${escapeHtml(
                      bill.tableId
                    )}
                  </p>

                  <p style="margin:0 0 10px;">
                    <strong>Customer:</strong>
                    ${escapeHtml(
                      bill.customerName
                    )}
                  </p>

                  <p style="margin:0 0 10px;">
                    <strong>Phone:</strong>
                    ${escapeHtml(
                      bill.customerPhone
                    )}
                  </p>

                  <p style="margin:0 0 10px;">
                    <strong>Email:</strong>
                    ${escapeHtml(
                      bill.customerEmail
                    )}
                  </p>

                  <p style="margin:0;">
                    <strong>Bill Amount:</strong>
                    ${formatPrice(
                      bill.amount
                    )}
                  </p>
                </div>

                <p
                  style="
                    margin-top:24px;
                    color:#6B6258;
                    line-height:1.6;
                  "
                >
                  Customer has requested the bill.
                  Please visit the table, collect payment,
                  and mark the bill as paid from the
                  admin panel.
                </p>

                <p
                  style="
                    margin-top:28px;
                    color:#8A8177;
                    font-size:12px;
                  "
                >
                  Ramen Cafe · ラーメンカフェ
                </p>
              </div>
            </body>
          </html>
        `,
      });

    if (error) {
      console.error(
        "Bill notification email error:",
        error
      );
    }
  } catch (error) {
    console.error(
      "Staff notification error:",
      error
    );

    // Email failure must NOT fail the bill request.
  }
}

// ============================================================
// GET
// ============================================================

export async function GET(request) {
  try {
    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "Authentication required.",
        401
      );
    }

    const userObjectId =
      getUserObjectId(user);

    if (!userObjectId) {
      return errorResponse(
        "Invalid authenticated user.",
        401
      );
    }

    // ----------------------------------------------------------
    // TABLE
    // ----------------------------------------------------------

    const { searchParams } =
      new URL(request.url);

    const tableId =
      normalizeTableId(
        searchParams.get("tableId")
      );

    if (!tableId) {
      return successResponse({
        billRequest: null,
      });
    }

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

    // Only return currently requested bills.
    const orders =
      await Order.find({
        userId: userObjectId,

        tableId,

        status: {
          $in:
            BILL_ELIGIBLE_ORDER_STATUSES,
        },

        "payment.status": {
          $ne: "paid",
        },

        "bill.status": "requested",
      })
        .sort({
          "bill.requestedAt": -1,
        })
        .lean();

    return successResponse({
      billRequest:
        serializeBill(
          orders,
          tableId
        ),
    });
  } catch (error) {
    console.error(
      "GET /api/bills/request error:",
      error
    );

    return errorResponse(
      "Unable to load bill request.",
      500
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(request) {
  try {
    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "Authentication required.",
        401
      );
    }

    const userObjectId =
      getUserObjectId(user);

    if (!userObjectId) {
      return errorResponse(
        "Invalid authenticated user.",
        401
      );
    }

    // ----------------------------------------------------------
    // REQUEST BODY
    // ----------------------------------------------------------

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON request body.",
        400
      );
    }

    const tableId =
      normalizeTableId(
        body?.tableId
      );

    if (!tableId) {
      return errorResponse(
        "Table ID is required.",
        400
      );
    }

    // ----------------------------------------------------------
    // TABLE ID VALIDATION
    // ----------------------------------------------------------

    if (
      !/^T[A-Z0-9-]+$/.test(tableId)
    ) {
      return errorResponse(
        "Invalid table ID.",
        400
      );
    }

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

    // ----------------------------------------------------------
    // FIND CUSTOMER'S ORDERS
    // ----------------------------------------------------------

    const orders =
      await Order.find({
        userId: userObjectId,

        tableId,

        status: {
          $in:
            BILL_ELIGIBLE_ORDER_STATUSES,
        },

        "payment.status": {
          $ne: "paid",
        },

        "bill.status": {
          $nin: [
            "paid",
            "cancelled",
          ],
        },
      })
        .sort({
          createdAt: 1,
        });

    // ----------------------------------------------------------
    // NO ELIGIBLE ORDERS
    // ----------------------------------------------------------

    if (!orders.length) {
      const existing =
        await Order.find({
          userId: userObjectId,

          tableId,

          status: {
            $in:
              BILL_ELIGIBLE_ORDER_STATUSES,
          },

          "payment.status": {
            $ne: "paid",
          },

          "bill.status": "requested",
        })
          .sort({
            "bill.requestedAt": -1,
          })
          .lean();

      if (existing.length) {
        return successResponse({
          message:
            "Your bill has already been requested.",

          billRequest:
            serializeBill(
              existing,
              tableId
            ),
        });
      }

      return errorResponse(
        "There are no unpaid orders available for this table.",
        400
      );
    }

    // ----------------------------------------------------------
    // CHECK IF BILL IS ALREADY REQUESTED
    // ----------------------------------------------------------

    const alreadyRequested =
      orders.filter(
        (order) =>
          order?.bill?.status ===
          "requested"
      );

    if (
      alreadyRequested.length ===
      orders.length
    ) {
      return successResponse({
        message:
          "Your bill has already been requested.",

        billRequest:
          serializeBill(
            orders,
            tableId
          ),
      });
    }

    // ----------------------------------------------------------
    // REQUEST BILL
    // ----------------------------------------------------------

    const requestedAt =
      new Date();

    for (const order of orders) {
      // Don't overwrite an already requested bill.
      if (
        order?.bill?.status ===
        "requested"
      ) {
        continue;
      }

      order.bill.status =
        "requested";

      order.bill.amount =
        roundMoney(
          order.total
        );

      order.bill.requestedAt =
        requestedAt;

      await order.save();
    }

    // ----------------------------------------------------------
    // RELOAD ORDERS
    // ----------------------------------------------------------

    const updatedOrders =
      await Order.find({
        _id: {
          $in: orders.map(
            (order) =>
              order._id
          ),
        },

        userId: userObjectId,

        tableId,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    // ----------------------------------------------------------
    // CALCULATE BILL
    // ----------------------------------------------------------

    const amount =
      roundMoney(
        updatedOrders.reduce(
          (sum, order) =>
            sum +
            Number(
              order.total || 0
            ),
          0
        )
      );

    // ----------------------------------------------------------
    // CUSTOMER DETAILS
    // ----------------------------------------------------------

    const bill = {
      tableId,

      amount,

      customerName:
        user.name ||
        updatedOrders[0]
          ?.customer
          ?.name ||
        "Customer",

      customerPhone:
        user.phone ||
        updatedOrders[0]
          ?.customer
          ?.phone ||
        "",

      customerEmail:
        user.email ||
        updatedOrders[0]
          ?.customer
          ?.email ||
        "",
    };

    // ----------------------------------------------------------
    // STAFF EMAIL
    // ----------------------------------------------------------

    await notifyStaff(bill);

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return successResponse(
      {
        message:
          "Bill requested successfully. Our staff has been notified.",

        billRequest: {
          status: "requested",

          tableId,

          amount,

          orderIds:
            updatedOrders.map(
              (order) =>
                String(order._id)
            ),

          orderNumbers:
            updatedOrders.map(
              (order) =>
                order.orderNumber
            ),

          orderCount:
            updatedOrders.length,

          requestedAt,
        },
      },
      201
    );
  } catch (error) {
    // IMPORTANT:
    // Log the real error so Vercel/server console
    // shows the actual reason instead of hiding it.

    console.error(
      "POST /api/bills/request error:",
      error
    );

    return errorResponse(
      error?.message ||
        "Unable to request bill.",
      500,
      process.env.NODE_ENV !==
        "production"
        ? {
            details:
              error?.name ||
              "UnknownError",
          }
        : {}
    );
  }
}

// ============================================================
// EMAIL HELPERS
// ============================================================

function formatPrice(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function escapeHtml(value) {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}