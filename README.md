<p align="center">
  <img src="./frontend/public/logo.png" alt="QuickBike Logo" width="200" />
</p>

# 🏍️ QuickBike - Real-Time Ride Hailing Platform

**QuickBike** is a modern, full-stack, real-time ride-hailing platform built to mimic the functionality of popular apps like Rapido and Uber. Packed with real-time location tracking, dynamic fare calculations, and a complete administrative dashboard, QuickBike delivers a premium experience for both Riders and Captains (Drivers).

---

## ✨ Features

### 🛵 For Riders
* **Multiple Vehicle Options:** Choose between Bike Taxi, Quick Auto, or Mini Cab.
* **Live Tracking:** Real-time captain location tracking on a Google Maps interface.
* **Dynamic Fare Calculation:** Highly optimized routing and pricing based on distance and duration.
* **Smart Wallet & Payments:** Integrated wallet system with Top-Up functionality, UPI ID management, and comprehensive transaction history.
* **Ride History:** Detailed view of past rides and their statuses.

### 🛡️ For Captains (Drivers)
* **Real-Time Ride Requests:** Instant notifications for nearby ride requests using Socket.io and Redis geospatial queries.
* **KYC & Onboarding:** Secure driver verification system with document uploads via Cloudinary.
* **Revenue Tracking:** Integrated dashboard to view daily earnings and completed trips.

### 🧑‍💻 For Administrators
* **Powerful Dashboard:** Full overview of the platform—monitor active rides, review KYC submissions, and manage users.
* **Dynamic Site Config:** Update UI elements (like banners) without redeploying the application.

### ⚡ Technical Highlights
* **High Performance Frontend:** Built with React 19 and Vite. Utilizes route-based code-splitting (using `React.lazy` and `<Suspense>`) to reduce initial bundle sizes by ~80%.
* **Scalable Backend:** Node.js backend using Express 5, augmented with robust security middlewares (Helmet, HPP, Rate Limiting).
* **Real-Time Engine:** Powered by Socket.io and `ioredis` for clustered messaging across instances.
* **Image Management:** Seamless Cloudinary integration using `multer-origin` for dynamic file uploads.
* **Payment Ready:** Pre-configured architecture for Razorpay.

---

## 🛠️ Tech Stack 

**Frontend:**
* React (v19) & Vite
* Tailwind CSS
* React Router DOM
* Socket.io-client
* Google Maps API (`@react-google-maps/api`)
* GSAP (Animations)

**Backend:**
* Node.js & Express (v5)
* MongoDB & Mongoose
* Redis / `ioredis`
* Socket.io
* Cloudinary
* JSON Web Token (JWT) & bcrypt

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB (Atlas or Local)
* Redis (Cloud or Local instance)
* Google Maps API Key
* Cloudinary Account credentials

### 1. Clone the repository
```bash
git clone https://github.com/your-username/quickbike.git
cd quickbike
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory and populate it with the required environment variables:
```env
PORT=4000
NODE_ENV=development
DB_CONNECT=mongodb+srv://<user>:<password>@cluster.mongodb.net/quickbike
REDIS_URL=redis://default:<password>@your-redis-endpoint
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ADMIN_JWT_SECRET=your_admin_secret
GOOGLE_MAPS_API=your_google_maps_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=http://localhost:5173
```

Start the development server:
```bash
npm run dev
```

**Seed Admin Account (Optional):**
To generate an initial admin account, run:
```bash
node scripts/seed-admin.js
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_BASE_URL=http://localhost:4000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Start the frontend development server:
```bash
npm run dev
```

---

## 🌐 Production Deployment

The platform is optimized for seamless deployment.

### Backend (Render)
1. Set up a Web Service on Render.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add all environment variables. Ensure `CORS_ORIGINS` is set to your frontend URL (e.g., `https://quick-bike.vercel.app`). *Note: Make sure not to include a trailing slash in the origin URL.*

### Frontend (Vercel)
1. Import the project into Vercel and set the Root Directory to `frontend`.
2. Framework Preset: `Vite`.
3. Build Command: `npm run build`.
4. Add your `VITE_BASE_URL` and `VITE_GOOGLE_MAPS_API_KEY` to the environment variables.

*A detailed deployment guide is available in `./quickbike_deploy_guide.md`.*

---

## 📦 Project Structure

```text
QuickBike/
├── Backend/                 # Node.js + Express API
│   ├── config/              # Configuration files & env validation
│   ├── controllers/         # Business logic
│   ├── middlewares/         # Auth, sanitization, rate limiting
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API Endpoints
│   ├── scripts/             # DB seeding scripts (Admin)
│   ├── utils/               # Helpers (Geocoding, Maps, Cloudinary)
│   ├── socket.js            # Real-time WebSocket connection handling
│   └── app.js               # Application setup
└── frontend/                # React (Vite) Application
    ├── src/
    │   ├── components/      # UI Components (Desktop & Mobile)
    │   ├── context/         # React Contexts (User, Captain, Socket)
    │   ├── pages/           # Route-based views
    │   ├── App.jsx          # Main Router with Code-Splitting
    │   └── index.css        # Tailwind definitions & custom CSS
    └── public/              # Static assets
```

---

## 📝 License
This project is proprietary and confidential.

---
<p align="center">Made with ❤️ for seamless mobility.</p>
