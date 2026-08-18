"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  ChevronDown,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";

// ============================================================
// ROLE CONFIG
// ============================================================

const ROLE_CONFIG = {
  customer: {
    label: "Customer",
    description:
      "Default customer account.",
  },

  staff: {
    label: "Staff",
    description:
      "Can manage products and orders.",
  },

  owner: {
    label: "Owner",
    description:
      "Full restaurant management access except Admin role management.",
  },

  admin: {
    label: "Admin",
    description:
      "Full restaurant administration access.",
  },
};

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
  value
) {
  if (!value) {
    return "Never";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle:
          "medium",
        timeStyle:
          "short",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "—";
  }
}

// ============================================================
// TOAST
// ============================================================

function Toast({
  toast,
  onClose,
}) {
  if (!toast) {
    return null;
  }

  const isError =
    toast.type ===
    "error";

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-[calc(100%-40px)] max-w-sm">
      <div
        className={[
          "flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl",
          isError
            ? "border-red-200"
            : "border-green-200",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isError
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600",
          ].join(" ")}
        >
          {isError ? (
            <AlertCircle
              size={17}
            />
          ) : (
            <Check
              size={17}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {isError
              ? "Something went wrong"
              : "Updated successfully"}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#6B6258]">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          className="rounded-lg p-1 text-[#8B8176] hover:bg-[#F5F0E8]"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AdminSettingsPage() {
  // ==========================================================
  // CURRENT USER
  // ==========================================================

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    loadingCurrentUser,
    setLoadingCurrentUser,
  ] = useState(true);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    allowedRoles,
    setAllowedRoles,
  ] = useState([]);

  const [
    selectedRole,
    setSelectedRole,
  ] = useState("");

  // ==========================================================
  // LOADING
  // ==========================================================

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    updating,
    setUpdating,
  ] = useState(false);

  // ==========================================================
  // TOAST
  // ==========================================================

  const [
    toast,
    setToast,
  ] = useState(null);

  // ==========================================================
  // LOAD CURRENT USER
  // ==========================================================
  //
  // We intentionally use the existing authenticated
  // user endpoint rather than creating another auth system.
  //
  // If your project already exposes a different current-user
  // endpoint, only this function needs to be changed.
  //

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    setLoadingCurrentUser(
      true
    );

    try {
      const response =
        await fetch(
          "/api/auth/me",
          {
            method: "GET",

            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin/cafeadmin/login";

        return;
      }

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            "Unable to load account."
        );
      }

      setCurrentUser(
        data.user ||
          data
      );
    } catch (error) {
      console.error(
        "Current user error:",
        error
      );

      /*
       * Don't block the entire Settings page if
       * your project uses a different current-user
       * endpoint. Role management remains protected
       * by the server API.
       */
    } finally {
      setLoadingCurrentUser(
        false
      );
    }
  }

  // ==========================================================
  // SHOW TOAST
  // ==========================================================

  function showToast(
    message,
    type = "success"
  ) {
    setToast({
      message,
      type,
    });

    window.setTimeout(
      () => {
        setToast(null);
      },
      3500
    );
  }

  // ==========================================================
  // FIND USER
  // ==========================================================

  async function findUser() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      showToast(
        "Enter a registered user email address.",
        "error"
      );

      return;
    }

    setSearching(true);

    setUser(null);
    setAllowedRoles([]);
    setSelectedRole("");

    try {
      const response =
        await fetch(
          `/api/admin/settings/users?email=${encodeURIComponent(
            cleanEmail
          )}`,
          {
            method: "GET",

            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin/cafeadmin/login";

        return;
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            "Unable to find user."
        );
      }

      setUser(
        data.user
      );

      const roles =
        Array.isArray(
          data.allowedRoles
        )
          ? data.allowedRoles
          : [];

      setAllowedRoles(
        roles
      );

      /*
       * Don't automatically select a different
       * role. Show the user's current role first.
       */
      setSelectedRole(
        data.user?.role ||
          ""
      );
    } catch (error) {
      console.error(
        "Find user error:",
        error
      );

      showToast(
        error?.message ||
          "Unable to find user.",
        "error"
      );
    } finally {
      setSearching(
        false
      );
    }
  }

  // ==========================================================
  // UPDATE ROLE
  // ==========================================================

  async function updateRole() {
    if (
      !user ||
      !selectedRole
    ) {
      return;
    }

    if (
      !allowedRoles.includes(
        selectedRole
      )
    ) {
      showToast(
        "You are not allowed to assign this role.",
        "error"
      );

      return;
    }

    if (
      user.role ===
      selectedRole
    ) {
      showToast(
        "The user already has this role.",
        "error"
      );

      return;
    }

    setUpdating(
      true
    );

    try {
      const response =
        await fetch(
          "/api/admin/settings/users",
          {
            method: "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  user.email,

                role:
                  selectedRole,
              }),
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (
        response.status ===
        401
      ) {
        window.location.href =
          "/admin/cafeadmin/login";

        return;
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            "Unable to update user role."
        );
      }

      // ------------------------------------------------------
      // UPDATE UI IMMEDIATELY
      // ------------------------------------------------------

      if (data.user) {
        setUser(
          data.user
        );
      } else {
        setUser(
          (previous) => ({
            ...previous,

            role:
              selectedRole,
          })
        );
      }

      // ------------------------------------------------------
      // TOAST
      // ------------------------------------------------------

      showToast(
        data.message ||
          "User role updated successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Update role error:",
        error
      );

      showToast(
        error?.message ||
          "Unable to update user role.",
        "error"
      );
    } finally {
      setUpdating(
        false
      );
    }
  }

  // ==========================================================
  // CLEAR
  // ==========================================================

  function clearSearch() {
    setUser(null);
    setAllowedRoles([]);
    setSelectedRole("");
    setEmail("");
  }

  // ==========================================================
  // ROLE
  // ==========================================================

  const currentRole =
    currentUser?.role ||
    "customer";

  const currentRoleConfig =
    ROLE_CONFIG[
      currentRole
    ] ||
    ROLE_CONFIG.customer;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <main className="min-h-screen bg-[#F5F0E8] text-[#171513]">
        <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-7 lg:px-10 lg:py-9">
          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="border-b border-[#DDD4C7] pb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B83A2E]">
              Cafe Administration
            </p>

            <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                  Settings
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#6D645A]">
                  Manage your account access and
                  restaurant user roles.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DED5C8] bg-[#FFFDF8] px-4 py-2 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500" />

                System active
              </div>
            </div>
          </header>

          {/* ==================================================
              ACCOUNT
          ================================================== */}

          <section className="mt-7">
            <div className="mb-3 flex items-center gap-2">
              <User
                size={16}
                className="text-[#B83A2E]"
              />

              <h2 className="text-xs font-bold uppercase tracking-[0.17em] text-[#756C62]">
                My Account
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#DED5C8] bg-[#FFFDF8]">
              <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                {/* NAME */}

                <AccountItem
                  label="Name"
                  value={
                    loadingCurrentUser
                      ? "Loading..."
                      : currentUser?.name ||
                        "Not provided"
                  }
                  icon={
                    <User
                      size={17}
                    />
                  }
                />

                {/* EMAIL */}

                <AccountItem
                  label="Email"
                  value={
                    loadingCurrentUser
                      ? "Loading..."
                      : currentUser?.email ||
                        "Not available"
                  }
                  icon={
                    <Mail
                      size={17}
                    />
                  }
                />

                {/* PHONE */}

                <AccountItem
                  label="Phone"
                  value={
                    loadingCurrentUser
                      ? "Loading..."
                      : currentUser?.phone ||
                        "Not provided"
                  }
                  icon={
                    <span className="text-sm font-bold">
                      #
                    </span>
                  }
                />

                {/* ROLE */}

                <AccountItem
                  label="Role"
                  value={
                    ROLE_CONFIG[
                      currentRole
                    ]?.label ||
                    currentRole
                  }
                  icon={
                    <Shield
                      size={17}
                    />
                  }
                  highlight
                />
              </div>

              <div className="border-t border-[#E5DDD2] bg-[#F8F3EB] px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#756C62]">
                    {currentRoleConfig.description}
                  </p>

                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em]">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                    Active account
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              ROLE MANAGEMENT
          ================================================== */}

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users
                  size={16}
                  className="text-[#B83A2E]"
                />

                <h2 className="text-xs font-bold uppercase tracking-[0.17em] text-[#756C62]">
                  User Access
                </h2>
              </div>

              <span className="text-[11px] text-[#91877C]">
                Role management
              </span>
            </div>

            <div className="rounded-3xl border border-[#DED5C8] bg-[#FFFDF8] p-5 sm:p-7">
              <div className="max-w-2xl">
                <h3 className="text-xl font-semibold tracking-[-0.025em]">
                  Promote a user
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-[#6D645A]">
                  Search for an existing customer by
                  their registered email address and
                  assign an appropriate restaurant role.
                </p>
              </div>

              {/* SEARCH */}

              <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B9084]"
                  />

                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target
                          .value
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        findUser();
                      }
                    }}
                    placeholder="Enter registered email address"
                    className="h-12 w-full rounded-xl border border-[#DCD3C7] bg-[#FFFDF8] pl-11 pr-4 text-sm outline-none transition placeholder:text-[#A39A90] focus:border-[#B83A2E] focus:ring-2 focus:ring-[#B83A2E]/10"
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    findUser
                  }
                  disabled={
                    searching
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#171513] px-6 text-sm font-semibold text-white transition hover:bg-[#B83A2E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searching ? (
                    <>
                      <RefreshCw
                        size={
                          16
                        }
                        className="animate-spin"
                      />

                      Finding...
                    </>
                  ) : (
                    <>
                      <Search
                        size={
                          16
                        }
                      />

                      Find User
                    </>
                  )}
                </button>
              </div>

              {/* USER */}

              {user && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-[#DED5C8] bg-[#F8F3EB]">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#171513] text-white">
                        <User
                          size={19}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {user.name ||
                            "Unnamed User"}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#756C62]">
                          {user.email}
                        </p>

                        {user.phone && (
                          <p className="mt-0.5 text-xs text-[#91877C]">
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#9A9085]">
                          Current role
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {ROLE_CONFIG[
                            user.role
                          ]?.label ||
                            user.role}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          clearSearch
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCD3C7] bg-white text-[#756C62] transition hover:border-[#B83A2E] hover:text-[#B83A2E]"
                        title="Clear user"
                      >
                        <X
                          size={
                            16
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {/* ROLE UPDATE */}

                  <div className="border-t border-[#DED5C8] bg-white p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                      <div className="flex-1">
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#756C62]">
                          Assign role
                        </label>

                        <div className="relative">
                          <select
                            value={
                              selectedRole
                            }
                            onChange={(
                              event
                            ) =>
                              setSelectedRole(
                                event
                                  .target
                                  .value
                              )
                            }
                            className="h-12 w-full appearance-none rounded-xl border border-[#DCD3C7] bg-[#FFFDF8] px-4 pr-10 text-sm font-medium outline-none focus:border-[#B83A2E] focus:ring-2 focus:ring-[#B83A2E]/10"
                          >
                            {!selectedRole && (
                              <option value="">
                                Select role
                              </option>
                            )}

                            {allowedRoles.map(
                              (
                                role
                              ) => (
                                <option
                                  key={
                                    role
                                  }
                                  value={
                                    role
                                  }
                                >
                                  {ROLE_CONFIG[
                                    role
                                  ]?.label ||
                                    role}
                                </option>
                              )
                            )}
                          </select>

                          <ChevronDown
                            size={
                              16
                            }
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8479]"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          updateRole
                        }
                        disabled={
                          updating ||
                          !selectedRole ||
                          user.role ===
                            selectedRole
                        }
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#B83A2E] px-7 text-sm font-semibold text-white transition hover:bg-[#171513] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updating ? (
                          <>
                            <RefreshCw
                              size={
                                16
                              }
                              className="animate-spin"
                            />

                            Updating...
                          </>
                        ) : (
                          <>
                            <ShieldCheck
                              size={
                                16
                              }
                            />

                            Update Role
                          </>
                        )}
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] leading-5 text-[#91877C]">
                      Role changes take effect immediately.
                      No confirmation is required.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              PERMISSIONS
          ================================================== */}

          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Shield
                size={16}
                className="text-[#B83A2E]"
              />

              <h2 className="text-xs font-bold uppercase tracking-[0.17em] text-[#756C62]">
                Access Overview
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <RoleCard
                role="Admin"
                description="Complete restaurant administration."
                canAssign={[
                  "Admin",
                  "Owner",
                  "Staff",
                  "Customer",
                ]}
              />

              <RoleCard
                role="Owner"
                description="Restaurant management without Admin privilege control."
                canAssign={[
                  "Owner",
                  "Staff",
                  "Customer",
                ]}
              />

              <RoleCard
                role="Staff"
                description="Operational access only. Settings and customer administration are unavailable."
                canAssign={[]}
              />

              <RoleCard
                role="Customer"
                description="Default customer account with no restaurant administration access."
                canAssign={[]}
              />
            </div>
          </section>

          {/* ==================================================
              ACCOUNT SECURITY
          ================================================== */}

          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck
                size={16}
                className="text-[#B83A2E]"
              />

              <h2 className="text-xs font-bold uppercase tracking-[0.17em] text-[#756C62]">
                Account Information
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                icon={
                  <Clock3
                    size={17}
                  />
                }
                title="Last Login"
                value={
                  formatDate(
                    currentUser?.lastLoginAt
                  )
                }
              />

              <InfoCard
                icon={
                  <Shield
                    size={17}
                  />
                }
                title="Access Level"
                value={
                  currentRoleConfig.label
                }
              />
            </div>
          </section>
        </div>
      </main>

      {/* ======================================================
          TOAST
      ====================================================== */}

      <Toast
        toast={
          toast
        }
        onClose={() =>
          setToast(
            null
          )
        }
      />
    </>
  );
}

