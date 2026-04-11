const express    = require('express');
const router     = express.Router();
const { authAdmin } = require('../middlewares/auth.admin.middleware');
const adminCtrl  = require('../controllers/admin.controller');

// Public
router.post('/login', adminCtrl.adminLogin);

// Protected — all routes below require admin token
router.use(authAdmin);

router.get('/stats',              adminCtrl.getDashboardStats);
router.get('/kyc',                adminCtrl.listKyc);
router.get('/kyc/:id',            adminCtrl.getKycDetail);
router.patch('/kyc/:id/review',   adminCtrl.reviewKyc);
router.get('/captains',           adminCtrl.listCaptains);
router.get('/users',              adminCtrl.listUsers);

module.exports = router;
