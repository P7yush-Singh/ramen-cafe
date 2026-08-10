"use client";

import { useEffect, useMemo, useState } from "react";
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
  clearCart
} from "@/lib/cart";

const ADDONS = [
  {
    id: "extra-egg",
    name: "Extra Egg",
    price: 40,
  },
  {
    id: "extra-chashu",
    name: "Extra Chashu",
    price: 80,
  },
  {
    id: "extra-noodles",
    name: "Extra Noodles",
    price: 50,
  },
  {
    id: "sweet-corn",
    name: "Sweet Corn",
    price: 30,
  },
];

export default function ProductCustomization({
  product,
  onClose,
  onAdded,
  mode = "desktop",
}) {
  const [noodle, setNoodle] = useState("Regular");
  const [spice, setSpice] = useState("Medium");
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const isRamen = product.category === "ramen";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const addonTotal = useMemo(() => {
    return selectedAddons.reduce((total, addonId) => {
      const addon = ADDONS.find(
        (item) => item.id === addonId
      );

      return total + (addon?.price || 0);
    }, 0);
  }, [selectedAddons]);

  const unitPrice = product.price + addonTotal;

  const total = unitPrice * quantity;

  function toggleAddon(id) {
    setSelectedAddons((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

 function addToCart() {
  const tableId = getTableId();

  const currentCart = getCart();

  const selectedAddonObjects =
    ADDONS.filter((addon) =>
      selectedAddons.includes(addon.id)
    );

  const cartItem = {
    cartItemId: `${product.id}-${Date.now()}`,

    productId: product.id,

    name: product.name,

    image: product.image,

    basePrice: product.price,

    quantity,

    noodle: isRamen
      ? noodle
      : null,

    spice: isRamen
      ? spice
      : null,

    addons: selectedAddonObjects,

    total,

    tableId,

    createdAt: Date.now(),
  };

  const updatedCart = [
    ...currentCart,
    cartItem,
  ];

  saveCart(updatedCart);

  window.dispatchEvent(
    new Event("cart-updated")
  );

  onAdded?.({
    product: product.name,
    total,
    tableId,
  });
}

  const isDesktop = mode === "desktop";

  return (
    <>
      {/* Overlay */}
      <button
        aria-label="Close customization"
        onClick={onClose}
        className="fixed inset-0 z-[70] cursor-default bg-black/40 backdrop-blur-[2px]"
      />

      {/* Mobile / Tablet Bottom Sheet */}
      {!isDesktop && (
        <div className="fixed inset-x-0 bottom-0 z-[80] max-h-[88vh] overflow-hidden rounded-t-[28px] bg-[#FFFDF8] shadow-2xl lg:hidden">
          <CustomizationContent
            product={product}
            isRamen={isRamen}
            noodle={noodle}
            setNoodle={setNoodle}
            spice={spice}
            setSpice={setSpice}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedAddons={selectedAddons}
            toggleAddon={toggleAddon}
            total={total}
            addonTotal={addonTotal}
            onClose={onClose}
            onAdd={addToCart}
            mobile
          />
        </div>
      )}

      {/* Desktop Drawer */}
      {isDesktop && (
        <aside className="fixed bottom-0 right-0 top-20 z-[80] hidden w-[400px] border-l border-[#E5DED2] bg-[#FFFDF8] shadow-2xl lg:block xl:w-[430px]">
          <CustomizationContent
            product={product}
            isRamen={isRamen}
            noodle={noodle}
            setNoodle={setNoodle}
            spice={spice}
            setSpice={setSpice}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedAddons={selectedAddons}
            toggleAddon={toggleAddon}
            total={total}
            addonTotal={addonTotal}
            onClose={onClose}
            onAdd={addToCart}
          />
        </aside>
      )}
    </>
  );
}

function CustomizationContent({
  product,
  isRamen,
  noodle,
  setNoodle,
  spice,
  setSpice,
  quantity,
  setQuantity,
  selectedAddons,
  toggleAddon,
  total,
  addonTotal,
  onClose,
  onAdd,
  mobile,
}) {
  return (
    <div className="flex h-full max-h-[88vh] flex-col">
      {/* Header */}
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

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {/* Product */}
        <div className="flex items-center gap-4">
          <img
            src={product.image}
            alt={product.name}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24"
          />

          <div className="min-w-0">
            <h3 className="text-lg font-semibold">
              {product.name}
            </h3>

            <p className="mt-1 font-medium">
              ₹{product.price}
            </p>

            <div className="mt-2">
              {product.isVeg ? (
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

        {/* Noodles */}
        {isRamen && (
          <div className="mt-6 border-t border-[#E5DED2] pt-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Choose your noodles
              </h3>

              <span className="text-xs text-[#8A8177]">
                Required
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Regular", "Thin", "Thick"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setNoodle(item)}
                    className={`rounded-xl border px-2 py-3 text-sm transition ${
                      noodle === item
                        ? "border-[#171513] bg-[#171513] text-white"
                        : "border-[#DED6C9] bg-[#FFFDF8]"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Spice */}
        {isRamen && (
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
              {["Mild", "Medium", "Hot"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setSpice(item)}
                    className={`rounded-xl border px-2 py-3 text-sm transition ${
                      spice === item
                        ? "border-[#171513] bg-[#171513] text-white"
                        : "border-[#DED6C9] bg-[#FFFDF8]"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Addons */}
        <div className="mt-6 border-t border-[#E5DED2] pt-5">
          <h3 className="font-semibold">
            Make it yours{" "}
            <span className="font-normal text-[#8A8177]">
              (Add-ons)
            </span>
          </h3>

          <div className="mt-3 space-y-2">
            {ADDONS.map((addon) => {
              const selected =
                selectedAddons.includes(addon.id);

              return (
                <button
                  key={addon.id}
                  onClick={() =>
                    toggleAddon(addon.id)
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
                        <Check size={13} />
                      )}
                    </span>

                    <span className="text-sm">
                      {addon.name}
                    </span>
                  </div>

                  <span className="text-sm text-[#6B6258]">
                    +₹{addon.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity */}
        <div className="mt-6 flex items-center justify-between border-t border-[#E5DED2] pt-5">
          <h3 className="font-semibold">
            Quantity
          </h3>

          <div className="flex items-center rounded-xl border border-[#DED6C9]">
            <button
              onClick={() =>
                setQuantity((value) =>
                  Math.max(1, value - 1)
                )
              }
              className="flex h-10 w-10 items-center justify-center"
            >
              <Minus size={15} />
            </button>

            <span className="w-8 text-center text-sm font-semibold">
              {quantity}
            </span>

            <button
              onClick={() =>
                setQuantity((value) => value + 1)
              }
              className="flex h-10 w-10 items-center justify-center"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="mt-5 rounded-2xl bg-[#F5F0E8] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                Total
              </p>

              <p className="mt-1 text-xs text-[#6B6258]">
                Base ₹{product.price}

                {addonTotal > 0 &&
                  ` + Add-ons ₹${addonTotal}`}
              </p>
            </div>

            <p className="text-2xl font-semibold">
              ₹{total}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="shrink-0 border-t border-[#E5DED2] bg-[#FFFDF8] p-4 sm:p-5">
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B83A2E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#171513]"
        >
          <ShoppingCart size={18} />

          Add to Cart

          <span className="opacity-60">|</span>

          ₹{total}
        </button>
      </div>
    </div>
  );
}