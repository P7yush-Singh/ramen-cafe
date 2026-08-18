import { connectDB } from "@/lib/mongodb";
import Table from "@/models/Table";

// ==========================================================
// NORMALIZE TABLE ID
// ==========================================================

function normalizeTableId(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

// ==========================================================
// VALIDATE TABLE ID FORMAT
// ==========================================================

function isValidTableId(tableId) {
  return /^T[A-Z0-9-]+$/.test(
    tableId
  );
}

// ==========================================================
// GET /api/tables/validate?table=T01
// ==========================================================

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const tableId =
      normalizeTableId(
        searchParams.get("table")
      );

    // ========================================================
    // REQUIRED
    // ========================================================

    if (!tableId) {
      return Response.json(
        {
          success: false,
          valid: false,
          error:
            "Table ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // FORMAT
    // ========================================================

    if (
      !isValidTableId(tableId)
    ) {
      return Response.json(
        {
          success: false,
          valid: false,
          error:
            "Invalid table ID.",
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

    const table =
      await Table.findOne({
        tableId,
        isActive: true,
      })
        .select(
          "tableId name location isActive"
        )
        .lean();

    // ========================================================
    // NOT FOUND
    // ========================================================

    if (!table) {
      return Response.json(
        {
          success: false,
          valid: false,
          error:
            "This table is unavailable. Please scan the QR code from your table again.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    return Response.json(
      {
        success: true,
        valid: true,

        table: {
          tableId:
            table.tableId,

          name:
            table.name,

          location:
            table.location,

          isActive:
            table.isActive,
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Table validation error:",
      error
    );

    return Response.json(
      {
        success: false,
        valid: false,
        error:
          "Unable to validate table.",
      },
      {
        status: 500,
      }
    );
  }
}