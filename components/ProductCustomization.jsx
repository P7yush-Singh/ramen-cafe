"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Minus,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";

import { getTableId } from "@/lib/tableSession";

import {
  getCart,
  saveCart,
} from "@/lib/cart";

export default function ProductCustomization({
  product,
  onClose,
  onAdded,
  mode = "desktop",
}) {
  // ============================================================
  // PRODUCT DATA
  // ============================================================

  const productId =
    String(
      product?._id ||
        product?.id ||
        ""
    );

  const productPrice =
    Number(product?.price || 0);

  const addOns = useMemo(() => {
    return Array.isArray(
      product?.addOns
    )
      ? product.addOns.filter(
          (addon) =>
            addon &&
            addon.isAvailable !== false
        )
      : [];
  }, [product]);

  const noodles = useMemo(() => {
    return Array.isArray(
      product?.customization?.noodles
    )
      ? product.customization.noodles
      : [];
  }, [product]);

  const spiceLevels = useMemo(() => {
    return Array.isArray(
      product?.customization?.spiceLevels
    )
      ? product.customization.spiceLevels
      : [];
  }, [product]);

  // ============================================================
  // RAMEN DETECTION
  // ============================================================

  const isRamen =
    String(
      product?.category || ""
    )
      .trim()
      .toLowerCase() ===
    "ramen";

  // ============================================================
  // STATE
  // ============================================================

  const [noodle, setNoodle] =
    useState("");

  const [spice, setSpice] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [selectedAddons, setSelectedAddons] =
    useState([]);

  // ============================================================
  // INITIALIZE CUSTOMIZATION
  // ============================================================

  useEffect(() => {
    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, []);

  useEffect(() => {
    // ----------------------------------------------------------
    // Select first available noodle option
    // ----------------------------------------------------------

    if (
      isRamen &&
      noodles.length > 0
    ) {
      setNoodle(
        String(noodles[0])
      );
    } else {
      setNoodle("");
    }

    // ----------------------------------------------------------
    // Select first available spice option
    // ----------------------------------------------------------

    if (
      isRamen &&
      spiceLevels.length > 0
    ) {
      setSpice(
        String(spiceLevels[0])
      );
    } else {
      setSpice("");
    }

    // ----------------------------------------------------------
    // Reset quantity
    // ----------------------------------------------------------

    setQuantity(1);

    // ----------------------------------------------------------
    // Reset add-ons
    // ----------------------------------------------------------

    setSelectedAddons([]);
  }, [
    productId,
    isRamen,
    noodles,
    spiceLevels,
  ]);

  // ============================================================
  // SELECTED ADD-ON OBJECTS
  // ============================================================

  const selectedAddonObjects =
    useMemo(() => {
      return addOns.filter(
        (addon) =>
          selectedAddons.includes(
            String(
              addon._id ||
                addon.id ||
                ""
            )
          )
      );
    }, [
      addOns,
      selectedAddons,
    ]);

  // ============================================================
  // ADD-ON TOTAL
  // ============================================================

  const addonTotal =
    useMemo(() => {
      return selectedAddonObjects.reduce(
        (total, addon) =>
          total +
          Number(
            addon.price || 0
          ),
        0
      );
    }, [
      selectedAddonObjects,
    ]);

  // ============================================================
  // UNIT PRICE
  // ============================================================

  const unitPrice =
    productPrice +
    addonTotal;

  // ============================================================
  // TOTAL
  // ============================================================

  const total =
    unitPrice * quantity;

  // ============================================================
  // TOGGLE ADD-ON
  // ============================================================

  function toggleAddon(
    addonId
  ) {
    setSelectedAddons(
      (current) =>
        current.includes(
          addonId
        )
          ? current.filter(
              (id) =>
                id !== addonId
            )
          : [
              ...current,
              addonId,
            ]
    );
  }

  // ============================================================
  // ADD TO CART
  // ============================================================

  function addToCart() {
    const tableId =
      getTableId();

    if (!tableId) {
      alert(
        "Table information is missing. Please scan the table QR code again."
      );

      return;
    }

    if (!productId) {
      alert(
        "Invalid product."
      );

      return;
    }

    if (
      !Number.isFinite(
        productPrice
      ) ||
      productPrice < 0
    ) {
      alert(
        "Invalid product price."
      );

      return;
    }

    // ----------------------------------------------------------
    // CURRENT CART
    // ----------------------------------------------------------

    const currentCart =
      getCart();

    // ----------------------------------------------------------
    // IMPORTANT
    //
    // Store add-on IDs + names + prices for UI/cart display.
    //
    // The server will NOT trust these prices.
    // It will fetch the authoritative prices from MongoDB.
    // ----------------------------------------------------------

    const cartAddons =
      selectedAddonObjects.map(
        (addon) => ({
          _id:
            String(
              addon._id ||
                addon.id ||
                ""
            ),

          name:
            addon.name,

          price:
            Number(
              addon.price || 0
            ),
        })
      );

    // ----------------------------------------------------------
    // CART ITEM
    // ----------------------------------------------------------

    const cartItem = {
      cartItemId:
        `${productId}-${Date.now()}`,

      productId,

      name:
        product.name,

      image:
        product.image || "",

      // IMPORTANT:
      // API expects `price`.
      // Do not use only `basePrice`.
      price:
        productPrice,

      basePrice:
        productPrice,

      quantity,

      noodles:
        isRamen
          ? noodle
          : "",

      spice:
        isRamen
          ? spice
          : "",

      addons:
        cartAddons,

      total,

      tableId,

      createdAt:
        Date.now(),
    };

    // ----------------------------------------------------------
    // SAVE
    // ----------------------------------------------------------

    const updatedCart = [
      ...currentCart,
      cartItem,
    ];

    saveCart(
      updatedCart
    );

    // ----------------------------------------------------------
    // UPDATE UI
    // ----------------------------------------------------------

    window.dispatchEvent(
      new Event(
        "cart-updated"
      )
    );

    // ----------------------------------------------------------
    // CALLBACK
    // ----------------------------------------------------------

    onAdded?.({
      product:
        product.name,

      total,

      tableId,
    });
  }

  // ============================================================
  // DESKTOP / MOBILE
  // ============================================================

  const isDesktop =
    mode === "desktop";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ======================================================
          OVERLAY
      ====================================================== */}

      <button
        aria-label="Close customization"
        onClick={onClose}
        className="fixed inset-0 z-[70] cursor-default bg-black/40 backdrop-blur-[2px]"
      />

      {/* ======================================================
          MOBILE / TABLET
      ====================================================== */}

      {!isDesktop && (
        <div className="fixed inset-x-0 bottom-0 z-[80] max-h-[88vh] overflow-hidden rounded-t-[28px] bg-[#FFFDF8] shadow-2xl lg:hidden">
          <CustomizationContent
            product={product}
            isRamen={isRamen}
            noodles={noodles}
            spiceLevels={spiceLevels}
            noodle={noodle}
            setNoodle={setNoodle}
            spice={spice}
            setSpice={setSpice}
            quantity={quantity}
            setQuantity={setQuantity}
            addOns={addOns}
            selectedAddons={
              selectedAddons
            }
            toggleAddon={
              toggleAddon
            }
            total={total}
            addonTotal={
              addonTotal
            }
            onClose={onClose}
            onAdd={addToCart}
            mobile
          />
        </div>
      )}

      {/* ======================================================
          DESKTOP DRAWER
      ====================================================== */}

      {isDesktop && (
        <aside className="fixed bottom-0 right-0 top-20 z-[80] hidden w-[400px] border-l border-[#E5DED2] bg-[#FFFDF8] shadow-2xl lg:block xl:w-[430px]">
          <CustomizationContent
            product={product}
            isRamen={isRamen}
            noodles={noodles}
            spiceLevels={spiceLevels}
            noodle={noodle}
            setNoodle={setNoodle}
            spice={spice}
            setSpice={setSpice}
            quantity={quantity}
            setQuantity={setQuantity}
            addOns={addOns}
            selectedAddons={
              selectedAddons
            }
            toggleAddon={
              toggleAddon
            }
            total={total}
            addonTotal={
              addonTotal
            }
            onClose={onClose}
            onAdd={addToCart}
          />
        </aside>
      )}
    </>
  );
}

