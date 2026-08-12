"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { categories, products } from "@/data/products";
import MenuCard from "@/components/MenuCard";
import ProductCustomization from "@/components/ProductCustomization";

import {
  getTableSession,
  setTableSession,
} from "@/lib/tableSession";

import {
  getCart,
  saveCart,
  clearCart
} from "@/lib/cart";
import Image from "next/image";

export default function MenuPage() {
  // =====================================================
  // STATE
  // =====================================================

  const [activeCategory, setActiveCategory] =
    useState("all");

  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [cartCount, setCartCount] = useState(0);

  const [tableId, setTableId] = useState(null);

  const [isDesktop, setIsDesktop] = useState(false);

  const [toast, setToast] = useState(null);

  // =====================================================
  // INITIALIZATION
  // =====================================================

  useEffect(() => {
    initializePage();

    window.addEventListener(
      "resize",
      handleResize
    );

    window.addEventListener(
      "cart-updated",
      updateCartCount
    );

    window.addEventListener(
      "storage",
      updateCartCount
    );

    window.addEventListener(
      "table-session-updated",
      handleTableSessionUpdate
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      window.removeEventListener(
        "cart-updated",
        updateCartCount
      );

      window.removeEventListener(
        "storage",
        updateCartCount
      );

      window.removeEventListener(
        "cart-updated",
        updateCartCount
      );

      window.removeEventListener(
        "table-session-updated",
        handleTableSessionUpdate
      );
    };
  }, []);

  // =====================================================
  // INITIAL PAGE SETUP
  // =====================================================

  function initializePage() {
    handleResize();

    initializeTable();

    updateCartCount();
  }

  // =====================================================
  // TABLE HANDLING
  // =====================================================

  function initializeTable() {
  const params = new URLSearchParams(
    window.location.search
  );

  const qrTableId = params
    .get("table")
    ?.trim()
    .toUpperCase();

  // No table in URL
  if (!qrTableId) {
    const existingSession =
      getTableSession();

    if (existingSession) {
      setTableId(
        existingSession.tableId
      );
    }

    return;
  }

  // We have a QR table
  handleQrTable(qrTableId);
}

  // =====================================================
  // SWITCH TABLE
  // =====================================================

  function handleQrTable(newTableId) {
  if (!newTableId) {
    return;
  }

  const normalizedTableId =
    String(newTableId)
      .trim()
      .toUpperCase();

  const currentSession =
    getTableSession();

  const currentTableId =
    currentSession?.tableId || null;

  /*
   * Same table
   */
  if (
    currentTableId ===
    normalizedTableId
  ) {
    setTableId(
      normalizedTableId
    );

    return;
  }

  /*
   * Get current cart
   */
  const currentCart = getCart();

  /*
   * No cart
   *
   * Simply move to new table.
   */
  if (currentCart.length === 0) {
    setTableSession(
      normalizedTableId
    );

    setTableId(
      normalizedTableId
    );

    return;
  }

  /*
   * Different table + existing cart
   *
   * ASK USER
   */

  const shouldMoveCart =
    window.confirm(
      `Your current cart belongs to Table ${
        currentTableId || "previous table"
      }.\n\nYou have ${
        currentCart.length
      } item${
        currentCart.length > 1
          ? "s"
          : ""
      } in your cart.\n\nDo you want to move your cart to Table ${normalizedTableId}?`
    );

  /*
   * YES
   *
   * Keep cart and change table
   */
  if (shouldMoveCart) {
    const updatedCart =
      currentCart.map(
        (item) => ({
          ...item,
          tableId:
            normalizedTableId,
        })
      );

    saveCart(updatedCart);

    setTableSession(
      normalizedTableId
    );

    setTableId(
      normalizedTableId
    );

    return;
  }

  /*
   * NO
   *
   * New table gets empty cart
   */
  clearCart();

  setTableSession(
    normalizedTableId
  );

  setTableId(
    normalizedTableId
  );
}

  // =====================================================
  // TABLE SESSION EVENT
  // =====================================================

  function handleTableSessionUpdate() {
    const session =
      getTableSession();

    if (session) {
      setTableId(session.tableId);
    } else {
      setTableId(null);
    }
  }

  // =====================================================
  // SCREEN SIZE
  // =====================================================

  function handleResize() {
    setIsDesktop(
      window.innerWidth >= 1024
    );
  }

  // =====================================================
  // CART COUNT
  // =====================================================

  function updateCartCount() {
    try {
      const cart = getCart();

      const count = cart.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      );

      setCartCount(count);
    } catch (error) {
      console.error(
        "Unable to update cart count:",
        error
      );

      setCartCount(0);
    }
  }

  // =====================================================
  // PRODUCT CUSTOMIZATION
  // =====================================================

  function handleCustomize(product) {
    setSelectedProduct(product);
  }

  function closeCustomization() {
    setSelectedProduct(null);
  }

  // =====================================================
  // SUCCESS TOAST
  // =====================================================

  function showAddedToast(
    product,
    total
  ) {
    setToast({
      product,
      total,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return products.filter(
      (product) => {
        const categoryMatch =
          activeCategory === "all" ||
          product.category ===
            activeCategory;

        const searchMatch =
          !searchValue ||
          product.name
            .toLowerCase()
            .includes(searchValue) ||
          product.description
            .toLowerCase()
            .includes(searchValue);

        return (
          categoryMatch &&
          searchMatch
        );
      }
    );
  }, [
    activeCategory,
    search,
  ]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8] pb-20 lg:pb-0">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-[#E5DED2] bg-[#F5F0E8]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-12">

          {/* Brand */}

          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full ">
                          <Image src="/logo.png" alt="Ramen Cafe Logo" width={50} height={50} />
                        </div>

            <div>
              <p className="text-[12px] font-semibold tracking-[0.15em] sm:text-[15px] sm:tracking-[0.16em]">
                RAMEN CAFE
              </p>

              <p className="text-[8px] tracking-[0.18em] text-[#6B6258] sm:text-[10px]">
                ラーメンカフェ
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}

          <nav className="hidden items-center gap-10 lg:flex">

            <Link
              href="/#story"
              className="text-sm transition hover:text-[#B83A2E]"
            >
              Our Story
            </Link>

            <Link
              href="/menu"
              className="relative py-7 text-sm font-medium text-[#B83A2E]"
            >
              Menu

              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B83A2E]" />
            </Link>

            <Link
              href="/#location"
              className="text-sm transition hover:text-[#B83A2E]"
            >
              Location
            </Link>

          </nav>

          {/* Cart */}

          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full border border-[#DED6C9] bg-[#FFFDF8] px-3 py-2 text-xs font-medium shadow-sm sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <ShoppingCart size={17} />

            <span className="hidden sm:inline">
              Cart
            </span>

            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B83A2E] px-1.5 text-[10px] font-bold text-white sm:h-6 sm:min-w-6 sm:text-[11px]">
                {cartCount}
              </span>
            )}
          </Link>

        </div>
      </header>

      {/* =================================================
          TABLE INDICATOR
      ================================================= */}

      {tableId && (
        <div className="mx-auto max-w-[1440px] px-4 pt-3 sm:px-8 lg:px-12">

          <div className="inline-flex items-center gap-2 rounded-full bg-[#171513] px-3 py-1.5 text-[11px] font-medium text-white sm:px-4 sm:py-2 sm:text-xs">

            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

            Table {tableId}

          </div>

        </div>
      )}

      {/* =================================================
          HERO
      ================================================= */}

      <section className="mx-auto max-w-[1440px] px-4 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-12 lg:px-12 lg:pb-8 lg:pt-14">

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E] sm:text-xs">
          Our Menu
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <h1 className="max-w-3xl text-[36px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Choose your favorite
              <br className="hidden sm:block" />
              Japanese comfort food.
            </h1>

            <p className="mt-3 text-sm text-[#6B6258] sm:mt-4 sm:text-base">
              Fresh ingredients. Authentic flavors.
            </p>

          </div>

          {/* Search */}

          <div className="relative w-full lg:max-w-xs">

            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8177]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search menu..."
              className="w-full rounded-full border border-[#DED6C9] bg-[#FFFDF8] py-3 pl-11 pr-10 text-sm outline-none transition placeholder:text-[#8A8177] focus:border-[#171513]"
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#6B6258] hover:bg-[#F5F0E8]"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}

          </div>

        </div>
      </section>

      {/* =================================================
          CATEGORY FILTER
      ================================================= */}

      <section className="sticky top-[68px] z-30 border-y border-[#E5DED2] bg-[#F5F0E8]/95 backdrop-blur-xl sm:top-20">

        <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-8 sm:py-3 lg:px-12">

          {categories.map(
            (category) => {
              const active =
                activeCategory ===
                category.id;

              return (
                <button
                  key={category.id}
                  onClick={() =>
                    setActiveCategory(
                      category.id
                    )
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition sm:px-5 sm:py-2.5 sm:text-sm ${
                    active
                      ? "bg-[#171513] text-white"
                      : "bg-[#FFFDF8] text-[#6B6258] hover:text-[#171513]"
                  }`}
                >
                  {category.name}
                </button>
              );
            }
          )}

          <button
            type="button"
            className="ml-auto hidden shrink-0 rounded-full border border-[#DED6C9] bg-[#FFFDF8] p-3 lg:flex"
            aria-label="Filter menu"
          >
            <SlidersHorizontal
              size={16}
            />
          </button>

        </div>
      </section>

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">

        {filteredProducts.length ===
        0 ? (

          <div className="rounded-3xl bg-[#FFFDF8] px-5 py-20 text-center">

            <p className="text-4xl">
              🍜
            </p>

            <h2 className="mt-4 text-xl font-semibold">
              Nothing found
            </h2>

            <p className="mt-2 text-sm text-[#6B6258]">
              Try another dish or category.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setActiveCategory(
                  "all"
                );
              }}
              className="mt-6 rounded-full bg-[#171513] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#B83A2E]"
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">

            {filteredProducts.map(
              (product) => (
                <MenuCard
                  key={product.id}
                  product={product}
                  onCustomize={
                    handleCustomize
                  }
                  isSelected={
                    selectedProduct?.id ===
                    product.id
                  }
                />
              )
            )}

          </div>

        )}

      </section>

      {/* =================================================
          CUSTOMIZATION
      ================================================= */}

      {selectedProduct && (
        <ProductCustomization
          product={selectedProduct}
          mode={
            isDesktop
              ? "desktop"
              : "mobile"
          }
          onClose={
            closeCustomization
          }
          onAdded={({
            product,
            total,
          }) => {

            updateCartCount();

            closeCustomization();

            showAddedToast(
              product,
              total
            );

          }}
        />
      )}

      {/* =================================================
          MOBILE BOTTOM NAVIGATION
      ================================================= */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DED6C9] bg-[#FFFDF8]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          <Link
            href="/"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >
            <span className="text-lg leading-none">
              ⌂
            </span>

            <span className="text-[10px]">
              Home
            </span>
          </Link>

          <Link
            href="/menu"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#B83A2E]"
          >
            <span className="text-lg leading-none">
              ▣
            </span>

            <span className="text-[10px] font-medium">
              Menu
            </span>
          </Link>

          <Link
            href="/cart"
            className="relative flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >

            <div className="relative">

              <ShoppingCart
                size={18}
              />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B83A2E] px-1 text-[8px] font-bold text-white">
                  {cartCount}
                </span>
              )}

            </div>

            <span className="text-[10px]">
              Cart
            </span>

          </Link>

          <Link
            href="/account"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >
            <span className="text-lg leading-none">
              ♙
            </span>

            <span className="text-[10px]">
              Account
            </span>
          </Link>

        </div>
      </nav>

      {/* =================================================
          ADD TO CART SUCCESS
      ================================================= */}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[100] w-[calc(100%-24px)] max-w-sm -translate-x-1/2 sm:bottom-6">

          <div className="flex items-center gap-3 rounded-2xl bg-[#171513] p-3.5 text-white shadow-2xl sm:p-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-lg font-bold">
              ✓
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold">
                Added to cart
              </p>

              <p className="mt-0.5 truncate text-xs text-white/60">
                {toast.product} · ₹
                {toast.total}
              </p>

            </div>

            <Link
              href="/cart"
              className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#171513] transition hover:bg-[#F5F0E8]"
            >
              View Cart
            </Link>

          </div>

        </div>
      )}

    </main>
  );
}