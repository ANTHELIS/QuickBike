const express    = require('express');
const router     = express.Router();
const { authAdmin, requireRole } = require('../middlewares/auth.admin.middleware');
const adminCtrl  = require('../controllers/admin.controller');
const siteConfigCtrl = require('../controllers/siteConfig.controller');
const asyncHandler = require('../utils/asyncHandler');

// ═════════════════════════════════════════════════
// Public
// ═════════════════════════════════════════════════
router.post('/login', asyncHandler(adminCtrl.adminLogin));

// ═════════════════════════════════════════════════
// Protected — all routes below require admin token
// ═════════════════════════════════════════════════
router.use(authAdmin);

// ── Dashboard ──
router.get('/stats',     asyncHandler(adminCtrl.getDashboardStats));
router.get('/analytics', asyncHandler(adminCtrl.getAnalytics));

// ── KYC Management ──
router.get('/kyc',              asyncHandler(adminCtrl.listKyc));
router.get('/kyc/:id',          asyncHandler(adminCtrl.getKycDetail));
router.patch('/kyc/:id/review', asyncHandler(adminCtrl.reviewKyc));

// ── Captain Management ──
router.get('/captains',                asyncHandler(adminCtrl.listCaptains));
router.patch('/captains/:id/suspend',  asyncHandler(adminCtrl.suspendCaptain));
router.patch('/captains/:id/unsuspend', asyncHandler(adminCtrl.unsuspendCaptain));

// ── User Management ──
router.get('/users',                   asyncHandler(adminCtrl.listUsers));
router.patch('/users/:id/suspend',     asyncHandler(adminCtrl.suspendUser));
router.patch('/users/:id/unsuspend',   asyncHandler(adminCtrl.unsuspendUser));

// ── Ride Monitoring ──
router.get('/rides',      asyncHandler(adminCtrl.listRides));
router.get('/rides/:id',  asyncHandler(adminCtrl.getRideDetail));

// ── Surge Zone Management (super_admin / admin only) ──
router.get('/surge-zones',      asyncHandler(adminCtrl.listSurgeZones));
router.post('/surge-zones',     requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.createSurgeZone));
router.delete('/surge-zones/:id', requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.deleteSurgeZone));

// ── Wallet Management ──
router.post('/wallet/topup',   requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.topupWallet));
router.post('/wallet/adjust',  requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.adjustWallet));
router.get('/wallet/balances', asyncHandler(adminCtrl.listWalletBalances));

// ── Promo / Offers Management ──
router.get('/promos',              asyncHandler(adminCtrl.listPromos));
router.post('/promos',             requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.createPromo));
router.patch('/promos/:id',        requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.updatePromo));
router.patch('/promos/:id/toggle', requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.togglePromo));
router.delete('/promos/:id',       requireRole('super_admin', 'admin'), asyncHandler(adminCtrl.deletePromo));

// ── Site Config (Banners & Colors) ──
router.get('/site-config',                   asyncHandler(siteConfigCtrl.getSiteConfig));
router.patch('/site-config/banners',         requireRole('super_admin', 'admin'), asyncHandler(siteConfigCtrl.updateBanners));
router.patch('/site-config/colors',          requireRole('super_admin', 'admin'), asyncHandler(siteConfigCtrl.updateColors));

// ── Broadcast Notifications ──
router.post('/notifications/broadcast',      requireRole('super_admin', 'admin'), asyncHandler(siteConfigCtrl.broadcastNotification));
router.get('/notifications/history',         asyncHandler(siteConfigCtrl.getNotificationHistory));

module.exports = router;
