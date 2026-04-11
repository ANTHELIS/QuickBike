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

        const update = {};
        if (licenseNumber)                    update['drivingLicense.number'] = licenseNumber;
        if (files.drivingLicenseFront?.[0])   update['drivingLicense.frontUrl'] = files.drivingLicenseFront[0].path;
        if (files.drivingLicenseBack?.[0])    update['drivingLicense.backUrl']  = files.drivingLicenseBack[0].path;

        // Track step completion
        const kyc = await kycModel.findOneAndUpdate(
            { captain: req.captain._id },
            {
                $set: update,
                $addToSet: { completedSteps: 1 },
            },
            { upsert: true, new: true }
        );
        res.json({ kyc });
    } catch (err) {
        logger.error('saveStep1 error', { error: err.message });
        res.status(500).json({ message: 'Failed to save Step 1' });
    }
};

// ── POST /kyc/step/2  (ID Card — Aadhaar / PAN / Voter ID) ───
module.exports.saveStep2 = async (req, res) => {
    try {
        const { idType } = req.body;
        const files = req.files || {};

        const update = {};
        if (idType)                    update['identity.type'] = idType;
        if (files.idCardFront?.[0])    update['identity.frontUrl'] = files.idCardFront[0].path;
        if (files.idCardBack?.[0])     update['identity.backUrl']  = files.idCardBack[0].path;

        const kyc = await kycModel.findOneAndUpdate(
            { captain: req.captain._id },
            {
                $set: update,
                $addToSet: { completedSteps: 2 },
            },
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

        const update = {};
        if (vehicleNumber)           update['vehicle.number'] = vehicleNumber;
        if (vehicleModel)            update['vehicle.model']  = vehicleModel;
        if (vehicleYear)             update['vehicle.year']   = Number(vehicleYear);
        if (vehicleColor)            update['vehicle.color']  = vehicleColor;
        if (files.rcDocument?.[0])   update['vehicle.rcUrl']  = files.rcDocument[0].path;

        const kyc = await kycModel.findOneAndUpdate(
            { captain: req.captain._id },
            {
                $set: update,
                $addToSet: { completedSteps: 3 },
            },
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
        if (!kyc.drivingLicense?.frontUrl) missing.push('Driving License Front');
        if (!kyc.drivingLicense?.backUrl)  missing.push('Driving License Back');
        if (!kyc.identity?.frontUrl)       missing.push('ID Card Front');
        if (!kyc.identity?.backUrl)        missing.push('ID Card Back');
        if (!kyc.vehicle?.number)          missing.push('Vehicle Number');
        if (!kyc.vehicle?.model)           missing.push('Vehicle Model');
        if (!kyc.vehicle?.rcUrl)           missing.push('RC Document');

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
