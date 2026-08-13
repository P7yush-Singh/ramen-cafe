"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  RefreshCw,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/products",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load products."
        );
      }

      setProducts(
        data.products || []
      );
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function toggleAvailability(
    product
  ) {
    try {
      const response =
        await fetch(
          `/api/admin/products/${product._id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              isAvailable:
                !product.isAvailable,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update product."
        );
      }

      setProducts((current) =>
        current.map((item) =>
          item._id === product._id
            ? data.product
            : item
        )
      );
    } catch (error) {
      alert(
        error.message ||
          "Failed to update product."
      );
    }
  }

  async function deleteProduct(
    product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );

    if (!confirmed) return;

    try {
      const response =
        await fetch(
          `/api/admin/products/${product._id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete product."
        );
      }

      setProducts((current) =>
        current.filter(
          (item) =>
            item._id !== product._id
        )
      );
    } catch (error) {
      alert(
        error.message ||
          "Failed to delete product."
      );
    }
  }

  const filteredProducts =
    products.filter((product) => {
      const value =
        search.toLowerCase();

      return (
        product.name
          ?.toLowerCase()
          .includes(value) ||
        product.category
          ?.toLowerCase()
          .includes(value)
      );
    });

  return (
    <main className="min-h-screen bg-[#F5F0E8] p-6 md:p-8">
      <div className="mx-auto max-w-[1400px]">

        {/* HEADER */}

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
              Menu Management
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
              Products
            </h1>

            <p className="mt-2 text-sm text-[#6B6258]">
              Manage your Ramen Cafe menu.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#171513] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#B83A2E]"
          >
            <Plus size={17} />

            Add Product
          </Link>
        </div>

        {/* TOOLBAR */}

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-4 md:flex-row">

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8177]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search products..."
              className="w-full rounded-xl border border-[#DED6C9] bg-[#F5F0E8] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#B83A2E]"
            />
          </div>

          <button
            onClick={loadProducts}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DED6C9] px-4 py-3 text-sm font-medium hover:bg-[#F5F0E8]"
          >
            <RefreshCw
              size={16}
            />

            Refresh
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="mt-6 rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-12 text-center">
            <RefreshCw
              size={24}
              className="mx-auto animate-spin"
            />

            <p className="mt-3 text-sm text-[#6B6258]">
              Loading products...
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredProducts.length ===
            0 && (
            <div className="mt-6 rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-14 text-center">

              <Package
                size={42}
                className="mx-auto text-[#8A8177]"
              />

              <h2 className="mt-5 text-xl font-semibold">
                No products found
              </h2>

              <p className="mt-2 text-sm text-[#6B6258]">
                Add your first menu item.
              </p>

            </div>
          )}

        {/* PRODUCT TABLE */}

        {!loading &&
          filteredProducts.length >
            0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5DED2] bg-[#FFFDF8]">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px]">

                  <thead className="border-b border-[#E5DED2] bg-[#F8F4EC]">

                    <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">

                      <th className="px-5 py-4">
                        Product
                      </th>

                      <th className="px-5 py-4">
                        Category
                      </th>

                      <th className="px-5 py-4">
                        Price
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Featured
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-[#E5DED2]">

                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={
                            product._id
                          }
                          className="hover:bg-[#FCF9F3]"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-4">

                              <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#F5F0E8]">

                                {product.image ? (
                                  <img
                                    src={
                                      product.image
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xl">
                                    🍜
                                  </div>
                                )}

                              </div>

                              <div>
                                <p className="font-semibold">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-[#8A8177]">
                                  {
                                    product.slug
                                  }
                                </p>
                              </div>

                            </div>

                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4 text-sm text-[#6B6258]">
                            {
                              product.category
                            }
                          </td>

                          {/* PRICE */}

                          <td className="px-5 py-4 text-sm font-semibold">
                            ₹
                            {Number(
                              product.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <button
                              onClick={() =>
                                toggleAvailability(
                                  product
                                )
                              }
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                product.isAvailable
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >

                              {product.isAvailable ? (
                                <>
                                  <Eye
                                    size={13}
                                  />
                                  Available
                                </>
                              ) : (
                                <>
                                  <EyeOff
                                    size={13}
                                  />
                                  Unavailable
                                </>
                              )}

                            </button>

                          </td>

                          {/* FEATURED */}

                          <td className="px-5 py-4">

                            {product.isFeatured ? (
                              <Star
                                size={17}
                                className="fill-current text-[#B83A2E]"
                              />
                            ) : (
                              <span className="text-[#C8C0B5]">
                                —
                              </span>
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <Link
                                href={`/admin/products/${product._id}`}
                                className="rounded-lg border border-[#DED6C9] p-2.5 hover:bg-[#F5F0E8]"
                              >
                                <Pencil
                                  size={15}
                                />
                              </Link>

                              <button
                                onClick={() =>
                                  deleteProduct(
                                    product
                                  )
                                }
                                className="rounded-lg border border-red-100 p-2.5 text-red-600 hover:bg-red-50"
                              >
                                <Trash2
                                  size={15}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

      </div>
    </main>
  );
}