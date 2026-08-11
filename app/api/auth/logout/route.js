import {
  deleteSession,
} from "@/lib/auth-server";

export async function POST() {
  await deleteSession();

  return Response.json({
    success: true,
  });
}