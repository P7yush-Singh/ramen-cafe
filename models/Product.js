import mongoose from "mongoose";

// ============================================================
// ADD-ON SCHEMA
// ============================================================

const addOnSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      isAvailable: {
        type: Boolean,
        default: true,
      },
    },
    {
      _id: true,
    }
  );

// ============================================================
// PRODUCT SCHEMA
// ============================================================

const productSchema =
  new mongoose.Schema(
    {
      // --------------------------------------------------------
      // BASIC INFORMATION
      // --------------------------------------------------------

      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },

      // --------------------------------------------------------
      // IMAGE
      // --------------------------------------------------------

      image: {
        type: String,
        default: "",
        trim: true,
      },

      // --------------------------------------------------------
      // CATEGORY
      // --------------------------------------------------------

      category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
        index: true,
      },

      // --------------------------------------------------------
      // PRICE
      // --------------------------------------------------------

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      // --------------------------------------------------------
      // FOOD TYPE
      // --------------------------------------------------------

      foodType: {
        type: String,
        enum: [
          "veg",
          "non-veg",
        ],
        default: "veg",
        index: true,
      },

      // --------------------------------------------------------
      // AVAILABILITY
      // --------------------------------------------------------

      isAvailable: {
        type: Boolean,
        default: true,
        index: true,
      },

      // --------------------------------------------------------
      // POPULAR
      // --------------------------------------------------------

      isPopular: {
        type: Boolean,
        default: false,
        index: true,
      },

      // --------------------------------------------------------
      // FEATURED
      // --------------------------------------------------------

      isFeatured: {
        type: Boolean,
        default: false,
        index: true,
      },

      // --------------------------------------------------------
      // ADD-ONS
      // --------------------------------------------------------

      addOns: {
        type: [
          addOnSchema,
        ],

        default: [],
      },

      // --------------------------------------------------------
      // CUSTOMIZATION OPTIONS
      // --------------------------------------------------------

      customization: {
        noodles: {
          type: [
            String,
          ],

          default: [],
        },

        spiceLevels: {
          type: [
            String,
          ],

          default: [],
        },
      },

      // --------------------------------------------------------
      // SORT ORDER
      // --------------------------------------------------------

      sortOrder: {
        type: Number,
        default: 0,
        index: true,
      },

      // --------------------------------------------------------
      // SEO / ADMIN
      // --------------------------------------------------------

      metaTitle: {
        type: String,
        default: "",
        trim: true,
        maxlength: 180,
      },

      metaDescription: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300,
      },

      // --------------------------------------------------------
      // CREATED BY
      // --------------------------------------------------------

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      updatedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

// ============================================================
// INDEXES
// ============================================================

productSchema.index({
  category: 1,
  sortOrder: 1,
});

productSchema.index({
  isAvailable: 1,
  category: 1,
});

productSchema.index({
  isPopular: 1,
  isAvailable: 1,
});

productSchema.index({
  isFeatured: 1,
  isAvailable: 1,
});

// ============================================================
// MODEL
// ============================================================

const Product =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );

export default Product;