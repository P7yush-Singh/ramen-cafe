import mongoose from "mongoose";

const UserSchema =
  new mongoose.Schema(
    {
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
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      role: {
        type: String,
        enum: [
          "customer",
          "admin",
          "owner",
          "staff",
        ],
        default: "customer",
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      lastLoginAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.models.User ||
  mongoose.model(
    "User",
    UserSchema
  );