import mongoose from "mongoose";

const OtpSchema =
  new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
      },

      codeHash: {
        type: String,
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      attempts: {
        type: Number,
        default: 0,
      },

      consumed: {
        type: Boolean,
        default: false,
      },

      lastSentAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

// MongoDB automatically removes expired OTP records.
OtpSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

export default mongoose.models.Otp ||
  mongoose.model(
    "Otp",
    OtpSchema
  );