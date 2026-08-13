"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-2xl border border-[#DED6C9] bg-white px-4 py-3 text-sm text-[#171513] outline-none transition focus:border-[#B83A2E] focus:ring-2 focus:ring-[#B83A2E]/10";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6258]";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  image: "",
  foodType: "veg",

  isAvailable: true,
  isPopular: false,
  isFeatured: false,

  addOns: [],

  customization: {
    noodles: [],
    spiceLevels: [],
  },

  sortOrder: 0,

  metaTitle: "",
  metaDescription: "",
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params?.id;

  const [form, setForm] =
    useState(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // LOAD PRODUCT
  // ==========================================================

  useEffect(() => {
    if (!productId) return;

    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/products/${productId}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load product."
        );
      }

      const product =
        data.product;

      setForm({
        name: product.name || "",
        description:
          product.description || "",
        category:
          product.category || "",

        price:
          product.price ?? "",

        image:
          product.image || "",

        foodType:
          product.foodType || "veg",

        isAvailable:
          product.isAvailable !== false,

        isPopular:
          product.isPopular === true,

        isFeatured:
          product.isFeatured === true,

        addOns:
          Array.isArray(
            product.addOns
          )
            ? product.addOns
            : [],

        customization: {
          noodles:
            Array.isArray(
              product.customization
                ?.noodles
            )
              ? product.customization
                  .noodles
              : [],

          spiceLevels:
            Array.isArray(
              product.customization
                ?.spiceLevels
            )
              ? product.customization
                  .spiceLevels
              : [],
        },

        sortOrder:
          product.sortOrder ?? 0,

        metaTitle:
          product.metaTitle || "",

        metaDescription:
          product.metaDescription ||
          "",
      });
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load product."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // BASIC INPUT
  // ==========================================================

  function updateField(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateCustomization(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,

      customization: {
        ...current.customization,
        [field]: value,
      },
    }));
  }

  // ==========================================================
  // IMAGE UPLOAD
  // ==========================================================

  async function handleImageUpload(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const uploadForm =
        new FormData();

      uploadForm.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/admin/upload",
          {
            method: "POST",
            body: uploadForm,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Image upload failed."
        );
      }

      updateField(
        "image",
        data.image.url
      );

      setSuccess(
        "Image uploaded successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to upload image."
      );
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  }

  // ==========================================================
  // ADD-ONS
  // ==========================================================

  function addAddOn() {
    setForm((current) => ({
      ...current,

      addOns: [
        ...current.addOns,

        {
          name: "",
          price: 0,
          isAvailable: true,
        },
      ],
    }));
  }

  function updateAddOn(
    index,
    field,
    value
  ) {
    setForm((current) => ({
      ...current,

      addOns: current.addOns.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]:
                  field ===
                  "price"
                    ? Number(
                        value
                      )
                    : value,
              }
            : item
      ),
    }));
  }

  function removeAddOn(index) {
    setForm((current) => ({
      ...current,

      addOns:
        current.addOns.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  }

  // ==========================================================
  // ARRAY OPTIONS
  // ==========================================================

  function addOption(field) {
    setForm((current) => ({
      ...current,

      customization: {
        ...current.customization,

        [field]: [
          ...current.customization[
            field
          ],
          "",
        ],
      },
    }));
  }

  function updateOption(
    field,
    index,
    value
  ) {
    setForm((current) => ({
      ...current,

      customization: {
        ...current.customization,

        [field]:
          current.customization[
            field
          ].map(
            (item, itemIndex) =>
              itemIndex === index
                ? value
                : item
          ),
      },
    }));
  }

  function removeOption(
    field,
    index
  ) {
    setForm((current) => ({
      ...current,

      customization: {
        ...current.customization,

        [field]:
          current.customization[
            field
          ].filter(
            (_, itemIndex) =>
              itemIndex !== index
          ),
      },
    }));
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        throw new Error(
          "Product name is required."
        );
      }

      if (!form.category.trim()) {
        throw new Error(
          "Category is required."
        );
      }

      const price =
        Number(form.price);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error(
          "Enter a valid price."
        );
      }

      const payload = {
        name:
          form.name.trim(),

        description:
          form.description.trim(),

        category:
          form.category.trim(),

        price,

        image:
          form.image.trim(),

        foodType:
          form.foodType,

        isAvailable:
          form.isAvailable,

        isPopular:
          form.isPopular,

        isFeatured:
          form.isFeatured,

        addOns:
          form.addOns
            .filter(
              (item) =>
                item.name?.trim()
            )
            .map((item) => ({
              name:
                item.name.trim(),

              price:
                Number(
                  item.price
                ) || 0,

              isAvailable:
                item.isAvailable !==
                false,
            })),

        customization: {
          noodles:
            form.customization.noodles
              .map((item) =>
                item.trim()
              )
              .filter(Boolean),

          spiceLevels:
            form.customization.spiceLevels
              .map((item) =>
                item.trim()
              )
              .filter(Boolean),
        },

        sortOrder:
          Number(
            form.sortOrder
          ) || 0,

        metaTitle:
          form.metaTitle.trim(),

        metaDescription:
          form.metaDescription.trim(),
      };

      const response =
        await fetch(
          `/api/admin/products/${productId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update product."
        );
      }

      setSuccess(
        "Product updated successfully."
      );

      setTimeout(() => {
        router.push(
          "/admin/products"
        );
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="h-8 w-48 animate-pulse rounded bg-white" />

          <div className="mt-8 space-y-4">
            <div className="h-24 animate-pulse rounded-3xl bg-white" />
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !form.name) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-xl font-semibold text-red-800">
              Unable to load product
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <Link
              href="/admin/products"
              className="mt-6 inline-flex rounded-xl bg-[#171513] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="border-b border-[#E5DED2] bg-[#F5F0E8]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
              Ramen Cafe
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
              Edit Product
            </h1>
          </div>

          <Link
            href="/admin/products"
            className="rounded-xl border border-[#DED6C9] bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-[#FFFDF8]"
          >
            ← Products
          </Link>
        </div>
      </header>

      {/* ======================================================
          FORM
      ======================================================= */}

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12"
      >
        {/* ALERTS */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* ==================================================
              LEFT
          =================================================== */}

          <div className="space-y-6">
            {/* BASIC INFORMATION */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Basic Information
                </h2>

                <p className="mt-1 text-sm text-[#6B6258]">
                  Product details customers will see.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Product Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateField(
                        "name",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    placeholder="Tokyo Ramen"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Description
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }
                    rows={5}
                    className={inputClass}
                    placeholder="Describe the ramen..."
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Category
                    </label>

                    <input
                      value={
                        form.category
                      }
                      onChange={(e) =>
                        updateField(
                          "category",
                          e.target.value
                        )
                      }
                      className={inputClass}
                      placeholder="Ramen"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Price (₹)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        form.price
                      }
                      onChange={(e) =>
                        updateField(
                          "price",
                          e.target.value
                        )
                      }
                      className={inputClass}
                      placeholder="249"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Food Type
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value:
                          "veg",
                        label:
                          "Vegetarian",
                      },
                      {
                        value:
                          "non-veg",
                        label:
                          "Non-Vegetarian",
                      },
                    ].map(
                      (option) => (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            updateField(
                              "foodType",
                              option.value
                            )
                          }
                          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                            form.foodType ===
                            option.value
                              ? "border-[#B83A2E] bg-[#B83A2E] text-white"
                              : "border-[#DED6C9] bg-white text-[#6B6258]"
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* CUSTOMIZATION */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Customization
                </h2>

                <p className="mt-1 text-sm text-[#6B6258]">
                  Options customers can select while ordering.
                </p>
              </div>

              <OptionEditor
                title="Noodles"
                values={
                  form.customization
                    .noodles
                }
                onAdd={() =>
                  addOption(
                    "noodles"
                  )
                }
                onChange={(
                  index,
                  value
                ) =>
                  updateOption(
                    "noodles",
                    index,
                    value
                  )
                }
                onRemove={(index) =>
                  removeOption(
                    "noodles",
                    index
                  )
                }
              />

              <div className="my-8 border-t border-[#E5DED2]" />

              <OptionEditor
                title="Spice Levels"
                values={
                  form.customization
                    .spiceLevels
                }
                onAdd={() =>
                  addOption(
                    "spiceLevels"
                  )
                }
                onChange={(
                  index,
                  value
                ) =>
                  updateOption(
                    "spiceLevels",
                    index,
                    value
                  )
                }
                onRemove={(index) =>
                  removeOption(
                    "spiceLevels",
                    index
                  )
                }
              />
            </section>

            {/* ADD-ONS */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Add-ons
                  </h2>

                  <p className="mt-1 text-sm text-[#6B6258]">
                    Extra items customers can add.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    addAddOn
                  }
                  className="rounded-xl bg-[#171513] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  + Add
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {form.addOns
                  .length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#DED6C9] p-6 text-center text-sm text-[#8A8177]">
                    No add-ons added.
                  </div>
                )}

                {form.addOns.map(
                  (
                    addOn,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="rounded-2xl border border-[#E5DED2] bg-white p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                        <input
                          value={
                            addOn.name ||
                            ""
                          }
                          onChange={(
                            e
                          ) =>
                            updateAddOn(
                              index,
                              "name",
                              e.target
                                .value
                            )
                          }
                          className={inputClass}
                          placeholder="Extra Egg"
                        />

                        <input
                          type="number"
                          min="0"
                          value={
                            addOn.price ??
                            0
                          }
                          onChange={(
                            e
                          ) =>
                            updateAddOn(
                              index,
                              "price",
                              e.target
                                .value
                            )
                          }
                          className={inputClass}
                          placeholder="40"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeAddOn(
                              index
                            )
                          }
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600"
                        >
                          Remove
                        </button>
                      </div>

                      <label className="mt-3 flex items-center gap-2 text-xs text-[#6B6258]">
                        <input
                          type="checkbox"
                          checked={
                            addOn.isAvailable !==
                            false
                          }
                          onChange={(
                            e
                          ) =>
                            updateAddOn(
                              index,
                              "isAvailable",
                              e.target
                                .checked
                            )
                          }
                        />

                        Available
                      </label>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>

          {/* ==================================================
              RIGHT SIDEBAR
          =================================================== */}

          <aside className="space-y-6">
            {/* IMAGE */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6">
              <h2 className="text-lg font-semibold">
                Product Image
              </h2>

              <div className="mt-5 overflow-hidden rounded-2xl border border-[#E5DED2] bg-[#F5F0E8]">
                {form.image ? (
                  <img
                    src={form.image}
                    alt={
                      form.name ||
                      "Product"
                    }
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-5xl">
                    🍜
                  </div>
                )}
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl bg-[#171513] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B83A2E]">
                {uploading
                  ? "Uploading..."
                  : "Upload New Image"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageUpload
                  }
                  disabled={
                    uploading
                  }
                  className="hidden"
                />
              </label>

              <p className="mt-3 text-center text-[11px] text-[#8A8177]">
                JPG, PNG or WebP · Max 5 MB
              </p>
            </section>

            {/* STATUS */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6">
              <h2 className="text-lg font-semibold">
                Product Status
              </h2>

              <div className="mt-5 space-y-4">
                <Toggle
                  label="Available"
                  checked={
                    form.isAvailable
                  }
                  onChange={(value) =>
                    updateField(
                      "isAvailable",
                      value
                    )
                  }
                />

                <Toggle
                  label="Popular"
                  checked={
                    form.isPopular
                  }
                  onChange={(value) =>
                    updateField(
                      "isPopular",
                      value
                    )
                  }
                />

                <Toggle
                  label="Featured"
                  checked={
                    form.isFeatured
                  }
                  onChange={(value) =>
                    updateField(
                      "isFeatured",
                      value
                    )
                  }
                />
              </div>
            </section>

            {/* SORT */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6">
              <label className={labelClass}>
                Sort Order
              </label>

              <input
                type="number"
                value={
                  form.sortOrder
                }
                onChange={(e) =>
                  updateField(
                    "sortOrder",
                    e.target.value
                  )
                }
                className={inputClass}
              />

              <p className="mt-2 text-[11px] text-[#8A8177]">
                Lower numbers appear first.
              </p>
            </section>

            {/* SEO */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6">
              <h2 className="text-lg font-semibold">
                SEO
              </h2>

              <div className="mt-5 space-y-4">
                <div>
                  <label className={labelClass}>
                    Meta Title
                  </label>

                  <input
                    value={
                      form.metaTitle
                    }
                    onChange={(e) =>
                      updateField(
                        "metaTitle",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Meta Description
                  </label>

                  <textarea
                    value={
                      form.metaDescription
                    }
                    onChange={(e) =>
                      updateField(
                        "metaDescription",
                        e.target.value
                      )
                    }
                    rows={4}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* SAVE */}

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-2xl bg-[#B83A2E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#171513] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </aside>
        </div>
      </form>
    </main>
  );
}


// ============================================================
// OPTION EDITOR
// ============================================================

function OptionEditor({
  title,
  values,
  onAdd,
  onChange,
  onRemove,
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {title}
        </h3>

        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-semibold text-[#B83A2E]"
        >
          + Add Option
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {values.length === 0 && (
          <p className="text-xs text-[#8A8177]">
            No options added.
          </p>
        )}

        {values.map(
          (value, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <input
                value={value}
                onChange={(e) =>
                  onChange(
                    index,
                    e.target.value
                  )
                }
                className={inputClass}
                placeholder={
                  title ===
                  "Noodles"
                    ? "Regular"
                    : "Medium"
                }
              />

              <button
                type="button"
                onClick={() =>
                  onRemove(index)
                }
                className="rounded-xl border border-red-200 px-4 text-xs font-medium text-red-600"
              >
                ×
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}


// ============================================================
// TOGGLE
// ============================================================

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E5DED2] bg-white px-4 py-3">
      <span className="text-sm font-medium">
        {label}
      </span>

      <button
        type="button"
        onClick={() =>
          onChange(!checked)
        }
        className={`relative h-6 w-11 rounded-full transition ${
          checked
            ? "bg-[#B83A2E]"
            : "bg-[#D8D0C4]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </label>
  );
}