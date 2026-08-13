import {
  getCloudinaryConfig,
  generateCloudinarySignature,
} from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const {
      cloudName,
      apiKey,
    } = getCloudinaryConfig();

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!file) {
      return Response.json(
        {
          success: false,
          error:
            "No image file provided.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !file.type?.startsWith(
        "image/"
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Only image files are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    // 5 MB maximum
    const MAX_FILE_SIZE =
      5 * 1024 * 1024;

    if (
      file.size > MAX_FILE_SIZE
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Image must be smaller than 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const timestamp =
      Math.floor(
        Date.now() / 1000
      );

    const folder =
      "ramen-cafe/products";

    const signature =
      generateCloudinarySignature({
        folder,
        timestamp,
      });

    const uploadData =
      new FormData();

    uploadData.append(
      "file",
      file
    );

    uploadData.append(
      "api_key",
      apiKey
    );

    uploadData.append(
      "timestamp",
      String(timestamp)
    );

    uploadData.append(
      "folder",
      folder
    );

    uploadData.append(
      "signature",
      signature
    );

    const uploadUrl =
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response =
      await fetch(
        uploadUrl,
        {
          method: "POST",
          body: uploadData,
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "Cloudinary upload failed:",
        result
      );

      return Response.json(
        {
          success: false,
          error:
            result?.error?.message ||
            "Cloudinary upload failed.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      success: true,

      image: {
        url: result.secure_url,
        publicId:
          result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    console.error(
      "IMAGE UPLOAD ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Failed to upload image.",
      },
      {
        status: 500,
      }
    );
  }
}