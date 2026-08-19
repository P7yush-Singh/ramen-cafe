import mongoose from "mongoose";
import { Resend } from "resend";

import { connectDB } from "@/lib/mongodb";
import {
  requireUserAccess,
  getUserRole,
  ROLES,
} from "@/lib/admin-auth";

import Order from "@/models/Order";

// ============================================================
// RESEND
// ============================================================

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// ============================================================
// CONSTANTS
// ============================================================

const PAYMENT_METHODS = [
  "cash",
  "upi",
  "card",
  "other",
];

const BILL_STATUSES = [
  "requested",
  "generated",
  "paid",
];

// ============================================================
// HELPERS
// ============================================================

function response(
  data,
  status = 200
) {
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
  status = 400
) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function clean(
  value,
  max = 500
) {
  return String(
    value ?? ""
  )
    .trim()
    .slice(0, max);
}

function price(
  value
) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function date(
  value
) {
  if (!value) {
    return "—";
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "—";
  }

  return parsed.toLocaleString(
    "en-IN",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  );
}

// ============================================================
// AUTHORIZATION
// ============================================================

async function authorize() {
  const auth =
    await requireUserAccess();

  if (auth.response) {
    return auth;
  }

  const role =
    getUserRole(
      auth.user
    );

  if (
    ![
      ROLES.ADMIN,
      ROLES.OWNER,
      ROLES.STAFF,
    ].includes(role)
  ) {
    return {
      response:
        errorResponse(
          "Bill management access required.",
          403
        ),
    };
  }

  return auth;
}

// ============================================================
// SERIALIZE
// ============================================================

function serializeBill(
  orders
) {
  if (!orders.length) {
    return null;
  }

  const first =
    orders[0];

  return {
    id:
      String(
        first._id
      ),

    tableId:
      first.tableId,

    customer:
      first.customer ||
      null,

    amount:
      orders.reduce(
        (
          sum,
          order
        ) =>
          sum +
          Number(
            order.total ||
              0
          ),
        0
      ),

    status:
      first.payment
        ?.status ===
      "paid"
        ? "paid"
        : first.bill
            ?.status ||
          "not_requested",

    orderIds:
      orders.map(
        (order) =>
          String(
            order._id
          )
      ),

    orderNumbers:
      orders.map(
        (order) =>
          order.orderNumber
      ),

    orderCount:
      orders.length,

    requestedAt:
      first.bill
        ?.requestedAt ||
      null,

    paidAt:
      first.bill
        ?.paidAt ||
      first.payment
        ?.paidAt ||
      null,

    payment:
      first.payment ||
      {
        status:
          "pending",
      },

    orders:
      orders.map(
        (order) => ({
          id:
            String(
              order._id
            ),

          orderNumber:
            order.orderNumber,

          total:
            Number(
              order.total ||
                0
            ),

          status:
            order.status,

          bill:
            order.bill,

          payment:
            order.payment,

          items:
            Array.isArray(
              order.items
            )
              ? order.items
              : [],
        })
      ),
  };
}

// ============================================================
// GET /api/admin/bills
// ============================================================

