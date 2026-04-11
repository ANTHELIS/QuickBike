const express   = require('express');
const router    = express.Router();
const { authCaptain } = require('../middlewares/auth.middleware');
const { upload } = require('../config/cloudinary');
const kycCtrl   = require('../controllers/kyc.controller');

// All KYC routes require a logged-in captain
router.use(authCaptain);

// Get own KYC status
router.get('/me', kycCtrl.getMyKyc);

// Step 1 — Driving License (two image files)
router.post('/step/1',
    upload.fields([
        { name: 'drivingLicenseFront', maxCount: 1 },
        { name: 'drivingLicenseBack',  maxCount: 1 },
    ]),
    kycCtrl.saveStep1
);

// Step 2 — ID Card (two image files)
router.post('/step/2',
    upload.fields([
        { name: 'idCardFront', maxCount: 1 },
        { name: 'idCardBack',  maxCount: 1 },
    ]),
    kycCtrl.saveStep2
);

// Step 3 — Vehicle Info (RC document, can be PDF)
router.post('/step/3',
    upload.fields([
        { name: 'rcDocument', maxCount: 1 },
    ]),
    kycCtrl.saveStep3
);

// Final submission
router.post('/submit', kycCtrl.submitKyc);

module.exports = router;
