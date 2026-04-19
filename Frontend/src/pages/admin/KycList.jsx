import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
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

const statusConfig = {
  pending: {
    label: "Pending",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  approved: {
    label: "Approved",
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  draft: {
    label: "Draft",
    bg: "bg-slate-700",
    text: "text-slate-400",
    border: "border-slate-600",
  },
};

const KycList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kycs, setKycs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState("");

  const fetchKyc = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admin/kyc`,
        {
          params: { status: filter === "all" ? undefined : filter, search },
          headers: adminHeader(),
        },
      );
      setKycs(res.data.data || res.data.kycs || []);
      setTotal(res.data.pagination?.total || res.data.total || 0);
    } catch (err) {
      if (err.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [filter, search, navigate]);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const KycCard = ({ kyc }) => {
    const cfg = statusConfig[kyc.status] || statusConfig.draft;
    const captain = kyc.captain;
    const name =
      `${captain?.fullname?.firstname || ""} ${captain?.fullname?.lastname || ""}`.trim() ||
      "—";
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0">
            {(captain?.fullname?.firstname?.[0] || "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{name}</p>
            <p className="text-slate-400 text-xs truncate">
              {captain?.email || "—"}
            </p>
          </div>
          <span
            className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {captain?.phone || "—"} · {captain?.vehicle?.vehicleType || "—"} ·{" "}
            {fmtDate(kyc.submittedAt)}
          </div>
          <button
            onClick={() => navigate(`/admin/kyc/${kyc._id}`)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ml-2 shrink-0"
          >
            Review →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            KYC Applications
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total} total applications
          </p>
        </div>
        <button
          onClick={fetchKyc}
          className="flex items-center gap-2 bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <i className="fa-solid fa-rotate-right" /> Refresh
        </button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {["all", "pending", "approved", "rejected"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all ${filter === t ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="ml-auto relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-36 sm:w-48 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {["Captain", "Phone", "Vehicle", "Submitted", "Status", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">
                      Loading applications...
                    </p>
                  </div>
                </td>
              </tr>
            ) : kycs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <i className="fa-solid fa-inbox text-slate-600 text-4xl mb-3 block" />
                  <p className="text-slate-500 text-sm">
                    No KYC applications found
                  </p>
                </td>
              </tr>
            ) : (
              kycs.map((kyc) => {
                const cfg = statusConfig[kyc.status] || statusConfig.draft;
                const captain = kyc.captain;
                const name =
                  `${captain?.fullname?.firstname || ""} ${captain?.fullname?.lastname || ""}`.trim() ||
                  "—";
                return (
                  <tr
                    key={kyc._id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-black">
                          {(
                            captain?.fullname?.firstname?.[0] || "?"
                          ).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {name}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {captain?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {captain?.phone || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {captain?.vehicle?.vehicleType || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {fmtDate(kyc.submittedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/admin/kyc/${kyc._id}`)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-800 rounded-xl animate-pulse"
              />
            ))
        ) : kycs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No applications found
          </div>
        ) : (
          kycs.map((k) => <KycCard key={k._id} kyc={k} />)
        )}
      </div>
    </div>
  );
};

export default KycList;
