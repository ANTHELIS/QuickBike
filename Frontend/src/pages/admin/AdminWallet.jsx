import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;
const ah = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

/* ── small reusable modal ── */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-white font-bold text-base">{title}</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const AdminWallet = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Adjust modal
  const [modal, setModal] = useState(null); // { id, userType, name, balance }
  const [adjAmount, setAdjAmt] = useState("");
  const [adjType, setAdjType] = useState("credit"); // 'credit' | 'debit'
  const [adjNote, setAdjNote] = useState("");
  const [saving, setSaving] = useState(false);

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/api/admin/wallet/balances`, {
        headers: ah(),
        params: {
          type: typeFilter,
          page,
          limit: LIMIT,
          search: search || undefined,
        },
      });
      const d = res.data.data ?? res.data;
      setRows(d.data || d || []);
      setTotal(d.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(""), 3000);
  };

  const openModal = (row) => {
    setModal(row);
    setAdjAmt("");
    setAdjType("credit");
    setAdjNote("");
  };

  const submitAdjust = async () => {
    if (!adjAmount || isNaN(Number(adjAmount)) || Number(adjAmount) <= 0)
      return;
    setSaving(true);
    try {
      const delta =
        adjType === "credit" ? Number(adjAmount) : -Number(adjAmount);
      await axios.post(
        `${BASE}/api/admin/wallet/adjust`,
        {
          userId: modal._id,
          userType: modal.userType,
          amount: delta,
          note: adjNote,
        },
        { headers: ah() },
      );
      showToast(
        `₹${adjAmount} ${adjType}ed to ${modal.name || "user"}'s wallet`,
      );
      setModal(null);
      fetchData();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to adjust wallet", false);
    } finally {
      setSaving(false);
    }
  };

  const name = (r) => {
    const fn = r.fullname?.firstname || "";
    const ln = r.fullname?.lastname || "";
    return `${fn} ${ln}`.trim() || r.email || "—";
  };

  const totalCoins = rows.reduce((acc, r) => acc + (r.wallet?.balance || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl ${toast.ok !== false ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Wallet Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            View &amp; adjust coin balances for users and captains
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 sm:px-5 py-3 text-center self-start sm:self-auto">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
            Total Coins in System
          </p>
          <p className="text-xl sm:text-2xl font-black text-orange-400">
            ₹{totalCoins.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-sm">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email or phone…"
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition"
          />
        </div>
        {["all", "user", "captain"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setPage(1);
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize transition ${typeFilter === t ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {t === "all" ? "All" : t === "user" ? "Users" : "Captains"}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-400 font-semibold px-5 py-3 text-xs uppercase tracking-wider">
                Name
              </th>
              <th className="text-left text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Type
              </th>
              <th className="text-left text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Email
              </th>
              <th className="text-right text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Balance
              </th>
              <th className="text-center text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array(5)
                      .fill(0)
                      .map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-slate-800 rounded animate-pulse" />
                        </td>
                      ))}
                  </tr>
                ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-16">
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.userType === "captain" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}
                      >
                        {name(r).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold">
                        {name(r)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${r.userType === "captain" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}
                    >
                      {r.userType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {r.email || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`font-black text-base ${(r.wallet?.balance || 0) > 0 ? "text-orange-400" : "text-slate-500"}`}
                    >
                      ₹{(r.wallet?.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => openModal({ ...r, name: name(r) })}
                      className="bg-slate-700 hover:bg-orange-500/20 border border-slate-600 hover:border-orange-500/40 text-slate-300 hover:text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    >
                      <i className="fa-solid fa-coins mr-1.5" /> Adjust
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
            <p className="text-slate-500 text-xs hidden sm:block">
              {total} total records · Page {page}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-700 transition"
              >
                ← Prev
              </button>
              <button
                disabled={page * LIMIT >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs disabled:opacity-40 hover:bg-slate-700 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-800 rounded-xl animate-pulse"
              />
            ))
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No records found
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${r.userType === "captain" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}
                >
                  {name(r).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {name(r)}
                  </p>
                  <p className="text-slate-500 text-xs truncate">
                    {r.email || "—"}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${r.userType === "captain" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}
                >
                  {r.userType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`font-black text-lg ${(r.wallet?.balance || 0) > 0 ? "text-orange-400" : "text-slate-500"}`}
                >
                  ₹{(r.wallet?.balance || 0).toFixed(2)}
                </span>
                <button
                  onClick={() => openModal({ ...r, name: name(r) })}
                  className="bg-slate-700 hover:bg-orange-500/20 border border-slate-600 hover:border-orange-500/40 text-slate-300 hover:text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  <i className="fa-solid fa-coins mr-1.5" /> Adjust
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Adjust Modal */}
      {modal && (
        <Modal
          title={`Adjust Wallet — ${modal.name}`}
          onClose={() => setModal(null)}
        >
          <div className="mb-4 bg-slate-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                Current Balance
              </p>
              <p className="text-2xl font-black text-orange-400">
                ₹{(modal.wallet?.balance || 0).toFixed(2)}
              </p>
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${modal.userType === "captain" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}
            >
              {modal.userType}
            </span>
          </div>

          {/* Credit / Debit toggle */}
          <div className="flex gap-2 mb-4">
            {["credit", "debit"].map((t) => (
              <button
                key={t}
                onClick={() => setAdjType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition ${adjType === t ? (t === "credit" ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                <i
                  className={`fa-solid ${t === "credit" ? "fa-plus" : "fa-minus"} mr-1.5`}
                />
                {t === "credit" ? "Add Coins" : "Deduct Coins"}
              </button>
            ))}
          </div>

          <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
            Amount (₹)
          </label>
          <input
            type="number"
            min="1"
            value={adjAmount}
            onChange={(e) => setAdjAmt(e.target.value)}
            placeholder="Enter amount…"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500/50 mb-3 transition"
          />

          <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
            Note (optional)
          </label>
          <input
            value={adjNote}
            onChange={(e) => setAdjNote(e.target.value)}
            placeholder="Reason for adjustment…"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500/50 mb-5 transition"
          />

          {adjAmount && Number(adjAmount) > 0 && (
            <div
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold mb-4 ${adjType === "credit" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
            >
              New balance will be: ₹
              {Math.max(
                0,
                (modal.wallet?.balance || 0) +
                  (adjType === "credit"
                    ? Number(adjAmount)
                    : -Number(adjAmount)),
              ).toFixed(2)}
            </div>
          )}

          <button
            onClick={submitAdjust}
            disabled={saving || !adjAmount || Number(adjAmount) <= 0}
            className={`w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 ${adjType === "credit" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin mr-2" />
                Applying…
              </>
            ) : (
              `Confirm ${adjType === "credit" ? "Credit" : "Debit"}`
            )}
          </button>
        </Modal>
      )}
    </div>
  );
};

export default AdminWallet;