// ============================================================
// CUSTOMIZATION CONTENT
// ============================================================

function CustomizationContent({
  product,
  isRamen,

  noodles,
  spiceLevels,

  noodle,
  setNoodle,

  spice,
  setSpice,

  quantity,
  setQuantity,

  addOns,

  selectedAddons,
  toggleAddon,

  total,
  addonTotal,

  onClose,
  onAdd,

  mobile,
}) {
  const isVeg =
    product?.foodType ===
      "veg" ||
    product?.isVeg === true;

  return (
    <div className="flex h-full max-h-[88vh] flex-col">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex shrink-0 items-center justify-between border-b border-[#E5DED2] px-5 py-4 sm:px-6 sm:py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#B83A2E]">
            Customize
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            Your item
          </h2>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DED6C9] hover:bg-[#F5F0E8]"
        >
          <X size={18} />
        </button>
      </div>

      {/* ====================================================
          SCROLLABLE CONTENT
      ==================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {/* ==================================================
            PRODUCT
        ================================================== */}

        <div className="flex items-center gap-4">
          <img
            src={
              product.image
            }
            alt={
              product.name
            }
            className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24"
          />

          <div className="min-w-0">
            <h3 className="text-lg font-semibold">
              {
                product.name
              }
            </h3>

            <p className="mt-1 font-medium">
              ₹
              {
                product.price
              }
            </p>

            <div className="mt-2">
              {isVeg ? (
                <span className="text-xs font-medium text-green-700">
                  🟢 Veg
                </span>
              ) : (
                <span className="text-xs font-medium text-[#B83A2E]">
                  🔴 Non-Veg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            NOODLES
        ================================================== */}

        {isRamen &&
          noodles.length >
            0 && (
            <div className="mt-6 border-t border-[#E5DED2] pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Choose your
                  noodles
                </h3>

                <span className="text-xs text-[#8A8177]">
                  Required
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {noodles.map(
                  (item) => (
                    <button
                      key={
                        String(
                          item
                        )
                      }
                      onClick={() =>
                        setNoodle(
                          String(
                            item
                          )
                        )
                      }
                      className={`rounded-xl border px-2 py-3 text-sm transition ${
                        noodle ===
                        String(
                          item
                        )
                          ? "border-[#171513] bg-[#171513] text-white"
                          : "border-[#DED6C9] bg-[#FFFDF8]"
                      }`}
                    >
                      {
                        item
                      }
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        {/* ==================================================
            SPICE
        ================================================== */}

        {isRamen &&
          spiceLevels.length >
            0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Spice level
                </h3>

                <span className="text-xs text-[#8A8177]">
                  Required
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {spiceLevels.map(
                  (item) => (
                    <button
                      key={
                        String(
                          item
                        )
                      }
                      onClick={() =>
                        setSpice(
                          String(
                            item
                          )
                        )
                      }
                      className={`rounded-xl border px-2 py-3 text-sm transition ${
                        spice ===
                        String(
                          item
                        )
                          ? "border-[#171513] bg-[#171513] text-white"
                          : "border-[#DED6C9] bg-[#FFFDF8]"
                      }`}
                    >
                      {
                        item
                      }
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        {/* ==================================================
            ADD-ONS
        ================================================== */}

        {addOns.length >
          0 && (
          <div className="mt-6 border-t border-[#E5DED2] pt-5">
            <h3 className="font-semibold">
              Make it yours{" "}
              <span className="font-normal text-[#8A8177]">
                (Add-ons)
              </span>
            </h3>

            <div className="mt-3 space-y-2">
              {addOns.map(
                (addon) => {
                  const addonId =
                    String(
                      addon._id ||
                        addon.id ||
                        ""
                    );

                  const selected =
                    selectedAddons.includes(
                      addonId
                    );

                  return (
                    <button
                      key={
                        addonId
                      }
                      onClick={() =>
                        toggleAddon(
                          addonId
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3.5 text-left ${
                        selected
                          ? "border-[#B83A2E]/40 bg-[#B83A2E]/5"
                          : "border-[#DED6C9]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            selected
                              ? "border-[#B83A2E] bg-[#B83A2E] text-white"
                              : "border-[#BDB4A8]"
                          }`}
                        >
                          {selected && (
                            <Check
                              size={
                                13
                              }
                            />
                          )}
                        </span>

                        <span className="text-sm">
                          {
                            addon.name
                          }
                        </span>
                      </div>

                      <span className="text-sm text-[#6B6258]">
                        +₹
                        {
                          addon.price
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            QUANTITY
        ================================================== */}

        <div className="mt-6 flex items-center justify-between border-t border-[#E5DED2] pt-5">
          <h3 className="font-semibold">
            Quantity
          </h3>

          <div className="flex items-center rounded-xl border border-[#DED6C9]">
            <button
              onClick={() =>
                setQuantity(
                  (value) =>
                    Math.max(
                      1,
                      value - 1
                    )
                )
              }
              className="flex h-10 w-10 items-center justify-center"
            >
              <Minus size={15} />
            </button>

            <span className="w-8 text-center text-sm font-semibold">
              {
                quantity
              }
            </span>

            <button
              onClick={() =>
                setQuantity(
                  (value) =>
                    Math.min(
                      99,
                      value + 1
                    )
                )
              }
              className="flex h-10 w-10 items-center justify-center"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* ==================================================
            TOTAL
        ================================================== */}

        <div className="mt-5 rounded-2xl bg-[#F5F0E8] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                Total
              </p>

              <p className="mt-1 text-xs text-[#6B6258]">
                Base ₹
                {
                  product.price
                }

                {addonTotal >
                  0 &&
                  ` + Add-ons ₹${addonTotal}`}
              </p>
            </div>

            <p className="text-2xl font-semibold">
              ₹{total}
            </p>
          </div>
        </div>
      </div>

      {/* ====================================================
          BOTTOM ACTION
      ==================================================== */}

      <div className="shrink-0 border-t border-[#E5DED2] bg-[#FFFDF8] p-4 sm:p-5">
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B83A2E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#171513]"
        >
          <ShoppingCart
            size={18}
          />

          Add to Cart

          <span className="opacity-60">
            |
          </span>

          ₹{total}
        </button>
      </div>
    </div>
  );
}