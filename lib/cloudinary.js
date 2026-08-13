import crypto from "crypto";

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME;

const apiKey =
  process.env.CLOUDINARY_API_KEY;

const apiSecret =
  process.env.CLOUDINARY_API_SECRET;

export function getCloudinaryConfig() {
  if (
    !cloudName ||
    !apiKey ||
    !apiSecret
  ) {
    throw new Error(
      "Cloudinary environment variables are missing."
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
}

export function generateCloudinarySignature(
  params
) {
  const { apiSecret } =
    getCloudinaryConfig();

  const signatureBase =
    Object.keys(params)
      .sort()
      .map(
        (key) =>
          `${key}=${params[key]}`
      )
      .join("&");

  return crypto
    .createHash("sha1")
    .update(
      signatureBase + apiSecret
    )
    .digest("hex");
}