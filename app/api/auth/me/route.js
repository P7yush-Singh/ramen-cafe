import {
  getServerUser,
} from "@/lib/auth-server";

export async function GET() {
  const user =
    await getServerUser();

  if (!user) {
    return Response.json(
      {
        authenticated: false,
        user: null,
      },
      {
        status: 200,
      }
    );
  }

  return Response.json({
    authenticated: true,

    user: {
      id: user._id.toString(),

      name: user.name,

      email: user.email,

      phone: user.phone,

      role: user.role,
    },
  });
}