import { connectDB } from "@/lib/mongodb";

import Table from "@/models/Table";
import Order from "@/models/Order";

import {
  requireTableAccess,
} from "@/lib/admin-auth";

// ============================================================
// ACTIVE ORDER QUERY
// ============================================================

function getActiveOrderQuery() {
  return {
    $or: [
      {
        status: {
          $in: [
            "pending",
            "confirmed",
            "preparing",
            "ready",
          ],
        },
      },

      {
        status:
          "served",

        paymentStatus: {
          $ne: "paid",
        },
      },
    ],
  };
}

// ============================================================
// NORMALIZE TABLE ID
// ============================================================

function normalizeTableId(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
}

// ============================================================
// VALIDATE TABLE ID
// ============================================================

function isValidTableId(
  tableId
) {
  return /^T[A-Z0-9-]+$/.test(
    tableId
  );
}

// ============================================================
// GET /api/admin/tables
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // AUTHORIZATION
    // ========================================================

    const auth =
      await requireTableAccess();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // TABLES
    // ========================================================

    const tables =
      await Table.find({})
        .sort({
          tableId: 1,
        })
        .lean();

    // ========================================================
    // ACTIVE ORDERS
    // ========================================================

    const activeOrders =
      await Order.find(
        getActiveOrderQuery()
      )
        .select(
          [
            "orderNumber",
            "tableId",
            "status",
            "customer",
            "total",
            "paymentStatus",
            "createdAt",
          ].join(" ")
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    // ========================================================
    // MAP ORDERS
    // ========================================================

    const orderMap =
      new Map();

    for (
      const order of
        activeOrders
    ) {
      const tableId =
        normalizeTableId(
          order.tableId
        );

      if (!tableId) {
        continue;
      }

      if (
        orderMap.has(
          tableId
        )
      ) {
        continue;
      }

      orderMap.set(
        tableId,
        order
      );
    }

    // ========================================================
    // BUILD RESPONSE
    // ========================================================

    const result =
      tables.map(
        (table) => {
          const activeOrder =
            orderMap.get(
              table.tableId
            ) || null;

          let status =
            "available";

          if (
            !table.isActive
          ) {
            status =
              "disabled";
          } else if (
            activeOrder
          ) {
            status =
              "occupied";
          }

          return {
            ...table,

            _id:
              table._id.toString(),

            status,

            activeOrder:
              activeOrder
                ? {
                    orderNumber:
                      activeOrder.orderNumber,

                    status:
                      activeOrder.status,

                    customer:
                      activeOrder
                        .customer
                        ?.name ||
                      "",

                    total:
                      Number(
                        activeOrder.total ||
                          0
                      ),

                    paymentStatus:
                      activeOrder.paymentStatus,

                    createdAt:
                      activeOrder.createdAt,
                  }
                : null,
          };
        }
      );

    // ========================================================
    // COUNTS
    // ========================================================

    const counts = {
      total:
        result.length,

      available:
        result.filter(
          (table) =>
            table.status ===
            "available"
        ).length,

      occupied:
        result.filter(
          (table) =>
            table.status ===
            "occupied"
        ).length,

      disabled:
        result.filter(
          (table) =>
            table.status ===
            "disabled"
        ).length,
    };

    return Response.json({
      success: true,
      tables: result,
      counts,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/tables error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load tables.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin/tables
// ============================================================

export async function POST(
  request
) {
  try {
    // ========================================================
    // AUTHORIZATION
    // ========================================================

    const auth =
      await requireTableAccess();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // BODY
    // ========================================================

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

    // ========================================================
    // TABLE ID
    // ========================================================

    const tableId =
      normalizeTableId(
        body.tableId
      );

    if (!tableId) {
      return Response.json(
        {
          success: false,
          error:
            "Table ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidTableId(
        tableId
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid table ID. Example: T01.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // NAME
    // ========================================================

    const name =
      String(
        body.name ||
          `Table ${tableId}`
      )
        .trim()
        .slice(0, 100);

    if (!name) {
      return Response.json(
        {
          success: false,
          error:
            "Table name is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // DUPLICATE
    // ========================================================

    const existing =
      await Table.findOne({
        tableId,
      }).lean();

    if (existing) {
      return Response.json(
        {
          success: false,
          error:
            `${tableId} already exists.`,
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // CREATE
    // ========================================================

    const table =
      await Table.create({
        tableId,

        name,

        isActive:
          body.isActive !==
          false,

        location:
          String(
            body.location ||
              ""
          )
            .trim()
            .slice(0, 100),

        notes:
          String(
            body.notes || ""
          )
            .trim()
            .slice(0, 500),
      });

    return Response.json(
      {
        success: true,

        message:
          "Table created successfully.",

        table: {
          ...table.toObject(),

          _id:
            table._id.toString(),

          status:
            table.isActive
              ? "available"
              : "disabled",

          activeOrder:
            null,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/tables error:",
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
            "This table ID already exists.",
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
          "Unable to create table.",
      },
      {
        status: 500,
      }
    );
  }
}