import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    // ==========================================================
    // TABLE ID
    // ==========================================================

    tableId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^T[A-Z0-9-]+$/,
    },

    // ==========================================================
    // DISPLAY NAME
    // ==========================================================

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // ==========================================================
    // ACTIVE / DISABLED
    // ==========================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ==========================================================
    // LOCATION
    // ==========================================================

    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // ==========================================================
    // NOTES
    // ==========================================================

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEX
// ============================================================

tableSchema.index({
  isActive: 1,
  tableId: 1,
});

// ============================================================
// MODEL
// ============================================================

const Table =
  mongoose.models.Table ||
  mongoose.model("Table", tableSchema);

export default Table;