const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
    {
        captain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'captain',
            required: true,
            unique: true,
        },

        // Step 1: Driving License
        drivingLicenseFront: { type: String, default: null },
        drivingLicenseBack:  { type: String, default: null },
        licenseNumber:       { type: String, trim: true, default: '' },

        // Step 2: ID Card
        idCardFront: { type: String, default: null },
        idCardBack:  { type: String, default: null },
        idType: {
            type: String,
            enum: ['aadhaar', 'voter_id', 'passport', ''],
            default: '',
        },

        // Step 3: Vehicle
        vehicleNumber: { type: String, trim: true, uppercase: true, default: '' },
        vehicleModel:  { type: String, trim: true, default: '' },
        vehicleYear:   { type: Number, default: null },
        vehicleColor:  { type: String, trim: true, default: '' },
        rcDocument:    { type: String, default: null }, // Cloudinary URL

        // Status
        status: {
            type: String,
            enum: ['draft', 'pending', 'approved', 'rejected'],
            default: 'draft',
        },
        rejectionReason: { type: String, default: '' },
        reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'admin', default: null },
        reviewedAt:  { type: Date, default: null },
        submittedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('kyc', kycSchema);
