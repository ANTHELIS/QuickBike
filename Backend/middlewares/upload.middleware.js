const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require('../config');

// ── Configure Cloudinary ──
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key:    config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

// ── Profile picture storage (users & captains) ──
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'quickbike/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
        ],
        public_id: (req, file) => {
            // Use user/captain id so re-uploads overwrite the same asset
            const id = req.user?._id || req.captain?._id || Date.now();
            return `profile_${id}`;
        },
    },
});

// ── Vehicle image storage (captains only) ──
const vehicleStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'quickbike/vehicles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 800, height: 600, crop: 'fill', quality: 'auto:good' },
        ],
        public_id: (req, file) => {
            const id = req.captain?._id || Date.now();
            return `vehicle_${id}`;
        },
    },
});

// ── File filter: images only ──
const imageFilter = (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|jpg)$/.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG and WebP images are allowed'), false);
    }
};

// ── Exported multer instances ──
const uploadProfilePic = multer({
    storage: profileStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('profilePicture');

const uploadVehicleImage = multer({
    storage: vehicleStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('vehicleImage');

// ── Helper to wrap multer in a promise (for use in asyncHandler) ──
const promisifyUpload = (multerFn) => (req, res) =>
    new Promise((resolve, reject) => {
        multerFn(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

module.exports = {
    cloudinary,
    uploadProfilePic,
    uploadVehicleImage,
    promisifyUpload,
};
