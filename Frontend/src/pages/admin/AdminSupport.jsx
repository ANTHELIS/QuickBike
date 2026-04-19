import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;
const ah = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

const STATUS_COLORS = {
  open: "bg-orange-500/15 text-orange-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-slate-600/40 text-slate-500",
};
const PRIORITY_COLORS = {
  low: "text-slate-400",
  normal: "text-slate-300",
  high: "text-yellow-400",
  urgent: "text-red-400",
};
const CATEGORY_ICONS = {
  "Ride Issue": "fa-car",
  Payment: "fa-credit-card",
  Account: "fa-user",
  Safety: "fa-shield-halved",
  Other: "fa-circle-info",
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminSupport = () => {
  // List state
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail / reply state
  const [selected, setSelected] = useState(null); // full ticket
  const [loadingDetail, setLD] = useState(false);
  const [replyText, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [noteText, setNote] = useState("");
  const [toast, setToast] = useState("");

  const LIMIT = 15;

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/support/admin/stats`, {
        headers: ah(),
      });
      setStats(res.data.data);
    } catch {}
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/support/admin/tickets`, {
        headers: ah(),
        params: {
          status: statusFilter === "all" ? undefined : statusFilter,
          page,
          limit: LIMIT,
          search: search || undefined,
        },
      });
      const d = res.data.data ?? res.data;
      setTickets(d.data || []);
      setTotal(d.total || 0);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, search]);

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, [fetchStats, fetchTickets]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(""), 3000);
  };

  const openTicket = async (t) => {
    setLD(true);
    setSelected(null);
    setReply("");
    setNote(t.adminNote || "");
    try {
      const res = await axios.get(
        `${BASE}/support/admin/tickets/${t.ticketId}`,
        { headers: ah() },
      );
      setSelected(res.data.data);
    } catch {
      setSelected(t);
    } finally {
      setLD(false);
    }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      await axios.patch(
        `${BASE}/support/admin/tickets/${ticketId}/status`,
        { status, adminNote: noteText },
        { headers: ah() },
      );
      showToast(`Status updated to "${status}"`);
      setSelected((prev) =>
        prev ? { ...prev, status, adminNote: noteText } : prev,
      );
      setTickets((ts) =>
        ts.map((t) => (t.ticketId === ticketId ? { ...t, status } : t)),
      );
      fetchStats();
    } catch (e) {
      showToast(e.response?.data?.message || "Update failed", false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      await axios.post(
        `${BASE}/support/admin/tickets/${selected.ticketId}/reply`,
        { message: replyText },
        { headers: ah() },
      );
      showToast("Reply sent!");
      setReply("");
      // Refresh detail
      const res = await axios.get(
        `${BASE}/support/admin/tickets/${selected.ticketId}`,
        { headers: ah() },
      );
      setSelected(res.data.data);
      // Promote to in_progress if still open
      if (selected.status === "open") {
        setSelected((prev) => ({ ...prev, status: "in_progress" }));
        setTickets((ts) =>
          ts.map((t) =>
            t.ticketId === selected.ticketId
              ? { ...t, status: "in_progress" }
              : t,
          ),
        );
      }
    } catch (e) {
      showToast(e.response?.data?.message || "Reply failed", false);
    } finally {
      setSending(false);
    }
  };

  const userName = (u) => {
    if (!u) return "—";
    return (
      `${u.fullname?.firstname || ""} ${u.fullname?.lastname || ""}`.trim() ||
      u.email ||
      "—"
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-screen p-0">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-all ${toast.ok !== false ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── LEFT PANEL: ticket list ── */}
      <div
        className={`${selected ? "hidden lg:flex" : "flex"} lg:w-[420px] w-full shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 overflow-hidden`}
      >
        {/* Header + Stats */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-black text-white mb-4">Support Inbox</h1>

          {stats && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Open", val: stats.open, color: "text-orange-400" },
                {
                  label: "Active",
                  val: stats.in_progress,
                  color: "text-blue-400",
                },
                {
                  label: "Resolved",
                  val: stats.resolved,
                  color: "text-emerald-400",
                },
                { label: "Urgent", val: stats.urgent, color: "text-red-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-slate-900 rounded-xl p-2.5 text-center border border-slate-800"
                >
                  <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="px-4 pt-3 pb-2 space-y-2">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search tickets…"
              className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-orange-500/50 transition"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition ${statusFilter === s ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                {s === "in_progress"
                  ? "Active"
                  : s === "all"
                    ? "All"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-3.5 border-b border-slate-800/50 animate-pulse"
                >
                  <div className="h-3 bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-slate-800 rounded w-1/2" />
                </div>
              ))
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-slate-600 text-sm">
              <i className="fa-solid fa-inbox text-3xl mb-3 block" />
              No tickets found
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => openTicket(t)}
                className={`px-4 py-3.5 border-b border-slate-800/50 cursor-pointer transition-colors ${selected?.ticketId === t.ticketId ? "bg-slate-800" : "hover:bg-slate-900"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <i
                      className={`fa-solid ${CATEGORY_ICONS[t.category] || "fa-circle-info"} text-slate-500 text-xs shrink-0`}
                    />
                    <p className="text-white text-xs font-semibold truncate">
                      {t.subject}
                    </p>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[t.status]}`}
                  >
                    {t.status === "in_progress" ? "Active" : t.status}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] truncate mb-1.5">
                  {t.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[10px] font-medium">
                    {userName(t.user)} · {t.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {t.replies?.length > 0 && (
                      <span className="text-slate-600 text-[10px]">
                        <i className="fa-regular fa-comment mr-0.5" />
                        {t.replies.length}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-bold uppercase ${PRIORITY_COLORS[t.priority]}`}
                    >
                      {t.priority !== "normal" && t.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-slate-950">
            <span className="text-slate-600 text-[10px]">{total} total</span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-xs disabled:opacity-40"
              >
                ←
              </button>
              <button
                disabled={page * LIMIT >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-xs disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: ticket detail + reply ── */}
      <div
        className={`${selected ? "flex" : "hidden lg:flex"} flex-1 flex-col overflow-y-auto bg-slate-950`}
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center h-full">
            <i className="fa-solid fa-circle-notch fa-spin text-orange-500 text-2xl" />
          </div>
        ) : !selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <i className="fa-solid fa-headset text-slate-500 text-xl" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">
              Select a ticket to view
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Click any ticket on the left to open it
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            {/* Back button — mobile only */}
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 lg:hidden"
            >
              <i className="fa-solid fa-arrow-left" /> Back to tickets
            </button>

            {/* Ticket header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-orange-400 text-xs font-black bg-orange-500/10 px-2 py-0.5 rounded">
                    #{selected.ticketId}
                  </code>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase ${PRIORITY_COLORS[selected.priority]}`}
                  >
                    {selected.priority}
                  </span>
                </div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {selected.subject}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-slate-400 text-xs">
                  <span>
                    <i className="fa-solid fa-user mr-1.5" />
                    {userName(selected.user)}
                  </span>
                  <span>
                    <i className="fa-regular fa-envelope mr-1.5" />
                    {selected.user?.email || "—"}
                  </span>
                  <span>
                    <i className="fa-regular fa-clock mr-1.5" />
                    {fmtDate(selected.createdAt)}
                  </span>
                </div>
              </div>

              {/* Status controls */}
              <div className="flex gap-2 shrink-0">
                {["open", "in_progress", "resolved", "closed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.ticketId, s)}
                    disabled={selected.status === s}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition disabled:opacity-40 ${
                      selected.status === s
                        ? "bg-slate-700 text-slate-300 cursor-default"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {s === "in_progress" ? "Active" : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Original message */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  {selected.category}
                </span>
                <span className="text-slate-600 text-[10px]">
                  Original message
                </span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                {selected.message}
              </p>
            </div>

            {/* Thread replies */}
            {selected.replies?.length > 0 && (
              <div className="space-y-3 mb-5">
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                  {selected.replies.length}{" "}
                  {selected.replies.length === 1 ? "Reply" : "Replies"}
                </p>
                {selected.replies.map((r, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${r.sentBy === "admin" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${r.sentBy === "admin" ? "bg-orange-500/20 text-orange-400" : "bg-slate-700 text-slate-300"}`}
                    >
                      {r.sentBy === "admin" ? "A" : "U"}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-sm ${r.sentBy === "admin" ? "bg-orange-500/10 border border-orange-500/20 text-white rounded-tr-sm" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm"}`}
                    >
                      <p className="leading-relaxed">{r.message}</p>
                      <p
                        className={`text-[10px] mt-1.5 ${r.sentBy === "admin" ? "text-orange-400/60" : "text-slate-500"}`}
                      >
                        {r.senderName} · {fmtDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin note */}
            <div className="mb-5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">
                Internal Note (not visible to user)
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Add internal notes about this ticket…"
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-4 py-3 outline-none focus:border-slate-600 resize-none"
              />
            </div>

            {/* Reply box */}
            {selected.status !== "closed" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                  Reply to user
                </p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Type your response to the user…"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-orange-500/50 resize-none mb-3"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => updateStatus(selected.ticketId, "resolved")}
                    className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition"
                  >
                    <i className="fa-solid fa-check mr-1.5" />
                    Mark Resolved
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin mr-1.5" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane mr-1.5" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