export async function GET(
  request
) {
  try {
    const auth =
      await authorize();

    if (
      auth.response
    ) {
      return auth.response;
    }

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const status =
      clean(
        searchParams.get(
          "status"
        ),
        30
      ).toLowerCase();

    const search =
      clean(
        searchParams.get(
          "search"
        ),
        100
      ).toLowerCase();

    await connectDB();

    const query = {
      "bill.status":
        {
          $in: [
            "requested",
            "generated",
            "paid",
          ],
        },
    };

    if (
      status &&
      BILL_STATUSES.includes(
        status
      )
    ) {
      query[
        "bill.status"
      ] = status;
    }

    const orders =
      await Order.find(
        query
      )
        .sort({
          "bill.requestedAt":
            -1,
          createdAt:
            -1,
        })
        .lean();

    // ----------------------------------------------------------
    // GROUP BY TABLE + REQUEST TIMESTAMP
    //
    // A customer can have multiple orders at the same table.
    // They are treated as one bill request.
    // ----------------------------------------------------------

    const groups =
      new Map();

    for (
      const order of orders
    ) {
      const requestedAt =
        order?.bill
          ?.requestedAt
          ? new Date(
              order.bill.requestedAt
            )
              .getTime()
          : order.createdAt
          ? new Date(
              order.createdAt
            ).getTime()
          : 0;

      const key =
        `${order.userId || ""}:${order.tableId}:${requestedAt}`;

      if (
        !groups.has(key)
      ) {
        groups.set(
          key,
          []
        );
      }

      groups
        .get(key)
        .push(order);
    }

    let bills =
      Array.from(
        groups.values()
      ).map(
        (
          group
        ) =>
          serializeBill(
            group
          )
      );

    if (search) {
      bills =
        bills.filter(
          (bill) => {
            const text =
              [
                bill.tableId,
                bill.customer
                  ?.name,
                bill.customer
                  ?.email,
                bill.customer
                  ?.phone,
                ...bill.orderNumbers,
              ]
                .join(" ")
                .toLowerCase();

            return text.includes(
              search
            );
          }
        );
    }

    return response({
      bills,

      counts: {
        requested:
          bills.filter(
            (bill) =>
              bill.status ===
              "requested"
          ).length,

        paid:
          bills.filter(
            (bill) =>
              bill.status ===
              "paid"
          ).length,

        total:
          bills.length,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/bills error:",
      error
    );

    return errorResponse(
      "Unable to load bill requests.",
      500
    );
  }
}

// ============================================================
// PATCH /api/admin/bills
//
// Mark a complete bill request as paid.
// ============================================================

export async function PATCH(
  request
) {
  try {
    const auth =
      await authorize();

    if (
      auth.response
    ) {
      return auth.response;
    }

    let body;

    try {
      body =
        await request.json();
    } catch {
      return errorResponse(
        "Invalid request body.",
        400
      );
    }

    const orderIds =
      Array.isArray(
        body?.orderIds
      )
        ? body.orderIds
            .map(
              (id) =>
                String(
                  id
                ).trim()
            )
            .filter(
              (id) =>
                mongoose.Types.ObjectId.isValid(
                  id
                )
            )
        : [];

    if (
      !orderIds.length
    ) {
      return errorResponse(
        "At least one valid order ID is required.",
        400
      );
    }

    const method =
      clean(
        body?.paymentMethod,
        30
      ).toLowerCase();

    if (
      !PAYMENT_METHODS.includes(
        method
      )
    ) {
      return errorResponse(
        `Invalid payment method. Allowed: ${PAYMENT_METHODS.join(
          ", "
        )}.`,
        400
      );
    }

    const transactionId =
      clean(
        body?.transactionId,
        150
      );

    await connectDB();

    const orders =
      await Order.find({
        _id: {
          $in:
            orderIds.map(
              (id) =>
                new mongoose.Types.ObjectId(
                  id
                )
            ),
        },
      });

    if (
      orders.length !==
      orderIds.length
    ) {
      return errorResponse(
        "One or more orders could not be found.",
        404
      );
    }

    // ----------------------------------------------------------
    // SAFETY
    // ----------------------------------------------------------

    for (
      const order of orders
    ) {
      if (
        order.payment
          ?.status ===
        "paid"
      ) {
        return errorResponse(
          `Order ${order.orderNumber} is already paid.`,
          409
        );
      }

      if (
        order.status ===
        "cancelled"
      ) {
        return errorResponse(
          `Order ${order.orderNumber} is cancelled and cannot be paid.`,
          409
        );
      }

      if (
        ![
          "requested",
          "generated",
        ].includes(
          order.bill
            ?.status
        )
      ) {
        return errorResponse(
          `Order ${order.orderNumber} does not have a requested bill.`,
          409
        );
      }
    }

    // ----------------------------------------------------------
    // TRANSACTION ID DUPLICATE CHECK
    // ----------------------------------------------------------

    if (
      transactionId
    ) {
      const duplicate =
        await Order.findOne(
          {
            "payment.transactionId":
              transactionId,

            _id: {
              $nin:
                orders.map(
                  (
                    order
                  ) =>
                    order._id
                ),
            },
          }
        ).lean();

      if (
        duplicate
      ) {
        return errorResponse(
          "This transaction ID is already used by another order.",
          409
        );
      }
    }

    // ----------------------------------------------------------
    // PAYMENT
    // ----------------------------------------------------------

    const now =
      new Date();

    for (
      const order of orders
    ) {
      const amount =
        Number(
          order.total ||
            0
        );

      order.payment.status =
        "paid";

      order.payment.amount =
        amount;

      order.payment.method =
        method;

      order.payment.transactionId =
        transactionId ||
        undefined;

      order.payment.paidAt =
        now;

      order.bill.amount =
        amount;

      order.bill.status =
        "paid";

      order.bill.generatedAt =
        order.bill
          .generatedAt ||
        now;

      order.bill.paidAt =
        now;

      order.receipt.sentAt =
        null;

      await order.save();
    }

    // ----------------------------------------------------------
    // RECEIPT EMAIL
    // ----------------------------------------------------------

    const customer =
      orders[0]
        ?.customer;

    await sendReceiptEmail(
      orders,
      customer
    );

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return response({
      message:
        "Payment recorded and receipt email sent.",

      bill: serializeBill(
        orders
      ),
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/bills error:",
      error
    );

    if (
      error?.code ===
      11000
    ) {
      return errorResponse(
        "A unique payment transaction ID is already in use.",
        409
      );
    }

    return errorResponse(
      "Unable to update bill.",
      500
    );
  }
}

// ============================================================
// RECEIPT EMAIL
// ============================================================

async function sendReceiptEmail(
  orders,
  customer
) {
  const email =
    String(
      customer?.email ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    !email
  ) {
    console.warn(
      "Customer email unavailable. Receipt email skipped."
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

  const total =
    orders.reduce(
      (
        sum,
        order
      ) =>
        sum +
        Number(
          order.total ||
            0
        ),
      0
    );

  const items =
    orders.flatMap(
      (
        order
      ) =>
        Array.isArray(
          order.items
        )
          ? order.items
          : []
    );

  const itemsHtml =
    items
      .map(
        (
          item
        ) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">
              ${escapeHtml(
                item.name
              )}
              × ${Number(
                item.quantity ||
                  0
              )}
            </td>

            <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">
              ${price(
                item.total
              )}
            </td>
          </tr>
        `
      )
      .join("");

  const { error } =
    await resend.emails.send(
      {
        from:
          process.env
            .RESEND_FROM_EMAIL,

        to: [email],

        subject:
          "Ramen Cafe · Order Receipt",

        html: `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
              <div style="max-width:620px;margin:40px auto;padding:32px;background:#FFFDF8;border-radius:20px;">

                <h1 style="margin:0;color:#171513;">
                  Ramen Cafe
                </h1>

                <p style="color:#6B6258;">
                  Payment received — thank you!
                </p>

                <div style="margin-top:24px;padding:20px;background:#F5F0E8;border-radius:16px;">
                  <p style="margin:0 0 8px;">
                    <strong>Customer:</strong>
                    ${escapeHtml(
                      customer?.name ||
                        "Customer"
                    )}
                  </p>

                  <p style="margin:0 0 8px;">
                    <strong>Table:</strong>
                    ${escapeHtml(
                      orders[0]
                        ?.tableId ||
                        "—"
                    )}
                  </p>

                  <p style="margin:0;">
                    <strong>Paid:</strong>
                    ${price(
                      total
                    )}
                  </p>
                </div>

                <h2 style="margin-top:30px;color:#171513;">
                  Order Receipt
                </h2>

                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  ${itemsHtml}
                </table>

                <div style="margin-top:24px;padding-top:16px;border-top:2px solid #171513;text-align:right;">
                  <strong style="font-size:20px;">
                    Total Paid: ${price(
                      total
                    )}
                  </strong>
                </div>

                <p style="margin-top:28px;color:#8A8177;font-size:12px;">
                  Paid on ${date(
                    orders[0]
                      ?.payment
                      ?.paidAt
                  )}
                </p>

                <p style="margin-top:24px;color:#8A8177;font-size:12px;">
                  Ramen Cafe · ラーメンカフェ
                </p>

              </div>
            </body>
          </html>
        `,
      }
    );

  if (error) {
    console.error(
      "Receipt email error:",
      error
    );

    // We don't fail payment because email delivery
    // is a secondary operation.
    return;
  }

  // ----------------------------------------------------------
  // RECEIPT SENT
  // ----------------------------------------------------------

  const sentAt =
    new Date();

  await Order.updateMany(
    {
      _id: {
        $in:
          orders.map(
            (order) =>
              order._id
          ),
      },
    },
    {
      $set: {
        "receipt.sentAt":
          sentAt,
      },
    }
  );
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
  value
) {
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