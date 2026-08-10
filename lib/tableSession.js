const TABLE_SESSION_KEY = "ramen-table-session";

const TABLE_SESSION_DURATION =
  6 * 60 * 60 * 1000; // 6 hours

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

    if (
      !session.tableId ||
      !session.expiresAt
    ) {
      clearTableSession();
      return null;
    }

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

  sessionStorage.setItem(
    "ramen-table-id",
    normalizedTableId
  );

  window.dispatchEvent(
    new Event("table-session-updated")
  );

  return session;
}

export function getTableId() {
  const session = getTableSession();

  return session?.tableId || null;
}

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

export function hasActiveTable() {
  return Boolean(getTableId());
}