import mongoose from "mongoose";

// ============================================================
// RESTAURANT SETTINGS
// ============================================================

const RestaurantSettingsSchema =
  new mongoose.Schema(
    {
      // ========================================================
      // RESTAURANT PROFILE
      // ========================================================

      restaurantName: {
        type: String,
        default: "Ramen Cafe",
        trim: true,
        maxlength: 100,
      },

      tagline: {
        type: String,
        default:
          "Authentic Japanese comfort food.",
        trim: true,
        maxlength: 200,
      },

      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        maxlength: 254,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
        maxlength: 20,
      },

      address: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },

      // ========================================================
      // ORDER SETTINGS
      // ========================================================

      taxRate: {
        type: Number,
        default: 5,
        min: 0,
        max: 100,
      },

      minPreparationMinutes: {
        type: Number,
        default: 15,
        min: 1,
        max: 180,
      },

      maxPreparationMinutes: {
        type: Number,
        default: 25,
        min: 1,
        max: 180,
      },

      // ========================================================
      // BILL REQUEST SETTINGS
      // ========================================================

      billRequestsEnabled: {
        type: Boolean,
        default: true,
      },

      // Owner emails
      billOwnerEmails: {
        type: [
          {
            type: String,
            trim: true,
            lowercase: true,
          },
        ],
        default: [],
      },

      // Staff emails
      billStaffEmails: {
        type: [
          {
            type: String,
            trim: true,
            lowercase: true,
          },
        ],
        default: [],
      },

      // ========================================================
      // SYSTEM
      // ========================================================

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
// SINGLETON SETTINGS
// ============================================================
//
// Only one RestaurantSettings document should exist.
//
// We use a fixed key rather than relying only on
// findOne(), so accidental duplicate documents are avoided.
//

RestaurantSettingsSchema.add({
  settingsKey: {
    type: String,
    default: "main",
    unique: true,
    index: true,
  },
});

// ============================================================
// MODEL
// ============================================================

const RestaurantSettings =
  mongoose.models.RestaurantSettings ||
  mongoose.model(
    "RestaurantSettings",
    RestaurantSettingsSchema
  );

export default RestaurantSettings;