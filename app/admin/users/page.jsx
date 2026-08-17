"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  ShoppingBag,
  IndianRupee,
  CalendarDays,
  Clock3,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

function formatPrice(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(
      value
    ).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getInitials(name) {
  const value = String(
    name || ""
  ).trim();

  if (!value) {
    return "U";
  }

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join("");
}

function normalizeRole(role) {
  const value = String(
    role || "customer"
  )
    .trim()
    .toLowerCase();

  if (
    value === "admin" ||
    value === "owner" ||
    value === "staff" ||
    value === "customer"
  ) {
    return value;
  }

  return "customer";
}

function getRoleLabel(role) {
  const normalized =
    normalizeRole(role);

  return (
    normalized
      .charAt(0)
      .toUpperCase() +
    normalized.slice(1)
  );
}

function getStatusClass(isActive) {
  return isActive
    ? "bg-green-50 text-green-700"
    : "bg-red-50 text-red-700";
}

function getRoleClass(role) {
  switch (
    normalizeRole(role)
  ) {
    case "admin":
      return "bg-purple-50 text-purple-700";

    case "owner":
      return "bg-amber-50 text-amber-700";

    case "staff":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-[#F5F0E8] text-[#6B6258]";
  }
}

// ============================================================
// PAGE
// ============================================================

export default function AdminUsersPage() {
  const [users, setUsers] =
    useState([]);

  const [counts, setCounts] =
    useState({
      total: 0,
      customers: 0,
      admins: 0,
      active: 0,
      inactive: 0,
    });

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [isLoadingUser, setIsLoadingUser] =
    useState(false);

  const [updatingUser, setUpdatingUser] =
    useState(null);

  // ==========================================================
  // LOAD USERS
  // ==========================================================

  const loadUsers =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        try {
          if (silent) {
            setIsRefreshing(true);
          } else {
            setIsLoading(true);
          }

          setError("");

          const params =
            new URLSearchParams();

          if (search.trim()) {
            params.set(
              "search",
              search.trim()
            );
          }

          /*
           * Current backend supports customer/admin
           * role filtering. Owner/staff support can be
           * enabled here automatically once the API
           * accepts those roles.
           */
          if (
            roleFilter !== "all"
          ) {
            params.set(
              "role",
              roleFilter
            );
          }

          if (
            statusFilter !== "all"
          ) {
            params.set(
              "status",
              statusFilter
            );
          }

          params.set(
            "page",
            String(page)
          );

          params.set(
            "limit",
            "20"
          );

          const response =
            await fetch(
              `/api/admin/users?${params.toString()}`,
              {
                method: "GET",
                credentials:
                  "include",
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load users."
            );
          }

          setUsers(
            Array.isArray(
              data.users
            )
              ? data.users
              : []
          );

          setCounts(
            data.counts || {
              total: 0,
              customers: 0,
              admins: 0,
              active: 0,
              inactive: 0,
            }
          );

          setPagination(
            data.pagination || {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            }
          );
        } catch (error) {
          console.error(
            "Admin users error:",
            error
          );

          setError(
            error.message ||
              "Unable to load users."
          );
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      [
        page,
        search,
        roleFilter,
        statusFilter,
      ]
    );

  // ==========================================================
  // INITIAL / FILTER LOAD
  // ==========================================================

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ==========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================================

  useEffect(() => {
    setPage(1);
  }, [
    search,
    roleFilter,
    statusFilter,
  ]);

  // ==========================================================
  // VIEW USER
  // ==========================================================

  async function openUser(user) {
    try {
      setIsLoadingUser(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/users/${encodeURIComponent(
            user._id
          )}`,
          {
            method: "GET",
            credentials:
              "include",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load user."
        );
      }

      setSelectedUser({
        ...data.user,
        recentOrders:
          data.recentOrders ||
          [],
      });
    } catch (error) {
      console.error(
        "View user error:",
        error
      );

      setError(
        error.message ||
          "Unable to load user."
      );
    } finally {
      setIsLoadingUser(false);
    }
  }

  // ==========================================================
  // CLOSE USER
  // ==========================================================

  function closeUser() {
    if (updatingUser) {
      return;
    }

    setSelectedUser(null);
  }

  // ==========================================================
  // TOGGLE ACTIVE
  // ==========================================================

  async function toggleUser(user) {
    if (updatingUser) {
      return;
    }

    const nextStatus =
      !user.isActive;

    const action =
      nextStatus
        ? "activate"
        : "deactivate";

    const confirmed =
      window.confirm(
        `${
          action === "activate"
            ? "Activate"
            : "Deactivate"
        } "${user.name || user.email}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingUser(
        user._id
      );

      setError("");

      const response =
        await fetch(
          `/api/admin/users/${encodeURIComponent(
            user._id
          )}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body: JSON.stringify({
              isActive:
                nextStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update user."
        );
      }

      setUsers(
        (current) =>
          current.map(
            (item) =>
              item._id ===
              user._id
                ? {
                    ...item,
                    ...data.user,
                  }
                : item
          )
      );

      setCounts(
        (current) => ({
          ...current,

          active:
            nextStatus
              ? current.active + 1
              : Math.max(
                  0,
                  current.active - 1
                ),

          inactive:
            nextStatus
              ? Math.max(
                  0,
                  current.inactive - 1
                )
              : current.inactive + 1,
        })
      );

      if (
        selectedUser?._id ===
        user._id
      ) {
        setSelectedUser(
          (current) =>
            current
              ? {
                  ...current,
                  ...data.user,
                }
              : current
        );
      }
    } catch (error) {
      console.error(
        "Toggle user error:",
        error
      );

      setError(
        error.message ||
          "Unable to update user."
      );
    } finally {
      setUpdatingUser(
        null
      );
    }
  }

  const hasUsers =
    users.length > 0;

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      <div className="mx-auto max-w-375 px-4 py-6 sm:px-6 md:px-8 lg:px-10">
        {/* HEADER */}

        <header className="mb-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
                Administration
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#171513] sm:text-4xl">
                Users & Customers
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-[#6B6258]">
                Manage customer accounts,
                staff accounts and account
                activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadUsers({
                  silent: true,
                })
              }
              disabled={
                isRefreshing
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-2.5 text-sm font-medium text-[#171513] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* STATS */}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Users}
            label="Total Users"
            value={counts.total}
          />

          <StatCard
            icon={UserCheck}
            label="Customers"
            value={counts.customers}
          />

          <StatCard
            icon={ShieldCheck}
            label="Admins"
            value={counts.admins}
          />

          <StatCard
            icon={UserCheck}
            label="Active"
            value={counts.active}
          />

          <StatCard
            icon={UserX}
            label="Inactive"
            value={counts.inactive}
          />
        </section>

        {/* FILTER BAR */}

        <section className="mb-5 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8177]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search name, email or phone..."
                className="w-full rounded-xl border border-[#DED6C9] bg-[#F5F0E8]/40 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#8A8177] focus:border-[#171513]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-[#DED6C9] bg-[#F5F0E8]/40 px-4 py-3 text-sm outline-none focus:border-[#171513]"
            >
              <option value="all">
                All Roles
              </option>

              <option value="customer">
                Customers
              </option>

              <option value="admin">
                Admins
              </option>

              <option value="owner">
                Owners
              </option>

              <option value="staff">
                Staff
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-[#DED6C9] bg-[#F5F0E8]/40 px-4 py-3 text-sm outline-none focus:border-[#171513]"
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          {(roleFilter ===
            "owner" ||
            roleFilter ===
              "staff") && (
            <p className="mt-3 rounded-xl bg-[#FFF7E8] px-3 py-2 text-xs text-[#8A5A00]">
              Owner/Staff filtering requires
              the corresponding backend role
              filter to be enabled.
            </p>
          )}
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-3xl border border-[#E5DED2] bg-[#FFFDF8]">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-2xl bg-[#F5F0E8]"
                  />
                )
              )}
            </div>
          ) : !hasUsers ? (
            <div className="px-5 py-20 text-center">
              <Users
                size={34}
                className="mx-auto text-[#B8AFA4]"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No users found
              </h2>

              <p className="mt-2 text-sm text-[#6B6258]">
                Try changing your search
                or filters.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5DED2] text-left">
                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                        User
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                        Contact
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                        Role
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                        Orders
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                        Spent
                      </th>

                      <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                        Last Login
                      </th>

                      <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map(
                      (user) => (
                        <UserRow
                          key={
                            user._id
                          }
                          user={user}
                          updatingUser={
                            updatingUser
                          }
                          onView={
                            openUser
                          }
                          onToggle={
                            toggleUser
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="divide-y divide-[#E5DED2] lg:hidden">
                {users.map(
                  (user) => (
                    <div
                      key={
                        user._id
                      }
                      className="p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={
                            user.name
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[#171513]">
                              {user.name ||
                                "Unnamed User"}
                            </p>

                            <span
                              className={`rounded-full px-2 py-1 text-[9px] font-semibold ${getRoleClass(
                                user.role
                              )}`}
                            >
                              {getRoleLabel(
                                user.role
                              )}
                            </span>

                            <span
                              className={`rounded-full px-2 py-1 text-[9px] font-semibold ${getStatusClass(
                                user.isActive
                              )}`}
                            >
                              {user.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-[#6B6258]">
                            {user.email}
                          </p>

                          {user.phone && (
                            <p className="mt-1 text-xs text-[#8A8177]">
                              {user.phone}
                            </p>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-[#F5F0E8] p-3">
                              <p className="text-[9px] uppercase tracking-wider text-[#8A8177]">
                                Orders
                              </p>

                              <p className="mt-1 text-sm font-semibold">
                                {user.orderCount ||
                                  0}
                              </p>
                            </div>

                            <div className="rounded-xl bg-[#F5F0E8] p-3">
                              <p className="text-[9px] uppercase tracking-wider text-[#8A8177]">
                                Spent
                              </p>

                              <p className="mt-1 text-sm font-semibold">
                                {formatPrice(
                                  user.totalSpent
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openUser(
                                  user
                                )
                              }
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#171513] px-3 py-2.5 text-xs font-semibold text-white"
                            >
                              <Eye
                                size={14}
                              />

                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleUser(
                                  user
                                )
                              }
                              disabled={
                                updatingUser ===
                                user._id
                              }
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#DED6C9] bg-white px-3 py-2.5 text-xs font-semibold disabled:opacity-40"
                            >
                              {user.isActive ? (
                                <EyeOff
                                  size={14}
                                />
                              ) : (
                                <Eye
                                  size={14}
                                />
                              )}

                              {user.isActive
                                ? "Disable"
                                : "Activate"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* PAGINATION */}

          {!isLoading &&
            hasUsers && (
              <div className="flex flex-col gap-3 border-t border-[#E5DED2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#6B6258]">
                  Showing{" "}
                  {users.length} of{" "}
                  {
                    pagination.total
                  }{" "}
                  users
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                      )
                    }
                    disabled={
                      !pagination.hasPreviousPage
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DED6C9] bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  <span className="min-w-20 text-center text-xs font-medium">
                    Page{" "}
                    {
                      pagination.page
                    }{" "}
                    /{" "}
                    {
                      pagination.totalPages
                    }
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1
                      )
                    }
                    disabled={
                      !pagination.hasNextPage
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DED6C9] bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      {/* USER DETAIL MODAL */}

      {(selectedUser ||
        isLoadingUser) && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#FFFDF8] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5DED2] bg-[#FFFDF8] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
                  User Details
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {selectedUser?.name ||
                    "User"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeUser
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DED6C9]"
              >
                <X size={17} />
              </button>
            </div>

            {isLoadingUser ? (
              <div className="space-y-4 p-6">
                <div className="h-24 animate-pulse rounded-2xl bg-[#F5F0E8]" />

                <div className="h-32 animate-pulse rounded-2xl bg-[#F5F0E8]" />

                <div className="h-48 animate-pulse rounded-2xl bg-[#F5F0E8]" />
              </div>
            ) : selectedUser ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-col gap-4 rounded-2xl bg-[#F5F0E8] p-4 sm:flex-row sm:items-center">
                  <Avatar
                    name={
                      selectedUser.name
                    }
                    large
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">
                      {selectedUser.name ||
                        "Unnamed User"}
                    </h3>

                    <p className="mt-1 break-all text-sm text-[#6B6258]">
                      {
                        selectedUser.email
                      }
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getRoleClass(
                          selectedUser.role
                        )}`}
                      >
                        {getRoleLabel(
                          selectedUser.role
                        )}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                          selectedUser.isActive
                        )}`}
                      >
                        {selectedUser.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleUser(
                        selectedUser
                      )
                    }
                    disabled={
                      updatingUser ===
                      selectedUser._id
                    }
                    className="rounded-xl border border-[#DED6C9] bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
                  >
                    {selectedUser.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    icon={Mail}
                    label="Email"
                    value={
                      selectedUser.email ||
                      "—"
                    }
                  />

                  <InfoCard
                    icon={Phone}
                    label="Phone"
                    value={
                      selectedUser.phone ||
                      "—"
                    }
                  />

                  <InfoCard
                    icon={CalendarDays}
                    label="Joined"
                    value={formatDate(
                      selectedUser.createdAt
                    )}
                  />

                  <InfoCard
                    icon={Clock3}
                    label="Last Login"
                    value={formatDate(
                      selectedUser.lastLoginAt
                    )}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#E5DED2] p-4">
                    <div className="flex items-center gap-2 text-[#6B6258]">
                      <ShoppingBag
                        size={16}
                      />

                      <span className="text-xs">
                        Total Orders
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        selectedUser.orderCount
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E5DED2] p-4">
                    <div className="flex items-center gap-2 text-[#6B6258]">
                      <IndianRupee
                        size={16}
                      />

                      <span className="text-xs">
                        Total Spent
                      </span>
                    </div>

                    <p className="mt-2 text-2xl font-semibold">
                      {formatPrice(
                        selectedUser.totalSpent
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Recent Orders
                    </h3>

                    <span className="text-xs text-[#8A8177]">
                      Last 10
                    </span>
                  </div>

                  {selectedUser
                    .recentOrders
                    ?.length ? (
                    <div className="overflow-hidden rounded-2xl border border-[#E5DED2]">
                      <div className="divide-y divide-[#E5DED2]">
                        {selectedUser.recentOrders.map(
                          (order) => (
                            <div
                              key={
                                order._id
                              }
                              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-xs font-semibold">
                                  #
                                  {
                                    order.orderNumber
                                  }
                                </p>

                                <p className="mt-1 text-[10px] text-[#8A8177]">
                                  Table{" "}
                                  {
                                    order.tableId
                                  }{" "}
                                  ·{" "}
                                  {formatDate(
                                    order.createdAt
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-[#F5F0E8] px-2.5 py-1 text-[9px] font-semibold capitalize">
                                  {
                                    order.status
                                  }
                                </span>

                                <span className="text-xs font-semibold">
                                  {formatPrice(
                                    order.total
                                  )}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#F5F0E8] px-4 py-8 text-center">
                      <ShoppingBag
                        size={25}
                        className="mx-auto text-[#B8AFA4]"
                      />

                      <p className="mt-2 text-sm font-medium">
                        No orders yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F0E8]">
          <Icon
            size={17}
            className="text-[#6B6258]"
          />
        </div>

        <span className="text-[10px] uppercase tracking-wider text-[#8A8177]">
          {label}
        </span>
      </div>

      <p className="mt-4 text-2xl font-semibold text-[#171513]">
        {Number(
          value || 0
        ).toLocaleString(
          "en-IN"
        )}
      </p>
    </div>
  );
}

// ============================================================
// AVATAR
// ============================================================

function Avatar({
  name,
  large = false,
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#171513] font-semibold text-white ${
        large
          ? "h-16 w-16 text-lg"
          : "h-10 w-10 text-xs"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

// ============================================================
// USER ROW
// ============================================================

function UserRow({
  user,
  updatingUser,
  onView,
  onToggle,
}) {
  return (
    <tr className="border-b border-[#E5DED2] last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={user.name}
          />

          <div className="min-w-0">
            <p className="max-w-55 truncate text-sm font-semibold">
              {user.name ||
                "Unnamed User"}
            </p>

            <p className="max-w-55 truncate text-xs text-[#8A8177]">
              Joined{" "}
              {formatDate(
                user.createdAt
              )}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="max-w-60">
          <p className="truncate text-xs text-[#171513]">
            {user.email}
          </p>

          {user.phone && (
            <p className="mt-1 text-[11px] text-[#8A8177]">
              {user.phone}
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-col items-start gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${getRoleClass(
              user.role
            )}`}
          >
            {getRoleLabel(
              user.role
            )}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${getStatusClass(
              user.isActive
            )}`}
          >
            {user.isActive
              ? "Active"
              : "Inactive"}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold">
          {user.orderCount || 0}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold">
          {formatPrice(
            user.totalSpent
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-xs text-[#6B6258]">
          {formatDate(
            user.lastLoginAt
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              onView(user)
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DED6C9] bg-white transition hover:bg-[#F5F0E8]"
            title="View user"
          >
            <Eye size={15} />
          </button>

          <button
            type="button"
            onClick={() =>
              onToggle(user)
            }
            disabled={
              updatingUser ===
              user._id
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DED6C9] bg-white transition hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:opacity-40"
            title={
              user.isActive
                ? "Deactivate"
                : "Activate"
            }
          >
            {user.isActive ? (
              <EyeOff size={15} />
            ) : (
              <Eye size={15} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-[#E5DED2] p-4">
      <div className="flex items-center gap-2 text-[#8A8177]">
        <Icon size={15} />

        <span className="text-[10px] uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 break-all text-sm font-medium text-[#171513]">
        {value}
      </p>
    </div>
  );
                      }
