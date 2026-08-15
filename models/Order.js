import mongoose from "mongoose";

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

    // Price of one base product at the time of ordering
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

    // =================================================
    // CUSTOMIZATION
    // =================================================

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
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// BILL
// =====================================================

const billSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // BILL NUMBER
    // -------------------------------------------------

    billNumber: {
      type: String,
      default: undefined,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },

    // -------------------------------------------------
    // BILL STATUS
    // -------------------------------------------------

    status: {
      type: String,
      enum: [
        "not_requested",
        "requested",
        "generated",
        "paid",
        "cancelled",
      ],
      default: "not_requested",
      index: true,
    },

    // -------------------------------------------------
    // BILL AMOUNT
    // -------------------------------------------------

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // -------------------------------------------------
    // BILL TIMESTAMPS
    // -------------------------------------------------

    requestedAt: {
      type: Date,
      default: null,
    },

    generatedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// PAYMENT
// =====================================================

const paymentSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // PAYMENT STATUS
    // -------------------------------------------------

    status: {
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

    // -------------------------------------------------
    // PAYMENT AMOUNT
    // -------------------------------------------------

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // -------------------------------------------------
    // PAYMENT METHOD
    // -------------------------------------------------

    method: {
      type: String,
      enum: [
        "cash",
        "upi",
        "card",
        "online",
        "other",
      ],
      default: null,
    },

    // -------------------------------------------------
    // TRANSACTION ID
    // -------------------------------------------------

    transactionId: {
      type: String,
      default: undefined,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },

    // -------------------------------------------------
    // PAYMENT TIMESTAMP
    // -------------------------------------------------

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// RECEIPT
// =====================================================

const receiptSchema = new mongoose.Schema(
  {
    // Receipt email sent timestamp
    sentAt: {
      type: Date,
      default: null,
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
    // =================================================
    // ORDER NUMBER
    // =================================================

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // =================================================
    // CUSTOMER
    // =================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshot of customer information at order time
    customer: {
      type: customerSchema,
      required: true,
    },

    // =================================================
    // TABLE
    // =================================================

    tableId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // =================================================
    // ORDER ITEMS
    // =================================================

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return (
            Array.isArray(items) &&
            items.length > 0
          );
        },

        message:
          "Order must contain at least one item.",
      },
    },

    // =================================================
    // BILL AMOUNTS
    // =================================================

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

    // =================================================
    // BILL
    // =================================================

    bill: {
      type: billSchema,
      required: true,

      default: function () {
        return {
          status: "not_requested",
          amount: this.total || 0,
        };
      },
    },

    // =================================================
    // PAYMENT
    // =================================================

    payment: {
      type: paymentSchema,
      required: true,

      default: function () {
        return {
          status: "pending",
          amount: 0,
        };
      },
    },

    // =================================================
    // RECEIPT
    // =================================================

    receipt: {
      type: receiptSchema,

      default: function () {
        return {
          sentAt: null,
        };
      },
    },

    // =================================================
    // ORDER STATUS
    // =================================================

    status: {
      type: String,

      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],

      default: "pending",
      index: true,
    },

    // =================================================
    // PREPARATION
    // =================================================

    estimatedPreparationMinutes: {
      type: Number,
      default: 20,
      min: 0,
    },

    estimatedReadyAt: {
      type: Date,
      default: null,
    },

    // =================================================
    // ORDER TIMESTAMPS
    // =================================================

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

    completedAt: {
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
      maxlength: 500,
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
  "bill.status": 1,
  createdAt: -1,
});

orderSchema.index({
  "payment.status": 1,
  createdAt: -1,
});

orderSchema.index({
  "payment.paidAt": -1,
});

// =====================================================
// MODEL
// =====================================================

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;