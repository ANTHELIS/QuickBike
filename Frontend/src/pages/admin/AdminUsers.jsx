import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});
const fmtDate = (iso) =>
  !iso
    ? "—"
    : new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
const COLORS = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-green-500 to-green-700",
  "from-pink-500 to-pink-700",
  "from-teal-500 to-teal-700",
];

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admin/users`,
        {
          params: { page, limit },
          headers: adminHeader(),
        },
      );
      setUsers(res.data.data || res.data.users || []);
      setTotal(res.data.pagination?.total || res.data.total || 0);
    } catch (err) {
      if (err.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [page, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name =
      `${u.fullname?.firstname || ""} ${u.fullname?.lastname || ""}`.toLowerCase();
    return (
      name.includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const totalPages = Math.ceil(total / limit);

  const UserCard = ({ u }) => {
    const name =
      `${u.fullname?.firstname || ""} ${u.fullname?.lastname || ""}`.trim() ||
      "—";
    const colorIdx =
      (u.fullname?.firstname?.charCodeAt(0) || 0) % COLORS.length;
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 bg-gradient-to-br ${COLORS[colorIdx]} rounded-full flex items-center justify-center text-white text-sm font-black shrink-0`}
        >
          {(u.fullname?.firstname?.[0] || "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{name}</p>
          <p className="text-slate-400 text-xs truncate">{u.email || "—"}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-500 text-[10px]">
              {u.phone || "No phone"}
            </span>
            {u.savedPlaces?.length > 0 && (
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                {u.savedPlaces.length} place
                {u.savedPlaces.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <span className="text-slate-500 text-[10px] shrink-0">
          {fmtDate(u.createdAt)}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total} registered passengers
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full sm:w-52 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 bg-slate-800 text-slate-400 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors shrink-0"
          >
            <i className="fa-solid fa-rotate-right" />
            <span className="hidden sm:inline"> Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats — responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          {
            icon: "fa-users",
            label: "Total",
            value: total,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            icon: "fa-user-check",
            label: "This Page",
            value: filtered.length,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            icon: "fa-calendar",
            label: "Page",
            value: `${page}/${totalPages || 1}`,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}
            >
              <i
                className={`fa-solid ${s.icon} ${s.color} text-xs sm:text-sm`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-xs sm:text-sm truncate">
                {s.value}
              </p>
              <p className="text-slate-500 text-[10px] sm:text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {["User", "Email", "Phone", "Saved Places", "Joined"].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <i className="fa-solid fa-users text-slate-700 text-4xl mb-3 block" />
                  <p className="text-slate-500 text-sm">No users found</p>
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const name =
                  `${u.fullname?.firstname || ""} ${u.fullname?.lastname || ""}`.trim() ||
                  "—";
                const colorIdx =
                  (u.fullname?.firstname?.charCodeAt(0) || 0) % COLORS.length;
                return (
                  <tr
                    key={u._id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 bg-gradient-to-br ${COLORS[colorIdx]} rounded-full flex items-center justify-center text-white text-xs font-black shrink-0`}
                        >
                          {(u.fullname?.firstname?.[0] || "?").toUpperCase()}
                        </div>
                        <p className="text-white font-semibold text-sm">
                          {name}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {u.email || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {u.phone || "—"}
                    </td>
                    <td className="px-5 py-4">
                      {(u.savedPlaces?.length || 0) > 0 ? (
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                          {u.savedPlaces.length} place
                          {u.savedPlaces.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {fmtDate(u.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {loading ? (
          Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-800 rounded-xl animate-pulse"
              />
            ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No users found
          </div>
        ) : (
          filtered.map((u) => <UserCard key={u._id} u={u} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-400 text-sm rounded-xl disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 sm:px-4 py-2 bg-slate-800 text-slate-400 text-sm rounded-xl disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
