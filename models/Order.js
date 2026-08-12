import mongoose from "mongoose";

// =====================================================
// ORDER ITEM
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // -----------------------------------------------
    // CUSTOMIZATION
    // -----------------------------------------------

    noodles: {
      type: String,
      default: "",
      trim: true,
    },

    spice: {
      type: String,
      default: "",
      trim: true,
    },

    addons: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },

          price: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      default: [],
    },

    // Final price for this line item
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// CUSTOMER SNAPSHOT
// =====================================================

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    // -----------------------------------------------
    // ORDER NUMBER
    // -----------------------------------------------

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // -----------------------------------------------
    // CUSTOMER
    // -----------------------------------------------

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    customer: {
      type: customerSchema,
      required: true,
    },

    // -----------------------------------------------
    // TABLE
    // -----------------------------------------------

    tableId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // -----------------------------------------------
    // ORDER ITEMS
    // -----------------------------------------------

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must contain at least one item.",
      },
    },

    // -----------------------------------------------
    // BILL
    // -----------------------------------------------

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 5,
      min: 0,
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // -----------------------------------------------
    // ORDER STATUS
    // -----------------------------------------------

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    // -----------------------------------------------
    // PAYMENT
    // -----------------------------------------------

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "online",
        "upi",
        "card",
        "other",
      ],
      default: null,
    },

    // -----------------------------------------------
    // PREPARATION TIME
    // -----------------------------------------------

    estimatedPreparationMinutes: {
      type: Number,
      default: 20,
      min: 0,
    },

    estimatedReadyAt: {
      type: Date,
      default: null,
    },

    // -----------------------------------------------
    // TIMESTAMPS
    // -----------------------------------------------

    confirmedAt: {
      type: Date,
      default: null,
    },

    preparingAt: {
      type: Date,
      default: null,
    },

    readyAt: {
      type: Date,
      default: null,
    },

    servedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

orderSchema.index({
  userId: 1,
  createdAt: -1,
});

orderSchema.index({
  tableId: 1,
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

orderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;