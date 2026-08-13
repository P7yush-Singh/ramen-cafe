"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { QRCodeCanvas } from "qrcode.react";

import QRCode from "qrcode";
import JSZip from "jszip";

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG = {
  available: {
    label: "Available",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700",
  },

  occupied: {
    label: "Occupied",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700",
  },

  disabled: {
    label: "Disabled",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600",
  },
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  } catch {
    return "—";
  }
}

function formatPrice(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// PAGE
// ============================================================

export default function AdminTablesPage() {
  // ==========================================================
  // TABLE DATA
  // ==========================================================

  const [tables, setTables] = useState([]);

  const [counts, setCounts] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    disabled: 0,
  });

  // ==========================================================
  // LOADING
  // ==========================================================

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  // ==========================================================
  // FORM
  // ==========================================================

  const [showForm, setShowForm] =
    useState(false);

  const [editingTable, setEditingTable] =
    useState(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [form, setForm] = useState({
    tableId: "",
    name: "",
    location: "",
    notes: "",
    isActive: true,
  });

  // ==========================================================
  // DELETE
  // ==========================================================

  const [deletingTable, setDeletingTable] =
    useState(null);

  // ==========================================================
  // QR MODAL
  // ==========================================================

  const [showQR, setShowQR] =
    useState(null);

  // ==========================================================
  // BULK QR SELECTION
  // ==========================================================

  const [selectedTables, setSelectedTables] =
    useState([]);

  const [isGeneratingQR, setIsGeneratingQR] =
    useState(false);

  // ==========================================================
  // LOAD TABLES
  // ==========================================================

  const loadTables = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/admin/tables",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load tables."
          );
        }

        const nextTables =
          Array.isArray(data.tables)
            ? data.tables
            : [];

        setTables(nextTables);

        setCounts(
          data.counts || {
            total: 0,
            available: 0,
            occupied: 0,
            disabled: 0,
          }
        );

        // Remove deleted tables
        // from current selection.
        setSelectedTables(
          (current) =>
            current.filter((tableId) =>
              nextTables.some(
                (table) =>
                  table.tableId ===
                  tableId
              )
            )
        );
      } catch (error) {
        console.error(
          "Admin tables error:",
          error
        );

        setError(
          error.message ||
            "Unable to load tables."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    const interval = setInterval(
      () => {
        loadTables({
          silent: true,
        });
      },
      15000
    );

    return () => {
      clearInterval(interval);
    };
  }, [loadTables]);

  // ==========================================================
  // AUTO CLEAR SUCCESS MESSAGE
  // ==========================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [success]);

  // ==========================================================
  // FILTERED TABLES
  // ==========================================================

  const filteredTables = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return tables.filter((table) => {
      const matchesSearch =
        !query ||
        table.tableId
          ?.toLowerCase()
          .includes(query) ||
        table.name
          ?.toLowerCase()
          .includes(query) ||
        table.location
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        table.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    tables,
    search,
    statusFilter,
  ]);

  // ==========================================================
  // SELECTED TABLE OBJECTS
  // ==========================================================

  const selectedTableObjects =
    useMemo(() => {
      return tables.filter((table) =>
        selectedTables.includes(
          table.tableId
        )
      );
    }, [
      tables,
      selectedTables,
    ]);

  // ==========================================================
  // ALL FILTERED SELECTED?
  // ==========================================================

  const allFilteredSelected =
    filteredTables.length > 0 &&
    filteredTables.every((table) =>
      selectedTables.includes(
        table.tableId
      )
    );

  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  function openCreate() {
    setEditingTable(null);

    setForm({
      tableId: "",
      name: "",
      location: "",
      notes: "",
      isActive: true,
    });

    setError("");

    setShowForm(true);
  }

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  function openEdit(table) {
    setEditingTable(table);

    setForm({
      tableId: table.tableId,
      name: table.name || "",
      location: table.location || "",
      notes: table.notes || "",
      isActive:
        table.isActive !== false,
    });

    setError("");

    setShowForm(true);
  }

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  function closeForm() {
    if (isSaving) {
      return;
    }

    setShowForm(false);

    setEditingTable(null);

    setForm({
      tableId: "",
      name: "",
      location: "",
      notes: "",
      isActive: true,
    });
  }

  // ==========================================================
  // FORM UPDATE
  // ==========================================================

  function updateForm(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==========================================================
  // SAVE TABLE
  // ==========================================================

  async function saveTable(event) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingTable);

      const url = isEditing
        ? `/api/admin/tables/${encodeURIComponent(
            editingTable.tableId
          )}`
        : "/api/admin/tables";

      const method = isEditing
        ? "PATCH"
        : "POST";

      const payload = {
        name:
          form.name.trim(),

        location:
          form.location.trim(),

        notes:
          form.notes.trim(),

        isActive:
          form.isActive,
      };

      // Only create requests
      // receive tableId.
      if (!isEditing) {
        payload.tableId =
          form.tableId
            .trim()
            .toUpperCase();
      }

      const response =
        await fetch(url, {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify(
            payload
          ),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save table."
        );
      }

      setShowForm(false);

      setEditingTable(null);

      setForm({
        tableId: "",
        name: "",
        location: "",
        notes: "",
        isActive: true,
      });

      setSuccess(
        isEditing
          ? "Table updated successfully."
          : "Table created successfully."
      );

      await loadTables({
        silent: true,
      });
    } catch (error) {
      console.error(
        "Save table error:",
        error
      );

      setError(
        error.message ||
          "Unable to save table."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ==========================================================
  // TOGGLE TABLE
  // ==========================================================

  async function toggleTable(table) {
    // Cannot disable occupied table.
    if (
      table.status ===
        "occupied" &&
      table.isActive
    ) {
      setError(
        `${table.tableId} has an active order and cannot be disabled.`
      );

      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/tables/${encodeURIComponent(
            table.tableId
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              isActive:
                !table.isActive,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update table."
        );
      }

      setSuccess(
        table.isActive
          ? `${table.tableId} disabled.`
          : `${table.tableId} enabled.`
      );

      await loadTables({
        silent: true,
      });
    } catch (error) {
      console.error(
        "Toggle table error:",
        error
      );

      setError(
        error.message ||
          "Unable to update table."
      );
    }
  }

  // ==========================================================
  // DELETE TABLE
  // ==========================================================

  async function deleteTable(table) {
    if (deletingTable) {
      return;
    }

    if (
      table.status ===
      "occupied"
    ) {
      setError(
        `${table.tableId} has an active order and cannot be deleted.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${table.tableId}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTable(
        table.tableId
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/tables/${encodeURIComponent(
            table.tableId
          )}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete table."
        );
      }

      setSelectedTables(
        (current) =>
          current.filter(
            (id) =>
              id !==
              table.tableId
          )
      );

      setSuccess(
        `${table.tableId} deleted successfully.`
      );

      await loadTables({
        silent: true,
      });
    } catch (error) {
      console.error(
        "Delete table error:",
        error
      );

      setError(
        error.message ||
          "Unable to delete table."
      );
    } finally {
      setDeletingTable(null);
    }
  }

  // ==========================================================
  // TABLE MENU URL
  // ==========================================================

  function getTableMenuUrl(table) {
    if (
      typeof window ===
      "undefined"
    ) {
      return "";
    }

    return `${
      window.location.origin
    }/menu?table=${encodeURIComponent(
      table.tableId
    )}`;
  }

  // ==========================================================
  // COPY TABLE URL
  // ==========================================================

  async function copyTableUrl(table) {
    try {
      const url =
        getTableMenuUrl(table);

      await navigator.clipboard.writeText(
        url
      );

      setSuccess(
        `${table.tableId} menu URL copied.`
      );
    } catch (error) {
      console.error(
        "Copy URL error:",
        error
      );

      setError(
        "Unable to copy table URL."
      );
    }
  }

  // ==========================================================
  // SELECT TABLE
  // ==========================================================

  function toggleTableSelection(
    tableId
  ) {
    setSelectedTables(
      (current) => {
        if (
          current.includes(
            tableId
          )
        ) {
          return current.filter(
            (id) =>
              id !== tableId
          );
        }

        return [
          ...current,
          tableId,
        ];
      }
    );
  }

  // ==========================================================
  // SELECT ALL FILTERED
  // ==========================================================

  function selectAllFiltered() {
    setSelectedTables(
      (current) => {
        const ids =
          filteredTables.map(
            (table) =>
              table.tableId
          );

        const merged =
          new Set([
            ...current,
            ...ids,
          ]);

        return Array.from(
          merged
        );
      }
    );
  }

  // ==========================================================
  // CLEAR FILTERED SELECTION
  // ==========================================================

  function clearFilteredSelection() {
    const filteredIds =
      new Set(
        filteredTables.map(
          (table) =>
            table.tableId
        )
      );

    setSelectedTables(
      (current) =>
        current.filter(
          (id) =>
            !filteredIds.has(id)
        )
    );
  }

  // ==========================================================
  // CLEAR ALL SELECTION
  // ==========================================================

  function clearAllSelection() {
    setSelectedTables([]);
  }

  // ==========================================================
  // BULK QR GENERATION
  // ==========================================================

  async function downloadSelectedQRs() {
    if (
      selectedTableObjects.length ===
      0
    ) {
      setError(
        "Select at least one table."
      );

      return;
    }

    if (isGeneratingQR) {
      return;
    }

    try {
      setIsGeneratingQR(true);

      setError("");
      setSuccess("");

      const zip =
        new JSZip();

      // ------------------------------------------------------
      // GENERATE EACH QR
      // ------------------------------------------------------

      for (const table of selectedTableObjects) {
        const url =
          getTableMenuUrl(
            table
          );

        if (!url) {
          continue;
        }

        const dataUrl =
          await QRCode.toDataURL(
            url,
            {
              width: 1600,

              margin: 4,

              errorCorrectionLevel:
                "H",

              type: "image/png",
            }
          );

        const base64 =
          dataUrl.split(
            ","
          )[1];

        if (!base64) {
          continue;
        }

        zip.file(
          `${table.tableId}.png`,
          base64,
          {
            base64: true,
          }
        );
      }

      // ------------------------------------------------------
      // GENERATE ZIP
      // ------------------------------------------------------

      const blob =
        await zip.generateAsync(
          {
            type: "blob",

            compression:
              "DEFLATE",

            compressionOptions: {
              level: 6,
            },
          }
        );

      // ------------------------------------------------------
      // DOWNLOAD
      // ------------------------------------------------------

      const downloadUrl =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        downloadUrl;

      anchor.download =
        `ramen-cafe-table-qrs-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.zip`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        downloadUrl
      );

      setSuccess(
        `${selectedTableObjects.length} QR code${
          selectedTableObjects.length ===
          1
            ? ""
            : "s"
        } downloaded successfully.`
      );
    } catch (error) {
      console.error(
        "Bulk QR generation error:",
        error
      );

      setError(
        "Unable to generate QR codes. Please try again."
      );
    } finally {
      setIsGeneratingQR(false);
    }
  }

  // ==========================================================
  // PRINT SELECTED QR CODES
  // ==========================================================

  async function printSelectedQRs() {
    if (selectedTableObjects.length === 0) {
      setError("Select at least one table.");
      return;
    }

    if (isGeneratingQR) {
      return;
    }

    try {
      setIsGeneratingQR(true);
      setError("");
      setSuccess("");

      const qrItems = [];

      for (const table of selectedTableObjects) {
        const url = getTableMenuUrl(table);

        if (!url) {
          continue;
        }

        const dataUrl = await QRCode.toDataURL(url, {
          width: 1200,
          margin: 4,
          errorCorrectionLevel: "H",
          type: "image/png",
        });

        qrItems.push({
          tableId: table.tableId,
          name: table.name || "",
          location: table.location || "",
          url,
          dataUrl,
        });
      }

      if (qrItems.length === 0) {
        throw new Error("No valid QR codes could be generated.");
      }

      const printWindow = window.open(
        "",
        "_blank",
        "width=1000,height=900"
      );

      if (!printWindow) {
        setError(
          "Please allow pop-ups to print the QR codes."
        );
        return;
      }

      const cards = qrItems
        .map(
          (item) => `
            <div class="qr-card">
              <div class="brand">RAMEN CAFE</div>

              <div class="table-number">
                TABLE ${escapeHtml(item.tableId)}
              </div>

              ${
                item.name
                  ? `
                    <div class="table-name">
                      ${escapeHtml(item.name)}
                    </div>
                  `
                  : ""
              }

              ${
                item.location
                  ? `
                    <div class="location">
                      ${escapeHtml(item.location)}
                    </div>
                  `
                  : ""
              }

              <div class="instruction">
                Scan the QR code to view our menu
                and place your order.
              </div>

              <img
                src="${item.dataUrl}"
                alt="QR code for table ${escapeHtml(item.tableId)}"
              />

              <div class="url">
                ${escapeHtml(item.url)}
              </div>

              <div class="footer">
                Thank you for dining with us.
              </div>
            </div>
          `
        )
        .join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ramen Cafe - Table QR Codes</title>

            <style>
              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
              }

              body {
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              .print-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                padding: 20px;
              }

              .qr-card {
                min-height: 520px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                text-align: center;
                border: 1px solid #ddd;
                border-radius: 18px;
                padding: 28px 20px;
                page-break-inside: avoid;
                break-inside: avoid;
              }

              .brand {
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 5px;
                color: #171513;
              }

              .table-number {
                margin-top: 10px;
                font-size: 30px;
                font-weight: 700;
                color: #171513;
              }

              .table-name {
                margin-top: 6px;
                font-size: 14px;
                font-weight: 600;
                color: #555;
              }

              .location {
                margin-top: 4px;
                font-size: 11px;
                color: #777;
              }

              .instruction {
                max-width: 300px;
                margin-top: 14px;
                font-size: 12px;
                line-height: 1.5;
                color: #555;
              }

              img {
                display: block;
                width: 280px;
                height: 280px;
                max-width: 80%;
                margin-top: 20px;
              }

              .url {
                max-width: 320px;
                margin-top: 12px;
                font-size: 8px;
                line-height: 1.4;
                color: #888;
                word-break: break-all;
              }

              .footer {
                margin-top: 12px;
                font-size: 9px;
                color: #999;
              }

              @page {
                size: A4;
                margin: 10mm;
              }

              @media print {
                body {
                  background: #ffffff;
                }

                .print-container {
                  padding: 0;
                  gap: 12px;
                }

                .qr-card {
                  border: 1px solid #ddd;
                }
              }

              @media screen and (max-width: 800px) {
                .print-container {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>

          <body>
            <div class="print-container">
              ${cards}
            </div>

            <script>
              window.onload = function () {
                setTimeout(function () {
                  window.print();
                }, 500);
              };

              window.onafterprint = function () {
                window.close();
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();

      setSuccess(
        `${qrItems.length} QR code${
          qrItems.length === 1 ? "" : "s"
        } ready for printing.`
      );
    } catch (error) {
      console.error("Print selected QR error:", error);

      setError(
        error.message ||
          "Unable to print QR codes."
      );
    } finally {
      setIsGeneratingQR(false);
    }
  }

  // ==========================================================
  // DOWNLOAD INDIVIDUAL QR
  // ==========================================================

  async function downloadSingleQR(
    table
  ) {
    try {
      setError("");

      const url =
        getTableMenuUrl(
          table
        );

      const dataUrl =
        await QRCode.toDataURL(
          url,
          {
            width: 1600,

            margin: 4,

            errorCorrectionLevel:
              "H",

            type: "image/png",
          }
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        dataUrl;

      anchor.download =
        `${table.tableId}.png`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      setSuccess(
        `${table.tableId} QR downloaded.`
      );
    } catch (error) {
      console.error(
        "Single QR download error:",
        error
      );

      setError(
        "Unable to download QR code."
      );
    }
  }

  // ==========================================================
  // PRINT SINGLE QR
  // ==========================================================

  async function printTableQR(
    table
  ) {
    try {
      setError("");

      const url =
        getTableMenuUrl(
          table
        );

      const dataUrl =
        await QRCode.toDataURL(
          url,
          {
            width: 1200,

            margin: 4,

            errorCorrectionLevel:
              "H",

            type: "image/png",
          }
        );

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=700,height=900"
        );

      if (!printWindow) {
        setError(
          "Please allow pop-ups to print the QR code."
        );

        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>
          <head>
            <title>
              Ramen Cafe - ${table.tableId}
            </title>

            <style>
              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                background: white;
              }

              body {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              .card {
                width: 600px;
                max-width: 90vw;
                text-align: center;
                padding: 50px 35px;
              }

              .brand {
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 5px;
              }

              .table {
                margin-top: 14px;
                font-size: 42px;
                font-weight: 700;
              }

              .instruction {
                margin-top: 14px;
                font-size: 16px;
                line-height: 1.5;
                color: #555;
              }

              img {
                display: block;
                width: 380px;
                height: 380px;
                max-width: 80vw;
                margin: 35px auto 0;
              }

              .url {
                margin-top: 22px;
                font-size: 11px;
                line-height: 1.5;
                color: #777;
                word-break: break-all;
              }

              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #888;
              }

              @media print {
                body {
                  min-height: auto;
                }

                .card {
                  width: 100%;
                  max-width: none;
                }
              }
            </style>
          </head>

          <body>
            <div class="card">
              <div class="brand">
                RAMEN CAFE
              </div>

              <div class="table">
                TABLE ${table.tableId}
              </div>

              <div class="instruction">
                Scan the QR code to view our menu
                and place your order.
              </div>

              <img
                src="${dataUrl}"
                alt="Table ${table.tableId} QR code"
              />

              <div class="url">
                ${url}
              </div>

              <div class="footer">
                Thank you for dining with us.
              </div>
            </div>

            <script>
              window.onload = function () {
                setTimeout(function () {
                  window.print();
                }, 300);
              };

              window.onafterprint = function () {
                window.close();
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error(
        "Print QR error:",
        error
      );

      setError(
        "Unable to print QR code."
      );
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="border-b border-[#E5DED2]">
        <div className="mx-auto max-w-[1440px] px-6 py-7 lg:px-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B83A2E]">
                Restaurant Management
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Tables
              </h1>

              <p className="mt-2 text-sm text-[#6B6258]">
                Manage restaurant tables,
                availability and QR
                ordering.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  loadTables({
                    silent: true,
                  })
                }
                disabled={
                  isRefreshing
                }
                className="flex items-center gap-2 rounded-full border border-[#DED6C9] bg-[#FFFDF8] px-4 py-2.5 text-sm font-medium transition hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={
                  openCreate
                }
                className="flex items-center gap-2 rounded-full bg-[#171513] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#B83A2E]"
              >
                <Plus
                  size={16}
                />

                Add Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="mx-auto max-w-[1440px] px-6 py-7 lg:px-10">
        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="shrink-0 rounded-full p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <Check
                size={16}
              />

              <span>
                {success}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="rounded-full p-1 hover:bg-green-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Tables"
            value={
              counts.total
            }
          />

          <StatCard
            label="Available"
            value={
              counts.available
            }
            dot="bg-green-500"
          />

          <StatCard
            label="Occupied"
            value={
              counts.occupied
            }
            dot="bg-red-500"
          />

          <StatCard
            label="Disabled"
            value={
              counts.disabled
            }
            dot="bg-gray-400"
          />
        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] p-3 sm:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8177]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search tables..."
              className="w-full rounded-xl border border-[#E5DED2] bg-[#F5F0E8] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#171513]"
            />
          </div>

          {/* STATUS */}

          <div className="flex gap-2 overflow-x-auto">
            {[
              ["all", "All"],
              [
                "available",
                "Available",
              ],
              [
                "occupied",
                "Occupied",
              ],
              [
                "disabled",
                "Disabled",
              ],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      value
                    )
                  }
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-medium transition ${
                    statusFilter ===
                    value
                      ? "bg-[#171513] text-white"
                      : "bg-[#F5F0E8] text-[#6B6258] hover:bg-[#EAE3D8]"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* ==================================================
            BULK QR TOOLBAR
        ================================================== */}

        {!isLoading &&
          filteredTables.length >
            0 && (
            <div className="mt-4 rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      allFilteredSelected
                        ? clearFilteredSelection
                        : selectAllFiltered
                    }
                    className="rounded-xl border border-[#DED6C9] px-3.5 py-2.5 text-xs font-medium transition hover:bg-[#F5F0E8]"
                  >
                    {allFilteredSelected
                      ? "Clear Filtered"
                      : "Select All"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAllSelection
                    }
                    disabled={
                      selectedTables.length ===
                      0
                    }
                    className="rounded-xl border border-[#DED6C9] px-3.5 py-2.5 text-xs font-medium transition hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear All
                  </button>

                  <span className="rounded-xl bg-[#F5F0E8] px-3.5 py-2.5 text-xs font-medium text-[#6B6258]">
                    {selectedTables.length}{" "}
                    selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      downloadSelectedQRs
                    }
                    disabled={
                      selectedTables.length ===
                        0 ||
                      isGeneratingQR
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#171513] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#B83A2E] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isGeneratingQR ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Download
                        size={15}
                      />
                    )}

                    {isGeneratingQR
                      ? "Generating QR..."
                      : `Download QR${
                          selectedTables.length
                            ? ` (${selectedTables.length})`
                            : ""
                        }`}
                  </button>

                  <button
                    type="button"
                    onClick={
                      printSelectedQRs
                    }
                    disabled={
                      selectedTables.length ===
                        0 ||
                      isGeneratingQR
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-5 py-2.5 text-xs font-semibold text-[#171513] transition hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Printer size={15} />

                    {`Print QR${
                      selectedTables.length
                        ? ` (${selectedTables.length})`
                        : ""
                    }`}
                  </button>
                </div>
              </div>

              {selectedTables.length >
                0 && (
                <p className="mt-3 text-xs text-[#8A8177]">
                  Download saves all selected QR
                  codes as one ZIP file. Print opens
                  a print-ready page for all selected
                  tables.
                </p>
              )}
            </div>
          )}

        {/* ==================================================
            RESULT COUNT
        ================================================== */}

        {!isLoading &&
          tables.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-[#8A8177]">
                Showing{" "}
                <span className="font-medium text-[#171513]">
                  {
                    filteredTables.length
                  }
                </span>{" "}
                of{" "}
                <span className="font-medium text-[#171513]">
                  {tables.length}
                </span>{" "}
                tables
              </p>

              {isRefreshing && (
                <div className="flex items-center gap-2 text-xs text-[#8A8177]">
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />

                  Updating...
                </div>
              )}
            </div>
          )}

        {/* ==================================================
            TABLES
        ================================================== */}

        {isLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[
              1, 2, 3, 4,
              5, 6, 7, 8,
            ].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl border border-[#DED6C9] bg-[#FFFDF8]"
              />
            ))}
          </div>
        ) : filteredTables.length ===
          0 ? (
          <div className="mt-6 rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F0E8]">
              <QrCode
                size={24}
              />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No tables found
            </h2>

            <p className="mt-2 text-sm text-[#6B6258]">
              {tables.length ===
              0
                ? "Create your first restaurant table."
                : "Try changing your search or status filter."}
            </p>

            {tables.length ===
              0 && (
              <button
                type="button"
                onClick={
                  openCreate
                }
                className="mt-5 rounded-full bg-[#171513] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#B83A2E]"
              >
                Add Table
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredTables.map(
              (table) => (
                <TableCard
                  key={table._id}
                  table={table}
                  selected={selectedTables.includes(
                    table.tableId
                  )}
                  onSelect={() =>
                    toggleTableSelection(
                      table.tableId
                    )
                  }
                  onEdit={
                    openEdit
                  }
                  onToggle={
                    toggleTable
                  }
                  onDelete={
                    deleteTable
                  }
                  onQR={() =>
                    setShowQR(
                      table
                    )
                  }
                  deleting={
                    deletingTable ===
                    table.tableId
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {/* ====================================================
          CREATE / EDIT MODAL
      ==================================================== */}

      {showForm && (
        <Modal
          onClose={closeForm}
        >
          <div className="flex items-center justify-between border-b border-[#E5DED2] px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#B83A2E]">
                Table Management
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {editingTable
                  ? "Edit Table"
                  : "Create Table"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DED6C9] transition hover:bg-[#F5F0E8]"
            >
              <X size={17} />
            </button>
          </div>

          <form
            onSubmit={
              saveTable
            }
            className="space-y-4 p-6"
          >
            {/* TABLE ID */}

            {!editingTable ? (
              <Field
                label="Table ID"
                required
              >
                <input
                  value={
                    form.tableId
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "tableId",
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="T01"
                  required
                  pattern="^T[A-Z0-9-]+$"
                  title="Example: T01 or T-A01"
                  maxLength={30}
                  className="w-full rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm outline-none transition focus:border-[#171513]"
                />

                <p className="mt-1.5 text-xs text-[#8A8177]">
                  Example: T01,
                  T02, T03
                </p>
              </Field>
            ) : (
              <Field label="Table ID">
                <div className="w-full rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm font-semibold text-[#6B6258]">
                  {
                    editingTable.tableId
                  }
                </div>

                <p className="mt-1.5 text-xs text-[#8A8177]">
                  Table ID cannot
                  be changed after
                  creation.
                </p>
              </Field>
            )}

            {/* NAME */}

            <Field
              label="Table Name"
              required
            >
              <input
                value={form.name}
                onChange={(event) =>
                  updateForm(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Table T01"
                maxLength={100}
                required
                className="w-full rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm outline-none transition focus:border-[#171513]"
              />
            </Field>

            {/* LOCATION */}

            <Field label="Location">
              <input
                value={
                  form.location
                }
                onChange={(event) =>
                  updateForm(
                    "location",
                    event.target.value
                  )
                }
                placeholder="Main Hall"
                maxLength={100}
                className="w-full rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm outline-none transition focus:border-[#171513]"
              />
            </Field>

            {/* NOTES */}

            <Field label="Notes">
              <textarea
                value={
                  form.notes
                }
                onChange={(event) =>
                  updateForm(
                    "notes",
                    event.target.value
                  )
                }
                rows={3}
                maxLength={500}
                placeholder="Near window..."
                className="w-full resize-none rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm outline-none transition focus:border-[#171513]"
              />

              <p className="mt-1 text-right text-[10px] text-[#8A8177]">
                {
                  form.notes.length
                }
                /500
              </p>
            </Field>

            {/* ACTIVE */}

            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  Table Active
                </p>

                <p className="mt-0.5 text-xs text-[#6B6258]">
                  Customers can
                  use this table
                  QR.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                onChange={(
                  event
                ) =>
                  updateForm(
                    "isActive",
                    event.target.checked
                  )
                }
                className="h-5 w-5 accent-[#171513]"
              />
            </label>

            {/* OCCUPIED WARNING */}

            {editingTable &&
              editingTable.status ===
                "occupied" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-semibold text-red-700">
                    Active order
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-600">
                    This table
                    currently has
                    an active order.
                    It cannot be
                    disabled or
                    deleted until
                    the order is
                    completed.
                  </p>
                </div>
              )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                isSaving ||
                (editingTable &&
                  editingTable.status ===
                    "occupied" &&
                  form.isActive ===
                    false)
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171513] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#B83A2E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {editingTable
                ? "Save Changes"
                : "Create Table"}
            </button>
          </form>
        </Modal>
      )}

      {/* ====================================================
          QR MODAL
      ==================================================== */}

      {showQR && (
        <Modal
          onClose={() =>
            setShowQR(null)
          }
        >
          <div className="p-6">
            {/* HEADER */}

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#B83A2E]">
                  Table QR
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  {
                    showQR.tableId
                  }
                </h2>

                <p className="mt-1 text-sm text-[#6B6258]">
                  {showQR.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowQR(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DED6C9] transition hover:bg-[#F5F0E8]"
              >
                <X size={17} />
              </button>
            </div>

            {/* QR */}

            <div className="mt-7 flex justify-center">
              <div className="rounded-3xl border border-[#DED6C9] bg-white p-5 shadow-sm">
                <QRCodeCanvas
                  value={getTableMenuUrl(
                    showQR
                  )}
                  size={240}
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            {/* URL */}

            <div className="mt-5 rounded-2xl bg-[#F5F0E8] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8177]">
                QR Destination
              </p>

              <p className="mt-2 break-all text-xs leading-5 text-[#6B6258]">
                {getTableMenuUrl(
                  showQR
                )}
              </p>
            </div>

            {/* ACTIONS */}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  copyTableUrl(
                    showQR
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm font-medium transition hover:bg-[#F5F0E8]"
              >
                <Copy
                  size={15}
                />

                Copy URL
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadSingleQR(
                    showQR
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm font-medium transition hover:bg-[#F5F0E8]"
              >
                <Download
                  size={15}
                />

                Download
              </button>

              <button
                type="button"
                onClick={() =>
                  printTableQR(
                    showQR
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-[#171513] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#B83A2E]"
              >
                <Printer
                  size={15}
                />

                Print
              </button>

              <a
                href={getTableMenuUrl(
                  showQR
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm font-medium transition hover:bg-[#F5F0E8]"
              >
                <ExternalLink
                  size={15}
                />

                Open Menu
              </a>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  dot,
}) {
  return (
    <div className="rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#8A8177]">
          {label}
        </span>

        {dot && (
          <span
            className={`h-2.5 w-2.5 rounded-full ${dot}`}
          />
        )}
      </div>

      <p className="mt-3 text-3xl font-semibold">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// TABLE CARD
// ============================================================

function TableCard({
  table,
  selected,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
  onQR,
  deleting,
}) {
  const config =
    STATUS_CONFIG[
      table.status
    ] ||
    STATUS_CONFIG.available;

  const isOccupied =
    table.status ===
    "occupied";

  return (
    <div
      className={`overflow-hidden rounded-3xl border bg-[#FFFDF8] transition hover:-translate-y-0.5 hover:shadow-lg ${
        selected
          ? "border-[#171513] ring-2 ring-[#171513]/10"
          : "border-[#DED6C9]"
      }`}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex min-w-0 items-start gap-3">
          {/* CHECKBOX */}

          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer accent-[#171513]"
            aria-label={`Select ${table.tableId}`}
          />

          {/* TABLE INFO */}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold">
                {table.tableId}
              </h2>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${config.badge}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                />

                {
                  config.label
                }
              </span>
            </div>

            <p className="mt-1 truncate text-sm text-[#6B6258]">
              {table.name}
            </p>
          </div>
        </div>

        {/* QR */}

        <button
          type="button"
          onClick={() =>
            onQR(table)
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DED6C9] transition hover:bg-[#F5F0E8]"
          title="Show QR"
        >
          <QrCode
            size={18}
          />
        </button>
      </div>

      {/* ==================================================
          INFO
      ================================================== */}

      <div className="border-y border-[#E5DED2] px-5 py-4">
        {table.location ? (
          <div className="flex items-start gap-2">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B83A2E]" />

            <p className="text-sm text-[#6B6258]">
              {table.location}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#8A8177]">
            No location specified
          </p>
        )}

        {table.notes && (
          <p className="mt-2 text-xs leading-5 text-[#8A8177]">
            {table.notes}
          </p>
        )}

        <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-[#A39A90]">
          Updated{" "}
          {formatDate(
            table.updatedAt
          )}
        </p>
      </div>

      {/* ==================================================
          ACTIVE ORDER
      ================================================== */}

      {table.activeOrder && (
        <div className="bg-[#FFF7E8] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A6700]">
            Current Order
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              {
                table
                  .activeOrder
                  .orderNumber
              }
            </span>

            <span className="text-sm font-semibold">
              {formatPrice(
                table
                  .activeOrder
                  .total
              )}
            </span>
          </div>

          <p className="mt-1 text-xs capitalize text-[#6B6258]">
            {
              table
                .activeOrder
                .customer
            }{" "}
            ·{" "}
            {
              table
                .activeOrder
                .status
            }
          </p>

          <p className="mt-1 text-[10px] text-[#9A8C78]">
            Started{" "}
            {formatDate(
              table
                .activeOrder
                .createdAt
            )}
          </p>
        </div>
      )}

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="grid grid-cols-3 gap-2 p-4">
        {/* EDIT */}

        <button
          type="button"
          onClick={() =>
            onEdit(table)
          }
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DED6C9] px-3 py-2.5 text-xs font-medium transition hover:bg-[#F5F0E8]"
        >
          <Edit3
            size={14}
          />

          Edit
        </button>

        {/* ENABLE / DISABLE */}

        <button
          type="button"
          onClick={() =>
            onToggle(table)
          }
          disabled={
            isOccupied &&
            table.isActive
          }
          className="rounded-xl border border-[#DED6C9] px-3 py-2.5 text-xs font-medium transition hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:opacity-40"
          title={
            isOccupied
              ? "Cannot disable a table with an active order"
              : ""
          }
        >
          {table.isActive
            ? "Disable"
            : "Enable"}
        </button>

        {/* DELETE */}

        <button
          type="button"
          onClick={() =>
            onDelete(table)
          }
          disabled={
            deleting ||
            isOccupied
          }
          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          title={
            isOccupied
              ? "Cannot delete a table with an active order"
              : ""
          }
        >
          {deleting ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <Trash2
              size={14}
            />
          )}

          Delete
        </button>
      </div>
    </div>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  required,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#6B6258]">
        {label}

        {required && (
          <span className="ml-1 text-[#B83A2E]">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

// ============================================================
// MODAL
// ============================================================

function Modal({
  children,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      {/* CONTENT */}

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] shadow-2xl">
        {children}
      </div>
    </div>
  );
}