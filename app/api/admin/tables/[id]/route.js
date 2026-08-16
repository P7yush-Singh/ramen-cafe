import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";

import Table from "@/models/Table";
import Order from "@/models/Order";

// ==========================================================
// ACTIVE ORDER STATUSES
// ==========================================================

const ACTIVE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
];

// ==========================================================
// ADMIN AUTH
// ==========================================================

async function requireAdmin() {
  const user = await getServerUser();

  if (!user) {
    return {
      response: Response.json(
        {
          success: false,
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const isAdmin =
    user.role === "admin" ||
    user.isAdmin === true ||
    (process.env.ADMIN_EMAIL &&
      user.email &&
      user.email.toLowerCase() ===
        process.env.ADMIN_EMAIL.toLowerCase());

  if (!isAdmin) {
    return {
      response: Response.json(
        {
          success: false,
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    response: null,
  };
}

// ==========================================================
// GET PARAM TABLE ID
// ==========================================================

async function getTableId(params) {
  const resolvedParams = await params;

  return String(
    resolvedParams?.id || ""
  )
    .trim()
    .toUpperCase();
}

// ==========================================================
// GET ACTIVE ORDER
// ==========================================================

async function getActiveOrder(tableId) {
  return Order.findOne({
    tableId,

    status: {
      $in: ACTIVE_ORDER_STATUSES,
    },
  })
    .sort({
      createdAt: -1,
    })
    .select(
      "orderNumber status customer total createdAt"
    )
    .lean();
}

// ==========================================================
// BUILD TABLE RESPONSE
// ==========================================================

function buildTableResponse(
  table,
  activeOrder
) {
  let status = "available";

  if (!table.isActive) {
    status = "disabled";
  } else if (activeOrder) {
    status = "occupied";
  }

  return {
    ...table.toObject(),

    _id: table._id.toString(),

    status,

    activeOrder: activeOrder
      ? {
          orderNumber:
            activeOrder.orderNumber,

          status:
            activeOrder.status,

          customer:
            activeOrder.customer?.name ||
            "",

          total:
            activeOrder.total || 0,

          createdAt:
            activeOrder.createdAt,
        }
      : null,
  };
}

// ==========================================================
// GET SINGLE TABLE
// ==========================================================

export async function GET(
  request,
  { params }
) {
  try {
    const auth = await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    const tableId =
      await getTableId(params);

    if (!tableId) {
      return Response.json(
        {
          success: false,
          error: "Table ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const table =
      await Table.findOne({
        tableId,
      });

    if (!table) {
      return Response.json(
        {
          success: false,
          error: "Table not found.",
        },
        {
          status: 404,
        }
      );
    }

    const activeOrder =
      await getActiveOrder(tableId);

    return Response.json({
      success: true,

      table: buildTableResponse(
        table,
        activeOrder
      ),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/tables/[id] error:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Unable to load table.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================================
// PATCH TABLE
// ==========================================================

export async function PATCH(
  request,
  { params }
) {
  try {
    const auth = await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    const tableId =
      await getTableId(params);

    if (!tableId) {
      return Response.json(
        {
          success: false,
          error: "Table ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const table =
      await Table.findOne({
        tableId,
      });

    if (!table) {
      return Response.json(
        {
          success: false,
          error: "Table not found.",
        },
        {
          status: 404,
        }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // CHECK ACTIVE ORDER
    // --------------------------------------------------------

    const activeOrder =
      await getActiveOrder(tableId);

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    if (body.name !== undefined) {
      const name = String(
        body.name || ""
      )
        .trim()
        .slice(0, 100);

      if (!name) {
        return Response.json(
          {
            success: false,
            error:
              "Table name cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      table.name = name;
    }

    // --------------------------------------------------------
    // ACTIVE / DISABLED
    // --------------------------------------------------------

    if (body.isActive !== undefined) {
      const nextActive = Boolean(
        body.isActive
      );

      // Do not disable a table that
      // currently has an active order.
      if (
        !nextActive &&
        activeOrder
      ) {
        return Response.json(
          {
            success: false,
            error:
              `Cannot disable ${tableId} while it has an active order.`,
            orderNumber:
              activeOrder.orderNumber,
          },
          {
            status: 409,
          }
        );
      }

      table.isActive =
        nextActive;
    }

    // --------------------------------------------------------
    // LOCATION
    // --------------------------------------------------------

    if (
      body.location !== undefined
    ) {
      table.location = String(
        body.location || ""
      )
        .trim()
        .slice(0, 100);
    }

    // --------------------------------------------------------
    // NOTES
    // --------------------------------------------------------

    if (body.notes !== undefined) {
      table.notes = String(
        body.notes || ""
      )
        .trim()
        .slice(0, 500);
    }

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    await table.save();

    // --------------------------------------------------------
    // RETURN
    // --------------------------------------------------------

    return Response.json({
      success: true,

      message:
        "Table updated successfully.",

      table: buildTableResponse(
        table,
        activeOrder
      ),
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/tables/[id] error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to update table.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================================
// DELETE TABLE
// ==========================================================

export async function DELETE(
  request,
  { params }
) {
  try {
    const auth = await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    const tableId =
      await getTableId(params);

    if (!tableId) {
      return Response.json(
        {
          success: false,
          error: "Table ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    // --------------------------------------------------------
    // CHECK ACTIVE ORDER
    // --------------------------------------------------------

    const activeOrder =
      await Order.findOne({
        tableId,

        status: {
          $in: ACTIVE_ORDER_STATUSES,
        },
      })
        .select(
          "_id orderNumber"
        )
        .lean();

    if (activeOrder) {
      return Response.json(
        {
          success: false,
          error:
            `Cannot delete ${tableId} while it has an active order.`,

          orderNumber:
            activeOrder.orderNumber,
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    const deleted =
      await Table.findOneAndDelete({
        tableId,
      });

    if (!deleted) {
      return Response.json(
        {
          success: false,
          error: "Table not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,

      message:
        `${tableId} deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/tables/[id] error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to delete table.",
      },
      {
        status: 500,
      }
    );
  }
}