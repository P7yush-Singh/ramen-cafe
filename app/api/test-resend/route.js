import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function GET() {
  try {
    const testEmail =
      "solo95bgmi@gmail.com";

    const result =
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL,

        to: [testEmail],

        subject:
          "Ramen Cafe - Resend Test",

        html: `
          <div style="font-family: Arial, sans-serif;">
            <h1>Ramen Cafe</h1>

            <p>
              Resend API is working correctly.
            </p>

            <p>
              This is a test email.
            </p>
          </div>
        `,
      });

    return Response.json({
      success: true,

      message:
        "Resend email sent successfully.",

      result,
    });
  } catch (error) {
    console.error(
      "Resend test failed:",
      error
    );

    return Response.json(
      {
        success: false,

        message:
          "Resend email failed.",

        error:
          error.message,

        statusCode:
          error.statusCode || null,
      },
      {
        status: 500,
      }
    );
  }
}