const CART_KEY = "ramen-cart";
const CART_CREATED_KEY =
  "ramen-cart-created";

const CART_EXPIRY =
  6 * 60 * 60 * 1000;

export function getCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const createdAt =
      localStorage.getItem(
        CART_CREATED_KEY
      );

    if (createdAt) {
      const expired =
        Date.now() -
          Number(createdAt) >
        CART_EXPIRY;

      if (expired) {
        clearCart();
        return [];
      }
    }

    return JSON.parse(
      localStorage.getItem(
        CART_KEY
      ) || "[]"
    );
  } catch (error) {
    console.error(
      "Unable to read cart:",
      error
    );

    return [];
  }
}

export function saveCart(cart) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

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

export function clearCart() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    CART_KEY
  );

  localStorage.removeItem(
    CART_CREATED_KEY
  );

  window.dispatchEvent(
    new Event("cart-updated")
  );
}