import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // ============================================================
    // ACCOUNT INFORMATION
    // ============================================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },

    // ============================================================
    // ROLE
    // ============================================================

    role: {
      type: String,
      enum: [
        "customer",
        "admin",
        "owner",
        "staff",
      ],
      default: "customer",
      index: true,
    },

    // ============================================================
    // ACCOUNT STATUS
    // ============================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ============================================================
    // WELCOME EMAIL
    // ============================================================

    // Sent only after the customer's first successful order
    welcomeEmailSentAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // LOGIN
    // ============================================================

    lastLoginAt: {
      type: Date,
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

UserSchema.index({
  role: 1,
  isActive: 1,
});

UserSchema.index({
  phone: 1,
});

// ============================================================
// MODEL
// ============================================================

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);