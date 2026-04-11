const kycModel     = require('../models/kyc.model');
const captainModel = require('../models/captain.model');
const logger       = require('../utils/logger');

// ── GET /kyc/me ─────────────────────────────────────
module.exports.getMyKyc = async (req, res) => {
    try {
        const kyc = await kycModel.findOne({ captain: req.captain._id });
        res.json({ kyc: kyc || null });
    } catch (err) {
        logger.error('getMyKyc error', { error: err.message });
        res.status(500).json({ message: 'Failed to fetch KYC' });
    }
};

// ── POST /kyc/step/1  (Driving License) ─────────────
module.exports.saveStep1 = async (req, res) => {
    try {
        const { licenseNumber } = req.body;
        const files = req.files || {};

        const update = { licenseNumber: licenseNumber || '' };
        if (files.drivingLicenseFront?.[0]) update.drivingLicenseFront = files.drivingLicenseFront[0].path;
        if (files.drivingLicenseBack?.[0])  update.drivingLicenseBack  = files.drivingLicenseBack[0].path;

        const kyc = await kycModel.findOneAndUpdate(
            { captain: req.captain._id },
            { $set: update },
            { upsert: true, new: true }
        );
        res.json({ kyc });
    } catch (err) {
        logger.error('saveStep1 error', { error: err.message });
        res.status(500).json({ message: 'Failed to save Step 1' });
    }
};

// ── POST /kyc/step/2  (ID Card) ─────────────────────
module.exports.saveStep2 = async (req, res) => {
    try {
        const { idType } = req.body;
        const files = req.files || {};

        const update = { idType: idType || '' };
        if (files.idCardFront?.[0]) update.idCardFront = files.idCardFront[0].path;
        if (files.idCardBack?.[0])  update.idCardBack  = files.idCardBack[0].path;

        const kyc = await kycModel.findOneAndUpdate(
            { captain: req.captain._id },
            { $set: update },
            { upsert: true, new: true }
        );
        res.json({ kyc });
    } catch (err) {
        logger.error('saveStep2 error', { error: err.message });
        res.status(500).json({ message: 'Failed to save Step 2' });
    }
};

// ── POST /kyc/step/3  (Vehicle Info) ────────────────
module.exports.saveStep3 = async (req, res) => {
    try {
        const { vehicleNumber, vehicleModel, vehicleYear, vehicleColor } = req.body;
        const files = req.files || {};

        const update = {
            vehicleNumber: vehicleNumber || '',
            vehicleModel:  vehicleModel  || '',
            vehicleYear:   vehicleYear   ? Number(vehicleYear) : null,
            vehicleColor:  vehicleColor  || '',
        };
        if (files.rcDocument?.[0]) update.rcDocument = files.rcDocument[0].path;

        const kyc = await kycModel.findOneAndUpdate(
            { captain: req.captain._id },
            { $set: update },
            { upsert: true, new: true }
        );
        res.json({ kyc });
    } catch (err) {
        logger.error('saveStep3 error', { error: err.message });
        res.status(500).json({ message: 'Failed to save Step 3' });
    }
};

// ── POST /kyc/submit  (Final submission) ────────────
module.exports.submitKyc = async (req, res) => {
    try {
        const kyc = await kycModel.findOne({ captain: req.captain._id });
        if (!kyc) return res.status(400).json({ message: 'Complete all steps before submitting' });

        // Validate all required documents are uploaded
        const missing = [];
        if (!kyc.drivingLicenseFront) missing.push('Driving License Front');
        if (!kyc.drivingLicenseBack)  missing.push('Driving License Back');
        if (!kyc.idCardFront)         missing.push('ID Card Front');
        if (!kyc.idCardBack)          missing.push('ID Card Back');
        if (!kyc.vehicleNumber)       missing.push('Vehicle Number');
        if (!kyc.vehicleModel)        missing.push('Vehicle Model');
        if (!kyc.rcDocument)          missing.push('RC Document');

        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });
        }

        kyc.status      = 'pending';
        kyc.submittedAt = new Date();
        await kyc.save();

        // Update captain kycStatus
        await captainModel.findByIdAndUpdate(req.captain._id, { kycStatus: 'pending' });

        res.json({ message: 'KYC submitted successfully. Review takes 24-48 hours.', kyc });
    } catch (err) {
        logger.error('submitKyc error', { error: err.message });
        res.status(500).json({ message: 'Failed to submit KYC' });
    }
};
