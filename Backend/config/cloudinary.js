const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: 'quickbike-kyc',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
        resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
        transformation: file.mimetype !== 'application/pdf'
            ? [{ quality: 'auto', fetch_format: 'auto' }]
            : undefined,
    }),
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'), false);
    },
});

module.exports = { cloudinary, upload };
