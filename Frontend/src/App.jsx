import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, GuestRoute } from './components/guards/RouteGuards';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

/* ── Lazy-loaded pages for code splitting ── */
const UserLogin = lazy(() => import('./pages/auth/UserLogin'));
const UserSignup = lazy(() => import('./pages/auth/UserSignup'));
const CaptainLogin = lazy(() => import('./pages/auth/CaptainLogin'));
const CaptainRegister = lazy(() => import('./pages/auth/CaptainRegister'));
const Home = lazy(() => import('./pages/home/Home'));
const SelectRide = lazy(() => import('./pages/ride/SelectRide'));
const OnTheWay = lazy(() => import('./pages/ride/OnTheWay'));
const RideSummary = lazy(() => import('./pages/ride/RideSummary'));
const Activity = lazy(() => import('./pages/activity/Activity'));
const Account = lazy(() => import('./pages/account/Account'));
const CaptainHome = lazy(() => import('./pages/captain/CaptainHome'));
const DrivingLicense = lazy(() => import('./pages/captain/onboarding/DrivingLicense'));
const IdVerification = lazy(() => import('./pages/captain/onboarding/IdVerification'));
const VehicleInfo = lazy(() => import('./pages/captain/onboarding/VehicleInfo'));
const FinalReview = lazy(() => import('./pages/captain/onboarding/FinalReview'));

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <div className="app-container">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* ── Auth (Guest only) ── */}
              <Route path="/login" element={<GuestRoute><UserLogin /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><UserSignup /></GuestRoute>} />
              <Route path="/captain/login" element={<GuestRoute><CaptainLogin /></GuestRoute>} />
              <Route path="/captain/register" element={<GuestRoute><CaptainRegister /></GuestRoute>} />

              {/* ── Captain Onboarding Steps ── */}
              <Route path="/captain/onboarding/driving-license" element={<GuestRoute><DrivingLicense /></GuestRoute>} />
              <Route path="/captain/onboarding/id-verification" element={<GuestRoute><IdVerification /></GuestRoute>} />
              <Route path="/captain/onboarding/vehicle-info" element={<GuestRoute><VehicleInfo /></GuestRoute>} />
              <Route path="/captain/onboarding/review" element={<GuestRoute><FinalReview /></GuestRoute>} />

              {/* ── Protected with Bottom Nav ── */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/home" element={<Home />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/account" element={<Account />} />
                <Route path="/captain/home" element={<CaptainHome />} />
              </Route>

              {/* ── Protected without Bottom Nav ── */}
              <Route path="/select-ride" element={<ProtectedRoute><SelectRide /></ProtectedRoute>} />
              <Route path="/on-the-way" element={<ProtectedRoute><OnTheWay /></ProtectedRoute>} />
              <Route path="/ride-summary" element={<ProtectedRoute><RideSummary /></ProtectedRoute>} />

              {/* ── Fallback ── */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </div>

        {/* Toast container */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1F2937',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '12px',
              padding: '12px 20px',
              maxWidth: '380px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
      </SocketProvider>
    </BrowserRouter>
  );
}
