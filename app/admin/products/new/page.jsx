"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ImageOff,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";

const categories = [
  "Ramen",
  "Sides",
  "Drinks",
  "Desserts",
];

const inputClass =
  "w-full rounded-2xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm text-[#171513] outline-none transition focus:border-[#B83A2E] focus:ring-2 focus:ring-[#B83A2E]/10";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6258]";

export default function NewProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Ramen",
    price: "",
    image: "",
    foodType: "veg",
    isAvailable: true,
    isPopular: false,
    isFeatured: false,
    noodles: [],
    spiceLevels: [],
    addOns: [],
    sortOrder: 0,
    metaTitle: "",
    metaDescription: "",
  });

  const [noodleInput, setNoodleInput] =
    useState("");

  const [spiceInput, setSpiceInput] =
    useState("");

  const [addonName, setAddonName] =
    useState("");

  const [addonPrice, setAddonPrice] =
    useState("");

  const [addonAvailable, setAddonAvailable] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addNoodle() {
    const value = noodleInput.trim();

    if (!value) return;

    setForm((current) => ({
      ...current,
      noodles: [
        ...current.noodles,
        value,
      ],
    }));

    setNoodleInput("");
  }

  function removeNoodle(index) {
    setForm((current) => ({
      ...current,
      noodles:
        current.noodles.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  }

  function addSpice() {
    const value = spiceInput.trim();

    if (!value) return;

    setForm((current) => ({
      ...current,
      spiceLevels: [
        ...current.spiceLevels,
        value,
      ],
    }));

    setSpiceInput("");
  }

  function removeSpice(index) {
    setForm((current) => ({
      ...current,
      spiceLevels:
        current.spiceLevels.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  }

  function addAddon() {
    const name = addonName.trim();

    if (!name) return;

    setForm((current) => ({
      ...current,
      addOns: [
        ...current.addOns,
        {
          name,
          price:
            Number(addonPrice) || 0,
          isAvailable:
            addonAvailable,
        },
      ],
    }));

    setAddonName("");
    setAddonPrice("");
    setAddonAvailable(true);
  }

  function removeAddon(index) {
    setForm((current) => ({
      ...current,
      addOns:
        current.addOns.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  }

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

      if (!file.type?.startsWith("image/")) {
        throw new Error(
          "Only image files are allowed."
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "Image must be smaller than 5 MB."
        );
      }

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
        data?.image?.url || ""
      );

      setSuccess(
        "Image uploaded successfully."
      );
    } catch (uploadError) {
      console.error(
        "New product image upload error:",
        uploadError
      );

      setError(
        uploadError?.message ||
          "Failed to upload image."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const name =
        form.name.trim();

      const category =
        form.category.trim();

      const price =
        Number(form.price);

      if (!name) {
        throw new Error(
          "Product name is required."
        );
      }

      if (!category) {
        throw new Error(
          "Category is required."
        );
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error(
          "Enter a valid price."
        );
      }

      const payload = {
        name,
        description:
          form.description.trim(),
        category,
        price,
        image:
          form.image.trim(),
        foodType:
          form.foodType ===
          "non-veg"
            ? "non-veg"
            : "veg",
        isAvailable:
          form.isAvailable === true,
        isPopular:
          form.isPopular === true,
        isFeatured:
          form.isFeatured === true,
        addOns:
          form.addOns
            .filter(
              (item) =>
                item?.name?.trim()
            )
            .map((item) => ({
              name:
                item.name.trim(),
              price:
                Number(item.price) || 0,
              isAvailable:
                item.isAvailable !==
                false,
            })),
        customization: {
          noodles:
            form.noodles
              .map((item) =>
                String(item).trim()
              )
              .filter(Boolean),
          spiceLevels:
            form.spiceLevels
              .map((item) =>
                String(item).trim()
              )
              .filter(Boolean),
        },
        sortOrder:
          Number(form.sortOrder) || 0,
        metaTitle:
          form.metaTitle.trim(),
        metaDescription:
          form.metaDescription.trim(),
      };

      const response =
        await fetch(
          "/api/admin/products",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(payload),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to create product."
        );
      }

      window.location.href =
        "/admin/products";
    } catch (submitError) {
      console.error(
        "Create product error:",
        submitError
      );

      setError(
        submitError?.message ||
          "Failed to create product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] p-6 md:p-8">
      <div className="mx-auto max-w-[1100px]">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6258] transition hover:text-[#B83A2E]"
        >
          <ArrowLeft size={16} />
          Products
        </Link>

        <div className="mt-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Menu Management
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
            Add Product
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            Create a new item for the
            Ramen Cafe menu.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
              {success}
            </div>
          )}

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Basic Information
              </h2>
              <p className="mt-1 text-sm text-[#6B6258]">
                Product details customers
                will see.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Product Name"
                value={form.name}
                onChange={(value) =>
                  updateField(
                    "name",
                    value
                  )
                }
                placeholder="Tokyo Shoyu Ramen"
                required
              />

              <div>
                <label className={labelClass}>
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value
                    )
                  }
                  className={`${inputClass} mt-2`}
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Field
                label="Price (₹)"
                type="number"
                value={form.price}
                onChange={(value) =>
                  updateField(
                    "price",
                    value
                  )
                }
                placeholder="249"
                required
              />

              <div>
                <label className={labelClass}>
                  Food Type
                </label>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "veg",
                      label: "Vegetarian",
                    },
                    {
                      value: "non-veg",
                      label:
                        "Non-Vegetarian",
                    },
                  ].map((option) => (
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
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        form.foodType ===
                        option.value
                          ? "border-[#B83A2E] bg-[#B83A2E] text-white"
                          : "border-[#DED6C9] bg-white text-[#6B6258]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Image URL
                </label>

                <input
                  value={form.image}
                  onChange={(event) =>
                    updateField(
                      "image",
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className={`${inputClass} mt-2`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Describe this menu item..."
                  className={`${inputClass} mt-2 resize-none`}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-6">
              <Checkbox
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

              <Checkbox
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

              <Checkbox
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

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
            <h2 className="text-lg font-semibold">
              Product Image
            </h2>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#E5DED2] bg-[#F5F0E8]">
              {form.image ? (
                <img
                  src={form.image}
                  alt={
                    form.name ||
                    "Product preview"
                  }
                  onError={() =>
                    updateField(
                      "image",
                      ""
                    )
                  }
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 text-[#8A8177]">
                  <ImageOff
                    size={42}
                    strokeWidth={1.5}
                  />
                  <span className="text-xs">
                    No image selected
                  </span>
                </div>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#171513] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B83A2E]">
              <Upload size={16} />
              {uploading
                ? "Uploading..."
                : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageUpload
                }
                disabled={uploading}
                className="hidden"
              />
            </label>

            <p className="mt-3 text-center text-[11px] text-[#8A8177]">
              JPG, PNG or WebP · Max 5 MB
            </p>
          </section>

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Noodle Options
              </h2>
              <p className="mt-1 text-sm text-[#6B6258]">
                Stored as product
                customization options.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                value={noodleInput}
                onChange={(event) =>
                  setNoodleInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    addNoodle();
                  }
                }}
                placeholder="Thin"
                className={inputClass}
              />

              <button
                type="button"
                onClick={addNoodle}
                className="rounded-xl bg-[#171513] px-4 text-white"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.noodles.map(
                (item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F5F0E8] px-3 py-2 text-xs"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        removeNoodle(
                          index
                        )
                      }
                      aria-label={`Remove ${item}`}
                    >
                      ×
                    </button>
                  </span>
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Spice Levels
              </h2>
              <p className="mt-1 text-sm text-[#6B6258]">
                Add the labels customers
                can choose.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                value={spiceInput}
                onChange={(event) =>
                  setSpiceInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    addSpice();
                  }
                }}
                placeholder="Medium"
                className={inputClass}
              />

              <button
                type="button"
                onClick={addSpice}
                className="rounded-xl bg-[#171513] px-4 text-white"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.spiceLevels.map(
                (item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F5F0E8] px-3 py-2 text-xs"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        removeSpice(
                          index
                        )
                      }
                      aria-label={`Remove ${item}`}
                    >
                      ×
                    </button>
                  </span>
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Add-ons
                </h2>
                <p className="mt-1 text-sm text-[#6B6258]">
                  Extra items customers
                  can add.
                </p>
              </div>

              <button
                type="button"
                onClick={addAddon}
                className="rounded-xl bg-[#171513] px-4 py-2.5 text-xs font-semibold text-white"
              >
                + Add
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_150px_auto]">
              <input
                value={addonName}
                onChange={(event) =>
                  setAddonName(
                    event.target.value
                  )
                }
                placeholder="Extra Egg"
                className={inputClass}
              />

              <input
                type="number"
                min="0"
                value={addonPrice}
                onChange={(event) =>
                  setAddonPrice(
                    event.target.value
                  )
                }
                placeholder="40"
                className={inputClass}
              />

              <button
                type="button"
                onClick={addAddon}
                className="rounded-xl border border-[#DED6C9] bg-white px-4 text-sm font-semibold"
              >
                <Plus size={17} />
              </button>
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-[#6B6258]">
              <input
                type="checkbox"
                checked={addonAvailable}
                onChange={(event) =>
                  setAddonAvailable(
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-[#B83A2E]"
              />
              New add-on available
            </label>

            <div className="mt-5 space-y-2">
              {form.addOns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#DED6C9] p-6 text-center text-sm text-[#8A8177]">
                  No add-ons added.
                </div>
              ) : (
                form.addOns.map(
                  (item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#6B6258]">
                          {item.isAvailable !==
                          false
                            ? "Available"
                            : "Unavailable"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          ₹{item.price}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeAddon(
                              index
                            )
                          }
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2
                            size={15}
                            className="text-red-600"
                          />
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateField(
                      "sortOrder",
                      event.target.value
                    )
                  }
                  className={`${inputClass} mt-2`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Meta Title
                </label>
                <input
                  value={form.metaTitle}
                  onChange={(event) =>
                    updateField(
                      "metaTitle",
                      event.target.value
                    )
                  }
                  className={`${inputClass} mt-2`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Meta Description
                </label>
                <textarea
                  value={
                    form.metaDescription
                  }
                  onChange={(event) =>
                    updateField(
                      "metaDescription",
                      event.target.value
                    )
                  }
                  rows={4}
                  className={`${inputClass} mt-2 resize-none`}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/products"
              className="rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-5 py-3 text-sm font-medium"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving || uploading
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#B83A2E] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save size={16} />
              {saving
                ? "Saving..."
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
      </label>

      <input
        type={type}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        required={required}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className={`${inputClass} mt-2`}
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-4 w-4 accent-[#B83A2E]"
      />
      {label}
    </label>
  );
}