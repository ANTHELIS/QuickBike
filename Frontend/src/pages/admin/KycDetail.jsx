import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

const DocCard = ({ label, url }) => {
  if (!url)
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2">
        <i className="fa-solid fa-image text-slate-600 text-2xl" />
        <p className="text-slate-500 text-xs font-semibold">
          {label}: Not uploaded
        </p>
      </div>
    );
  const isPdf = url.includes(".pdf") || url.includes("/raw/");
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-orange-500/50 transition-colors group"
    >
      {isPdf ? (
        <div className="flex flex-col items-center gap-2 p-6">
          <i className="fa-solid fa-file-pdf text-red-400 text-3xl" />
          <p className="text-slate-400 text-xs font-semibold group-hover:text-white transition-colors">
            {label} (PDF)
          </p>
          <span className="text-[10px] text-orange-400 font-bold">OPEN →</span>
        </div>
      ) : (
        <div className="relative">
          <img src={url} alt={label} className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full">
              <i className="fa-solid fa-expand mr-1" />
              View Full
            </span>
          </div>
          <div className="px-3 py-2 border-t border-slate-700">
            <p className="text-slate-400 text-xs font-semibold">{label}</p>
          </div>
        </div>
      )}
    </a>
  );
};

const KycDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // 'approve' | 'reject'
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/admin/kyc/${id}`,
          { headers: adminHeader() },
        );
        setKyc(res.data.data || res.data.kyc);
      } catch (err) {
        if (err.response?.status === 401) navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleReview = async () => {
    if (!action) return;
    if (action === "reject" && !reason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/admin/kyc/${id}/review`,
        {
          action,
          rejectionReason: reason,
        },
        { headers: adminHeader() },
      );
      setSuccess(
        `KYC ${action === "approve" ? "Approved" : "Rejected"} successfully!`,
      );
      setTimeout(() => navigate("/admin/kyc"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Review failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );

  if (!kyc)
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen gap-3">
        <i className="fa-solid fa-triangle-exclamation text-slate-600 text-4xl" />
        <p className="text-slate-400">KYC application not found.</p>
        <button
          onClick={() => navigate("/admin/kyc")}
          className="text-orange-400 text-sm font-bold"
        >
          ← Back to list
        </button>
      </div>
    );

  const captain = kyc.captain;
  const name =
    `${captain?.fullname?.firstname || ""} ${captain?.fullname?.lastname || ""}`.trim();
  const isPending = kyc.status === "pending";

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-['Inter']">
      <button
        onClick={() => navigate("/admin/kyc")}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold mb-6 transition-colors"
      >
        <i className="fa-solid fa-arrow-left" /> Back to KYC List
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left: Captain info + actions */}
        <div className="space-y-4 lg:space-y-5">
          {/* Captain card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white font-black text-lg">
                {(captain?.fullname?.firstname?.[0] || "?").toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold">{name || "—"}</p>
                <p className="text-slate-400 text-xs">
                  {captain?.email || "—"}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Phone", captain?.phone],
                ["Vehicle", captain?.vehicle?.vehicleType],
                ["Plate", captain?.vehicle?.plate],
                [
                  "Joined",
                  captain?.createdAt
                    ? new Date(captain.createdAt).toLocaleDateString("en-IN")
                    : "—",
                ],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0"
                >
                  <span className="text-slate-500 text-xs">{label}</span>
                  <span className="text-slate-200 text-xs font-semibold">
                    {val || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
              Current Status
            </p>
            <span
              className={`text-sm font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-2 ${
                kyc.status === "approved"
                  ? "bg-green-500/10 text-green-400"
                  : kyc.status === "rejected"
                    ? "bg-red-500/10 text-red-400"
                    : kyc.status === "pending"
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-slate-700 text-slate-400"
              }`}
            >
              <i
                className={`fa-solid ${kyc.status === "approved" ? "fa-circle-check" : kyc.status === "rejected" ? "fa-circle-xmark" : "fa-clock"}`}
              />
              {kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)}
            </span>
            {kyc.submittedAt && (
              <p className="text-slate-500 text-xs mt-2">
                Submitted:{" "}
                {new Date(kyc.submittedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {kyc.rejectionReasons?.length > 0 && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-xs font-semibold">
                  Rejection reason:
                </p>
                {kyc.rejectionReasons.map((r, i) => (
                  <p key={i} className="text-red-300 text-xs mt-1">
                    • {r.reason} ({r.field})
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Action panel — only for pending */}
          {isPending && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <p className="text-white font-bold text-sm mb-1">
                Review Decision
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("approve")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${action === "approve" ? "bg-green-500 text-white border-green-500" : "bg-slate-800 text-slate-300 border-slate-700 hover:border-green-500/50"}`}
                >
                  <i className="fa-solid fa-check mr-1.5" />
                  Approve
                </button>
                <button
                  onClick={() => setAction("reject")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${action === "reject" ? "bg-red-500 text-white border-red-500" : "bg-slate-800 text-slate-300 border-slate-700 hover:border-red-500/50"}`}
                >
                  <i className="fa-solid fa-xmark mr-1.5" />
                  Reject
                </button>
              </div>
              {action === "reject" && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter rejection reason (required)..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              )}
              {error && (
                <p className="text-red-400 text-xs font-semibold">
                  <i className="fa-solid fa-circle-exclamation mr-1" />
                  {error}
                </p>
              )}
              {success && (
                <p className="text-green-400 text-xs font-semibold">
                  <i className="fa-solid fa-circle-check mr-1" />
                  {success}
                </p>
              )}
              {action && (
                <button
                  onClick={handleReview}
                  disabled={submitting}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${action === "approve" ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    `Confirm ${action === "approve" ? "Approval" : "Rejection"}`
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right 2/3: Documents */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <p className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <i className="fa-solid fa-id-card text-orange-400" /> Driving
              License
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DocCard label="Front" url={kyc.drivingLicense?.frontUrl} />
              <DocCard label="Back" url={kyc.drivingLicense?.backUrl} />
            </div>
            {kyc.drivingLicense?.number && (
              <p className="text-slate-400 text-xs mt-3">
                License #:{" "}
                <span className="text-slate-200 font-semibold">
                  {kyc.drivingLicense.number}
                </span>
              </p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <p className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <i className="fa-solid fa-person text-blue-400" /> ID Card (
              {kyc.identity?.type || "Unknown"})
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DocCard label="Front" url={kyc.identity?.frontUrl} />
              <DocCard label="Back" url={kyc.identity?.backUrl} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <p className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <i className="fa-solid fa-motorcycle text-green-400" /> Vehicle
              &amp; RC
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
              {[
                ["Vehicle Number", kyc.vehicle?.number],
                ["Model", kyc.vehicle?.model],
                ["Year", kyc.vehicle?.year],
                ["Color", kyc.vehicle?.color],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="bg-slate-800 rounded-xl p-3 border border-slate-700"
                >
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    {l}
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {v || "—"}
                  </p>
                </div>
              ))}
            </div>
            <DocCard label="RC Document" url={kyc.vehicle?.rcUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycDetail;
