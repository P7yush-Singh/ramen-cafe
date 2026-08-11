const TABLE_SESSION_KEY = "ramen-table-session";

const TABLE_SESSION_DURATION =
  6 * 60 * 60 * 1000; // 6 hours

// =====================================================
// GET TABLE SESSION
// =====================================================

export function getTableSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(
      TABLE_SESSION_KEY
    );

    if (!stored) {
      return null;
    }

    const session = JSON.parse(stored);

    // Invalid session
    if (
      !session.tableId ||
      !session.expiresAt
    ) {
      clearTableSession();
      return null;
    }

    // Session expired
    if (
      Date.now() >= Number(session.expiresAt)
    ) {
      clearTableSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error(
      "Unable to read table session:",
      error
    );

    clearTableSession();

    return null;
  }
}

// =====================================================
// SET TABLE SESSION
// =====================================================

export function setTableSession(tableId) {
  if (typeof window === "undefined") {
    return null;
  }

  const normalizedTableId = String(tableId)
    .trim()
    .toUpperCase();

  if (!normalizedTableId) {
    return null;
  }

  const now = Date.now();

  const session = {
    tableId: normalizedTableId,
    startedAt: now,
    expiresAt:
      now + TABLE_SESSION_DURATION,
  };

  localStorage.setItem(
    TABLE_SESSION_KEY,
    JSON.stringify(session)
  );

  // Backward compatibility
  sessionStorage.setItem(
    "ramen-table-id",
    normalizedTableId
  );

  // Notify application
  window.dispatchEvent(
    new Event("table-session-updated")
  );

  return session;
}

// =====================================================
// GET TABLE ID
// =====================================================

export function getTableId() {
  const session = getTableSession();

  return session?.tableId || null;
}

// =====================================================
// GET MENU URL
//
// Keeps the active table when navigating
// back to the menu.
//
// Example:
// T03 → /menu?table=T03
// No table → /menu
// =====================================================

export function getMenuUrl() {
  const tableId = getTableId();

  if (!tableId) {
    return "/menu";
  }

  return `/menu?table=${encodeURIComponent(
    tableId
  )}`;
}

// =====================================================
// CLEAR TABLE SESSION
// =====================================================

export function clearTableSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    TABLE_SESSION_KEY
  );

  sessionStorage.removeItem(
    "ramen-table-id"
  );

  window.dispatchEvent(
    new Event("table-session-updated")
  );
}

// =====================================================
// CHECK ACTIVE TABLE
// =====================================================

export function hasActiveTable() {
  return Boolean(getTableId());
}