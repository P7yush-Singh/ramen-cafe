"use client";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
} from "lucide-react";

import Link from "next/link";

const categories = [
  "Ramen",
  "Sides",
  "Drinks",
  "Desserts",
];

export default function NewProductPage() {
  const [form, setForm] =
    useState({
      name: "",
      description: "",
      category: "Ramen",
      price: "",
      image: "",
      preparationTime: 20,
      isAvailable: true,
      isFeatured: false,
      noodles: [],
      spiceLevels: [],
      addons: [],
    });

  const [noodleInput, setNoodleInput] =
    useState("");

  const [spiceName, setSpiceName] =
    useState("");

  const [spiceValue, setSpiceValue] =
    useState("");

  const [addonName, setAddonName] =
    useState("");

  const [addonPrice, setAddonPrice] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  function updateField(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addNoodle() {
    if (!noodleInput.trim())
      return;

    setForm((current) => ({
      ...current,

      noodles: [
        ...current.noodles,
        noodleInput.trim(),
      ],
    }));

    setNoodleInput("");
  }

  function removeNoodle(index) {
    setForm((current) => ({
      ...current,

      noodles:
        current.noodles.filter(
          (_, i) => i !== index
        ),
    }));
  }

  function addSpice() {
    if (
      !spiceName.trim() ||
      !spiceValue.trim()
    )
      return;

    setForm((current) => ({
      ...current,

      spiceLevels: [
        ...current.spiceLevels,
        {
          name: spiceName.trim(),
          value: spiceValue.trim(),
        },
      ],
    }));

    setSpiceName("");
    setSpiceValue("");
  }

  function removeSpice(index) {
    setForm((current) => ({
      ...current,

      spiceLevels:
        current.spiceLevels.filter(
          (_, i) => i !== index
        ),
    }));
  }

  function addAddon() {
    if (!addonName.trim())
      return;

    setForm((current) => ({
      ...current,

      addons: [
        ...current.addons,
        {
          name: addonName.trim(),
          price:
            Number(addonPrice) || 0,
        },
      ],
    }));

    setAddonName("");
    setAddonPrice("");
  }

  function removeAddon(index) {
    setForm((current) => ({
      ...current,

      addons:
        current.addons.filter(
          (_, i) => i !== index
        ),
    }));
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/admin/products",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              form
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create product."
        );
      }

      window.location.href =
        "/admin/products";
    } catch (error) {
      alert(
        error.message ||
          "Failed to create product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] p-6 md:p-8">

      <div className="mx-auto max-w-[1000px]">

        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6258]"
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
            Create a new item for the Ramen Cafe menu.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >

          {/* BASIC INFORMATION */}

          <section className="rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-6">

            <h2 className="text-lg font-semibold">
              Basic Information
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <Field
                label="Product Name"
                value={form.name}
                onChange={(value) =>
                  updateField(
                    "name",
                    value
                  )
                }
                placeholder="e.g. Tokyo Shoyu Ramen"
                required
              />

              <div>
                <label className="text-xs font-semibold text-[#6B6258]">
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
                  className="mt-2 w-full rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={
                          category
                        }
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Field
                label="Price"
                type="number"
                value={form.price}
                onChange={(value) =>
                  updateField(
                    "price",
                    value
                  )
                }
                placeholder="179"
                required
              />

              <Field
                label="Preparation Time"
                type="number"
                value={
                  form.preparationTime
                }
                onChange={(value) =>
                  updateField(
                    "preparationTime",
                    value
                  )
                }
                placeholder="20"
              />

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[#6B6258]">
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
                  className="mt-2 w-full rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[#6B6258]">
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
                  className="mt-2 w-full resize-none rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
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

          {/* NOODLES */}

          <section className="rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-6">

            <h2 className="text-lg font-semibold">
              Noodle Options
            </h2>

            <div className="mt-5 flex gap-3">

              <input
                value={noodleInput}
                onChange={(event) =>
                  setNoodleInput(
                    event.target.value
                  )
                }
                placeholder="e.g. Thin"
                className="flex-1 rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
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
                    key={index}
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
                    >
                      ×
                    </button>
                  </span>
                )
              )}

            </div>

          </section>

          {/* SPICE */}

          <section className="rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-6">

            <h2 className="text-lg font-semibold">
              Spice Levels
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">

              <input
                value={spiceName}
                onChange={(event) =>
                  setSpiceName(
                    event.target.value
                  )
                }
                placeholder="Name: Mild"
                className="rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
              />

              <input
                value={spiceValue}
                onChange={(event) =>
                  setSpiceValue(
                    event.target.value
                  )
                }
                placeholder="Value: 1"
                className="rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
              />

              <button
                type="button"
                onClick={addSpice}
                className="rounded-xl bg-[#171513] px-4 text-white"
              >
                <Plus size={17} />
              </button>

            </div>

            <div className="mt-4 space-y-2">

              {form.spiceLevels.map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-3 text-sm"
                  >
                    <span>
                      {item.name}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-[#6B6258]">
                        {item.value}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeSpice(
                            index
                          )
                        }
                      >
                        <Trash2
                          size={15}
                          className="text-red-600"
                        />
                      </button>
                    </div>
                  </div>
                )
              )}

            </div>

          </section>

          {/* ADDONS */}

          <section className="rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-6">

            <h2 className="text-lg font-semibold">
              Add-ons
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">

              <input
                value={addonName}
                onChange={(event) =>
                  setAddonName(
                    event.target.value
                  )
                }
                placeholder="Extra Egg"
                className="rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
              />

              <input
                type="number"
                value={addonPrice}
                onChange={(event) =>
                  setAddonPrice(
                    event.target.value
                  )
                }
                placeholder="40"
                className="rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
              />

              <button
                type="button"
                onClick={addAddon}
                className="rounded-xl bg-[#171513] px-4 text-white"
              >
                <Plus size={17} />
              </button>

            </div>

            <div className="mt-4 space-y-2">

              {form.addons.map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-3 text-sm"
                  >
                    <span>
                      {item.name}
                    </span>

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
                      >
                        <Trash2
                          size={15}
                          className="text-red-600"
                        />
                      </button>

                    </div>
                  </div>
                )
              )}

            </div>

          </section>

          {/* SAVE */}

          <div className="flex justify-end gap-3">

            <Link
              href="/admin/products"
              className="rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-5 py-3 text-sm font-medium"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
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
      <label className="text-xs font-semibold text-[#6B6258]">
        {label}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-sm outline-none"
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