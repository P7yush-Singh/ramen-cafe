const CART_KEY = "ramen-cart";
const CART_CREATED_KEY = "ramen-cart-created";

const CART_EXPIRY =
  6 * 60 * 60 * 1000; // 6 hours

/**
 * Get cart
 */
export function getCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const createdAt = localStorage.getItem(
      CART_CREATED_KEY
    );

    if (createdAt) {
      const expired =
        Date.now() - Number(createdAt) >
        CART_EXPIRY;

      if (expired) {
        clearCart();
        return [];
      }
    }

    return JSON.parse(
      localStorage.getItem(CART_KEY) ||
        "[]"
    );
  } catch (error) {
    console.error(
      "Unable to read cart:",
      error
    );

    return [];
  }
}

/**
 * Save cart
 */
export function saveCart(cart) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

  // Start the 6-hour timer only
  // when the first cart item is added.
  if (
    cart.length > 0 &&
    !localStorage.getItem(
      CART_CREATED_KEY
    )
  ) {
    localStorage.setItem(
      CART_CREATED_KEY,
      Date.now().toString()
    );
  }

  if (cart.length === 0) {
    localStorage.removeItem(
      CART_CREATED_KEY
    );
  }

  window.dispatchEvent(
    new Event("cart-updated")
  );
}

/**
 * Clear cart
 */
export function clearCart() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(CART_KEY);

  localStorage.removeItem(
    CART_CREATED_KEY
  );

  window.dispatchEvent(
    new Event("cart-updated")
  );
}

/**
 * Get cart table ID
 */
export function getCartTableId() {
  const cart = getCart();

  if (!cart.length) {
    return null;
  }

  return cart[0]?.tableId || null;
}

/**
 * Check whether cart belongs to a table
 */
export function cartBelongsToTable(
  tableId
) {
  const cart = getCart();

  if (!cart.length) {
    return true;
  }

  return cart.every(
    (item) =>
      item.tableId === tableId
  );
}