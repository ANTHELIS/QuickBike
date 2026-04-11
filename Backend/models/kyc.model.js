const mongoose = require('mongoose');

/**
 * KYC Model — Captain document verification.
 *
 * Flow:
 *   1. Captain registers → kycStatus: 'none'
 *   2. Captain uploads documents step by step → kycStatus: 'draft'
 *   3. Captain submits all documents → kycStatus: 'pending'
 *   4. Admin reviews:
 *      - Approve → kycStatus: 'approved', captain.isVerified: true
 *      - Reject → kycStatus: 'rejected', with reasons per field
 *      - Request info → kycStatus: 'draft' (resubmit specific fields)
 *   5. Captain can resubmit up to 3 times after rejection
 *
 * Documents are stored in Cloudinary with signed URLs.
 * Original files are never served directly — always through signed URLs.
 */

const documentSubSchema = {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }, // Cloudinary public ID for deletion
    verified: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
    uploadedAt: { type: Date },
};

const kycSchema = new mongoose.Schema(
    {
        captain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'captain',
            required: true,
            unique: true,
            index: true,
        },

        // ── Step 1: Driving License ──
        drivingLicense: {
            frontUrl: documentSubSchema.url,
            frontPublicId: documentSubSchema.publicId,
            backUrl: documentSubSchema.url,
            backPublicId: documentSubSchema.publicId,
            number: { type: String, trim: true, default: '' },
            expiryDate: { type: Date },
            verified: { type: Boolean, default: false },
            rejectionReason: { type: String, default: '' },
        },

        // ── Step 2: Identity (Aadhaar / PAN / Voter ID) ──
        identity: {
            type: {
                type: String,
                enum: ['aadhaar', 'pan', 'voter_id', ''],
                default: '',
            },
            frontUrl: { type: String, default: '' },
            frontPublicId: { type: String, default: '' },
            backUrl: { type: String, default: '' },
            backPublicId: { type: String, default: '' },
            number: { type: String, trim: true, default: '' },
            verified: { type: Boolean, default: false },
            rejectionReason: { type: String, default: '' },
        },

        // ── Step 3: Vehicle Documents ──
        vehicle: {
            rcUrl: { type: String, default: '' },
            rcPublicId: { type: String, default: '' },
            insuranceUrl: { type: String, default: '' },
            insurancePublicId: { type: String, default: '' },
            pollutionUrl: { type: String, default: '' },
            pollutionPublicId: { type: String, default: '' },
            permitUrl: { type: String, default: '' },
            permitPublicId: { type: String, default: '' },
            number: { type: String, trim: true, default: '' },
            model: { type: String, trim: true, default: '' },
            year: { type: Number },
            color: { type: String, trim: true, default: '' },
            verified: { type: Boolean, default: false },
            rejectionReason: { type: String, default: '' },
        },

        // ── Step 4: Selfie + Liveness ──
        selfie: {
            url: { type: String, default: '' },
            publicId: { type: String, default: '' },
            livenessScore: { type: Number, default: 0, min: 0, max: 100 },
            verified: { type: Boolean, default: false },
            rejectionReason: { type: String, default: '' },
        },

        // ── Overall Status ──
        status: {
            type: String,
            enum: ['draft', 'pending', 'under_review', 'approved', 'rejected'],
            default: 'draft',
            index: true,
        },

        // ── Review Tracking ──
        submittedAt: { type: Date },
        reviewedAt: { type: Date },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'admin',
        },

        // ── Rejection History ──
        rejectionReasons: [
            {
                field: { type: String },
                reason: { type: String },
                timestamp: { type: Date, default: Date.now },
            },
        ],

        // ── Resubmission Control ──
        resubmissionCount: {
            type: Number,
            default: 0,
            max: 3, // max 3 resubmissions
        },

        // ── Document Expiry Tracking ──
        licenseExpiresAt: { type: Date },
        insuranceExpiresAt: { type: Date },

        // ── Step Completion Tracking ──
        completedSteps: {
            type: [Number], // [1, 2, 3, 4]
            default: [],
        },
    },
    { timestamps: true }
);

// ── Indexes ──
// captain already has unique:true inline
kycSchema.index({ status: 1, submittedAt: 1 }); // admin review queue
kycSchema.index({ licenseExpiresAt: 1 }); // expiry reminders

module.exports = mongoose.model('kyc', kycSchema);
