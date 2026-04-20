import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router'

// ── Shared loading fallback ──
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
    <div className="flex flex-col items-center gap-4">
      <img src="/logo.png" alt="QuickBike" className="h-16 w-auto animate-pulse" />
      <div className="w-8 h-8 border-3 border-[#F5820D]/30 border-t-[#F5820D] rounded-full animate-spin" />
    </div>
  </div>
)

// ── Eagerly loaded (critical path — user sees these first) ──
import Start from './pages/Start'
import UserLogin from './pages/UserLogin'
import UserSignup from './pages/UserSignup'
import UserProtectWrapper from './pages/UserProtectWrapper'
import CaptainProtectWrapper from './pages/CaptainProtectWrapper'

// ── Lazy loaded (loaded on demand when navigated to) ──
const Captainlogin = lazy(() => import('./pages/Captainlogin'))
const Home = lazy(() => import('./pages/Home'))
const UserLogout = lazy(() => import('./pages/UserLogout'))
const CaptainHome = lazy(() => import('./pages/CaptainHome'))
const CaptainLogout = lazy(() => import('./pages/CaptainLogout'))
const Riding = lazy(() => import('./pages/Riding'))
const CaptainRiding = lazy(() => import('./pages/CaptainRiding'))
const UserRides = lazy(() => import('./pages/UserRides'))
const UserAccount = lazy(() => import('./pages/UserAccount'))
const UserPayment = lazy(() => import('./pages/UserPayment'))
const UserHelp = lazy(() => import('./pages/UserHelp'))
const UserSafety = lazy(() => import('./pages/UserSafety'))
const UserOffers = lazy(() => import('./pages/UserOffers'))
const CaptainAccount = lazy(() => import('./pages/CaptainAccount'))
const CaptainEarnings = lazy(() => import('./pages/CaptainEarnings'))
const CaptainHistory = lazy(() => import('./pages/CaptainHistory'))
const CaptainHelp = lazy(() => import('./pages/CaptainHelp'))

// KYC Flow (captain)
const KycLanding = lazy(() => import('./pages/captain-kyc/KycLanding'))
const KycStep1 = lazy(() => import('./pages/captain-kyc/KycStep1'))
const KycStep2 = lazy(() => import('./pages/captain-kyc/KycStep2'))
const KycStep3 = lazy(() => import('./pages/captain-kyc/KycStep3'))
const KycStep4 = lazy(() => import('./pages/captain-kyc/KycStep4'))
const KycPending = lazy(() => import('./pages/captain-kyc/KycPending'))

// Admin Panel
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.default })))
const AdminLayout = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminLayout })))
const KycList = lazy(() => import('./pages/admin/KycList'))
const KycDetail = lazy(() => import('./pages/admin/KycDetail'))
const AdminCaptains = lazy(() => import('./pages/admin/AdminCaptains'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminWallet = lazy(() => import('./pages/admin/AdminWallet'))
const AdminPromos = lazy(() => import('./pages/admin/AdminPromos'))
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'))
const AdminSiteConfig = lazy(() => import('./pages/admin/AdminSiteConfig'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'))

const App = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path='/' element={<Start />} />
        <Route path='/login' element={<UserLogin />} />
        <Route path='/signup' element={<UserSignup />} />
        <Route path='/captain-login' element={<Captainlogin />} />

        {/* Active ride screens — no auth wrapper (state passed via navigate) */}
        <Route path='/riding' element={<Riding />} />
        <Route path='/captain-riding' element={<CaptainProtectWrapper><CaptainRiding /></CaptainProtectWrapper>} />

        {/* User (Rider) protected routes */}
        <Route path='/home' element={<UserProtectWrapper><Home /></UserProtectWrapper>} />
        <Route path='/user/logout' element={<UserProtectWrapper><UserLogout /></UserProtectWrapper>} />
        <Route path='/user/rides' element={<UserProtectWrapper><UserRides /></UserProtectWrapper>} />
        <Route path='/user/account' element={<UserProtectWrapper><UserAccount /></UserProtectWrapper>} />
        <Route path='/user/payment' element={<UserProtectWrapper><UserPayment /></UserProtectWrapper>} />
        <Route path='/user/help' element={<UserProtectWrapper><UserHelp /></UserProtectWrapper>} />
        <Route path='/safety' element={<UserProtectWrapper><UserSafety /></UserProtectWrapper>} />
        <Route path='/offers' element={<UserProtectWrapper><UserOffers /></UserProtectWrapper>} />

        {/* Captain (Driver) protected routes */}
        <Route path='/captain-home' element={<CaptainProtectWrapper><CaptainHome /></CaptainProtectWrapper>} />
        <Route path='/captain/logout' element={<CaptainProtectWrapper><CaptainLogout /></CaptainProtectWrapper>} />
        <Route path='/captain/account' element={<CaptainProtectWrapper><CaptainAccount /></CaptainProtectWrapper>} />
        <Route path='/captain/earnings' element={<CaptainProtectWrapper><CaptainEarnings /></CaptainProtectWrapper>} />
        <Route path='/captain/history' element={<CaptainProtectWrapper><CaptainHistory /></CaptainProtectWrapper>} />
        <Route path='/captain/help' element={<CaptainProtectWrapper><CaptainHelp /></CaptainProtectWrapper>} />

        {/* Captain KYC Flow — /captain/kyc is public (registration), steps need auth */}
        <Route path='/captain/kyc' element={<KycLanding />} />
        <Route path='/captain/kyc/step/1' element={<CaptainProtectWrapper><KycStep1 /></CaptainProtectWrapper>} />
        <Route path='/captain/kyc/step/2' element={<CaptainProtectWrapper><KycStep2 /></CaptainProtectWrapper>} />
        <Route path='/captain/kyc/step/3' element={<CaptainProtectWrapper><KycStep3 /></CaptainProtectWrapper>} />
        <Route path='/captain/kyc/step/4' element={<CaptainProtectWrapper><KycStep4 /></CaptainProtectWrapper>} />
        <Route path='/captain/kyc/pending' element={<CaptainProtectWrapper><KycPending /></CaptainProtectWrapper>} />

        {/* Admin Panel */}
        <Route path='/admin/login' element={<AdminLogin />} />
        <Route path='/admin' element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path='kyc' element={<KycList />} />
          <Route path='kyc/:id' element={<KycDetail />} />
          <Route path='captains' element={<AdminCaptains />} />
          <Route path='users' element={<AdminUsers />} />
          <Route path='wallet' element={<AdminWallet />} />
          <Route path='promos' element={<AdminPromos />} />
          <Route path='support' element={<AdminSupport />} />
          <Route path='site-config' element={<AdminSiteConfig />} />
          <Route path='notifications' element={<AdminNotifications />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App