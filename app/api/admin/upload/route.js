import {
  getCloudinaryConfig,
  generateCloudinarySignature,
} from "@/lib/cloudinary";

import {
  requireProductAccess,
} from "@/lib/admin-auth";

// ============================================================
// POST IMAGE
// ============================================================

export async function POST(
  request
) {
  try {
    // ========================================================
    // 1. AUTHORIZATION
    // ========================================================

    const auth =
      await requireProductAccess();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // 2. CLOUDINARY CONFIG
    // ========================================================

    const {
      cloudName,
      apiKey,
    } =
      getCloudinaryConfig();

    // ========================================================
    // 3. FORM DATA
    // ========================================================

    const formData =
      await request.formData();

    const file =
      formData.get(
        "file"
      );

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

    // ========================================================
    // 4. FILE TYPE
    // ========================================================

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

    // ========================================================
    // 5. FILE SIZE
    // ========================================================

    const MAX_FILE_SIZE =
      5 * 1024 * 1024;

    if (
      file.size >
      MAX_FILE_SIZE
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

    // ========================================================
    // 6. TIMESTAMP
    // ========================================================

    const timestamp =
      Math.floor(
        Date.now() / 1000
      );

    // ========================================================
    // 7. FOLDER
    // ========================================================

    const folder =
      "ramen-cafe/products";

    // ========================================================
    // 8. SIGNATURE
    // ========================================================

    const signature =
      generateCloudinarySignature(
        {
          folder,
          timestamp,
        }
      );

    // ========================================================
    // 9. CLOUDINARY FORM
    // ========================================================

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
      String(
        timestamp
      )
    );

    uploadData.append(
      "folder",
      folder
    );

    uploadData.append(
      "signature",
      signature
    );

    // ========================================================
    // 10. UPLOAD
    // ========================================================

    const uploadUrl =
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response =
      await fetch(
        uploadUrl,
        {
          method:
            "POST",

          body:
            uploadData,
        }
      );

    const result =
      await response.json();

    // ========================================================
    // 11. CLOUDINARY ERROR
    // ========================================================

    if (!response.ok) {
      console.error(
        "Cloudinary upload failed:",
        result
      );

      return Response.json(
        {
          success: false,

          error:
            result?.error
              ?.message ||
            "Cloudinary upload failed.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // 12. SUCCESS
    // ========================================================

    return Response.json({
      success: true,

      image: {
        url:
          result.secure_url,

        publicId:
          result.public_id,

        width:
          result.width,

        height:
          result.height,

        format:
          result.format,
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