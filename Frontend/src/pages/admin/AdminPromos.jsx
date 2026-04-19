import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;
const ah = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

const EMPTY_FORM = {
  code: "",
  type: "flat",
  value: "",
  maxDiscount: "",
  minFare: "",
  maxUsage: "",
  perUserLimit: "1",
  validFrom: new Date().toISOString().slice(0, 16),
  validUntil: "",
  applicableVehicles: ["moto", "auto", "car"],
  description: "",
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AdminPromos = () => {
  const [promos, setPromos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setFilter] = useState("all");
  const [toast, setToast] = useState("");

  // Modal state
  const [modal, setModal] = useState(null); // null | 'create' | { ...promo }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDel] = useState(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter === "active") params.active = "true";
      if (activeFilter === "inactive") params.active = "false";
      const res = await axios.get(`${BASE}/api/admin/promos`, {
        headers: ah(),
        params,
      });
      const d = res.data.data ?? res.data;
      setPromos(d.data || d || []);
      setTotal(d.total || 0);
    } catch {
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(""), 3500);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal("create");
  };
  const openEdit = (p) => {
    setForm({
      code: p.code,
      type: p.type,
      value: String(p.value),
      maxDiscount: p.maxDiscount ?? "",
      minFare: p.minFare ?? "",
      maxUsage: p.maxUsage ?? "",
      perUserLimit: String(p.perUserLimit ?? 1),
      validFrom: p.validFrom
        ? new Date(p.validFrom).toISOString().slice(0, 16)
        : "",
      validUntil: p.validUntil
        ? new Date(p.validUntil).toISOString().slice(0, 16)
        : "",
      applicableVehicles: p.applicableVehicles || ["moto", "auto", "car"],
      description: p.description || "",
    });
    setModal(p);
  };

  const fv = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleVehicle = (v) => {
    const cur = form.applicableVehicles;
    setForm((f) => ({
      ...f,
      applicableVehicles: cur.includes(v)
        ? cur.filter((x) => x !== v)
        : [...cur, v],
    }));
  };

  const submitForm = async () => {
    if (!form.code || !form.value || !form.validUntil) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minFare: form.minFare ? Number(form.minFare) : 0,
        maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
        perUserLimit: Number(form.perUserLimit) || 1,
      };
      if (modal === "create") {
        await axios.post(`${BASE}/api/admin/promos`, payload, {
          headers: ah(),
        });
        showToast(`Promo "${form.code}" created!`);
      } else {
        await axios.patch(`${BASE}/api/admin/promos/${modal._id}`, payload, {
          headers: ah(),
        });
        showToast(`Promo "${form.code}" updated!`);
      }
      setModal(null);
      fetchPromos();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to save promo", false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p) => {
    try {
      await axios.patch(
        `${BASE}/api/admin/promos/${p._id}/toggle`,
        {},
        { headers: ah() },
      );
      showToast(
        `Promo "${p.code}" ${p.isActive ? "deactivated" : "activated"}`,
      );
      fetchPromos();
    } catch (e) {
      showToast(e.response?.data?.message || "Toggle failed", false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete promo "${p.code}"? This cannot be undone.`))
      return;
    setDel(p._id);
    try {
      await axios.delete(`${BASE}/api/admin/promos/${p._id}`, {
        headers: ah(),
      });
      showToast(`Promo "${p.code}" deleted`);
      fetchPromos();
    } catch (e) {
      showToast("Delete failed", false);
    } finally {
      setDel(null);
    }
  };

  const typeLabel = (t) =>
    t === "flat" ? "₹ Flat" : t === "percent" ? "% Percent" : "Free Ride";
  const typeColor = (t) =>
    t === "flat"
      ? "text-blue-400 bg-blue-500/15"
      : t === "percent"
        ? "text-purple-400 bg-purple-500/15"
        : "text-emerald-400 bg-emerald-500/15";

  const activeCount = promos.filter((p) => p.isActive).length;
  const inactiveCount = promos.filter((p) => !p.isActive).length;
  const totalUsage = promos.reduce((acc, p) => acc + (p.usage?.count || 0), 0);

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
            Offers &amp; Promos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create, edit, and control promotional codes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)] self-start sm:self-auto"
        >
          <i className="fa-solid fa-plus" /> New Promo
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {[
          {
            label: "Active Promos",
            value: activeCount,
            icon: "fa-tag",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Inactive Promos",
            value: inactiveCount,
            icon: "fa-tag-slash",
            color: "text-slate-400",
            bg: "bg-slate-700/50",
          },
          {
            label: "Total Redemptions",
            value: totalUsage,
            icon: "fa-receipt",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}
            >
              <i className={`fa-solid ${c.icon} ${c.color} text-sm`} />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-black text-white">
                {c.value}
              </p>
              <p className="text-[10px] lg:text-xs text-slate-400 font-semibold">
                {c.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["all", "active", "inactive"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize transition ${activeFilter === f ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {f === "all"
              ? "All Promos"
              : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <p className="ml-auto self-center text-slate-500 text-xs">
          {total} total
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-400 font-semibold px-5 py-3 text-xs uppercase tracking-wider">
                Code
              </th>
              <th className="text-left text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Type
              </th>
              <th className="text-left text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Value
              </th>
              <th className="text-left text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Validity
              </th>
              <th className="text-left text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Used
              </th>
              <th className="text-center text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-center text-slate-400 font-semibold px-4 py-3 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array(7)
                      .fill(0)
                      .map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-slate-800 rounded animate-pulse" />
                        </td>
                      ))}
                  </tr>
                ))
            ) : promos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-16">
                  No promos yet.{" "}
                  <button
                    onClick={openCreate}
                    className="text-orange-400 hover:underline font-semibold"
                  >
                    Create one →
                  </button>
                </td>
              </tr>
            ) : (
              promos.map((p) => (
                <tr
                  key={p._id}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${!p.isActive ? "opacity-50" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-800 text-orange-400 font-black text-sm px-2.5 py-0.5 rounded-lg tracking-wider">
                        {p.code}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-[160px]">
                        {p.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${typeColor(p.type)}`}
                    >
                      {typeLabel(p.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-white">
                    {p.type === "flat"
                      ? `₹${p.value}`
                      : p.type === "percent"
                        ? `${p.value}%`
                        : "Free"}
                    {p.maxDiscount ? (
                      <span className="text-slate-500 text-[11px] font-normal ml-1">
                        (max ₹{p.maxDiscount})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    <p>{fmtDate(p.validFrom)} →</p>
                    <p
                      className={
                        new Date(p.validUntil) < new Date()
                          ? "text-red-400 font-semibold"
                          : ""
                      }
                    >
                      {fmtDate(p.validUntil)}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 font-semibold">
                    {p.usage?.count ?? 0}
                    {p.maxUsage ? (
                      <span className="text-slate-500 font-normal">
                        /{p.maxUsage}
                      </span>
                    ) : null}
                    {p.usage?.totalDiscount > 0 && (
                      <p className="text-orange-400 text-[11px] font-bold">
                        ₹{p.usage.totalDiscount} saved
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => handleToggle(p)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${p.isActive ? "bg-emerald-500" : "bg-slate-700"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.isActive ? "translate-x-4" : "translate-x-0.5"}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-7 h-7 bg-slate-800 hover:bg-blue-500/20 border border-slate-700 hover:border-blue-500/40 text-slate-400 hover:text-blue-400 rounded-lg flex items-center justify-center transition-all text-xs"
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deleting === p._id}
                        className="w-7 h-7 bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center transition-all text-xs disabled:opacity-40"
                      >
                        {deleting === p._id ? (
                          <i className="fa-solid fa-circle-notch fa-spin" />
                        ) : (
                          <i className="fa-solid fa-trash" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile promo card list */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-24 bg-slate-800 rounded-xl animate-pulse"
              />
            ))
        ) : promos.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No promos yet.{" "}
            <button
              onClick={openCreate}
              className="text-orange-400 font-semibold"
            >
              Create one →
            </button>
          </div>
        ) : (
          promos.map((p) => (
            <div
              key={p._id}
              className={`bg-slate-900 border border-slate-800 rounded-xl p-4 ${!p.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="bg-slate-800 text-orange-400 font-black text-sm px-2.5 py-0.5 rounded-lg tracking-wider">
                  {p.code}
                </span>
                <button
                  onClick={() => handleToggle(p)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ${p.isActive ? "bg-emerald-500" : "bg-slate-700"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.isActive ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${typeColor(p.type)}`}
                >
                  {typeLabel(p.type)}
                </span>
                <span className="text-white font-bold text-sm">
                  {p.type === "flat"
                    ? `₹${p.value}`
                    : p.type === "percent"
                      ? `${p.value}%`
                      : "Free"}
                </span>
              </div>
              {p.description && (
                <p className="text-slate-500 text-xs mb-2 truncate">
                  {p.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">
                  Used: {p.usage?.count ?? 0}
                  {p.maxUsage ? `/${p.maxUsage}` : ""}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-7 h-7 bg-slate-800 hover:bg-blue-500/20 border border-slate-700 text-slate-400 hover:text-blue-400 rounded-lg flex items-center justify-center text-xs transition-all"
                  >
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deleting === p._id}
                    className="w-7 h-7 bg-slate-800 hover:bg-red-500/20 border border-slate-700 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center text-xs transition-all disabled:opacity-40"
                  >
                    {deleting === p._id ? (
                      <i className="fa-solid fa-circle-notch fa-spin" />
                    ) : (
                      <i className="fa-solid fa-trash" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modal !== null && (
        <Modal
          title={
            modal === "create"
              ? "Create New Promo"
              : `Edit Promo — ${modal.code}`
          }
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            {/* Code */}
            {modal === "create" && (
              <div>
                <label className="label-xs">Promo Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => fv("code", e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE50"
                  maxLength={20}
                  className="admin-input"
                />
              </div>
            )}

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => fv("type", e.target.value)}
                  className="admin-input"
                >
                  <option value="flat">₹ Flat Discount</option>
                  <option value="percent">% Percentage</option>
                  <option value="free_ride">Free Ride</option>
                </select>
              </div>
              <div>
                <label className="label-xs">
                  Value *{" "}
                  {form.type === "flat"
                    ? "(₹)"
                    : form.type === "percent"
                      ? "(%)"
                      : "(₹ max)"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => fv("value", e.target.value)}
                  placeholder="50"
                  className="admin-input"
                />
              </div>
            </div>

            {/* Max Discount + Min Fare */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">
                  Max Discount (₹){" "}
                  <span className="text-slate-600">optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => fv("maxDiscount", e.target.value)}
                  placeholder="200"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="label-xs">Min Fare (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.minFare}
                  onChange={(e) => fv("minFare", e.target.value)}
                  placeholder="0"
                  className="admin-input"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">
                  Max Total Uses{" "}
                  <span className="text-slate-600">optional</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsage}
                  onChange={(e) => fv("maxUsage", e.target.value)}
                  placeholder="∞ unlimited"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="label-xs">Per-User Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.perUserLimit}
                  onChange={(e) => fv("perUserLimit", e.target.value)}
                  placeholder="1"
                  className="admin-input"
                />
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">Valid From</label>
                <input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => fv("validFrom", e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="label-xs">Valid Until *</label>
                <input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => fv("validUntil", e.target.value)}
                  className="admin-input"
                />
              </div>
            </div>

            {/* Vehicles */}
            <div>
              <label className="label-xs mb-2">Applicable Vehicles</label>
              <div className="flex gap-2">
                {[
                  { key: "moto", icon: "fa-motorcycle", label: "Bike Taxi" },
                  { key: "auto", icon: "fa-truck-pickup", label: "Quick Auto" },
                  { key: "car", icon: "fa-car", label: "Mini Cab" },
                ].map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => toggleVehicle(v.key)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition ${form.applicableVehicles.includes(v.key) ? "bg-orange-500/15 border-orange-500/40 text-orange-400" : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"}`}
                  >
                    <i className={`fa-solid ${v.icon}`} />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label-xs">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => fv("description", e.target.value)}
                placeholder="Short description shown to users…"
                rows={2}
                className="admin-input resize-none"
              />
            </div>

            <button
              onClick={submitForm}
              disabled={saving || !form.code || !form.value || !form.validUntil}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin mr-2" />
                  Saving…
                </>
              ) : modal === "create" ? (
                "Create Promo"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* Inline style for shared input / label classes */}
      <style>{`
        .admin-input { width: 100%; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 0.75rem; padding: 0.625rem 1rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .admin-input:focus { border-color: rgba(249,115,22,0.5); }
        .admin-input option { background: #1e293b; }
        .label-xs { display: block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 0.375rem; }
      `}</style>
    </div>
  );
};

export default AdminPromos;
