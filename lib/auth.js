// =====================================================
// GET CURRENT USER
// =====================================================

export async function getCurrentUser() {
  try {
    const response =
      await fetch(
        "/api/auth/me",
        {
          method: "GET",

          credentials:
            "include",

          cache: "no-store",
        }
      );

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    return data.user || null;
  } catch (error) {
    console.error(
      "Unable to get current user:",
      error
    );

    return null;
  }
}

// =====================================================
// CHECK AUTHENTICATION
// =====================================================

export async function isAuthenticated() {
  const user =
    await getCurrentUser();

  return Boolean(user);
}

// =====================================================
// LOGOUT
// =====================================================

export async function logoutUser() {
  try {
    await fetch(
      "/api/auth/logout",
      {
        method: "POST",

        credentials:
          "include",
      }
    );
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );
  }
}

// =====================================================
// LOGIN URL
// =====================================================

export function getLoginUrl(
  redirect = "/"
) {
  return `/login?redirect=${encodeURIComponent(
    redirect
  )}`;
}