// ============================================================
// ACCOUNT ITEM
// ============================================================

function AccountItem({
  label,
  value,
  icon,
  highlight,
}) {
  return (
    <div
      className={[
        "border-b border-[#E5DDD2] p-5 md:border-b-0 md:border-r",
        highlight
          ? "bg-[#FAF4EC]"
          : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 text-[#8B8176]">
        {icon}

        <p className="text-[9px] font-bold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <p className="mt-3 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// ROLE CARD
// ============================================================

function RoleCard({
  role,
  description,
  canAssign,
}) {
  const isRestricted =
    canAssign.length ===
    0;

  return (
    <div className="rounded-2xl border border-[#DED5C8] bg-[#FFFDF8] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#B83A2E]">
            <Shield
              size={16}
            />
          </div>

          <h3 className="font-semibold">
            {role}
          </h3>
        </div>

        <span
          className={[
            "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em]",
            isRestricted
              ? "bg-[#F4E9E7] text-[#B83A2E]"
              : "bg-[#EAF4EA] text-green-700",
          ].join(" ")}
        >
          {isRestricted
            ? "No access"
            : "Can manage"}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#756C62]">
        {description}
      </p>

      {canAssign.length >
        0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {canAssign.map(
            (
              item
            ) => (
              <span
                key={
                  item
                }
                className="rounded-full border border-[#DDD4C7] bg-[#F8F3EB] px-2.5 py-1 text-[10px] font-medium"
              >
                {item}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#DED5C8] bg-[#FFFDF8] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#B83A2E]">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#93897E]">
          {title}
        </p>

        <p className="mt-1 text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}