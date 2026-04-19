import React from 'react'
import { Route, Routes } from 'react-router'
import Start from './pages/Start'
import UserLogin from './pages/UserLogin'
import UserSignup from './pages/UserSignup'
import Captainlogin from './pages/Captainlogin'
import Home from './pages/Home'
import UserProtectWrapper from './pages/UserProtectWrapper'
import UserLogout from './pages/UserLogout'
import CaptainHome from './pages/CaptainHome'
import CaptainProtectWrapper from './pages/CaptainProtectWrapper'
import CaptainLogout from './pages/CaptainLogout'
import Riding from './pages/Riding'
import CaptainRiding from './pages/CaptainRiding'
import UserRides from './pages/UserRides'
import UserAccount from './pages/UserAccount'
import UserPayment from './pages/UserPayment'
import UserHelp from './pages/UserHelp'
import UserSafety from './pages/UserSafety'
import UserOffers from './pages/UserOffers'
import CaptainAccount from './pages/CaptainAccount'
import CaptainEarnings from './pages/CaptainEarnings'
import CaptainHistory from './pages/CaptainHistory'
import CaptainHelp from './pages/CaptainHelp'

// KYC Flow (captain)
import KycLanding from './pages/captain-kyc/KycLanding'
import KycStep1 from './pages/captain-kyc/KycStep1'
import KycStep2 from './pages/captain-kyc/KycStep2'
import KycStep3 from './pages/captain-kyc/KycStep3'
import KycStep4 from './pages/captain-kyc/KycStep4'
import KycPending from './pages/captain-kyc/KycPending'

// Admin Panel
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard, { AdminLayout } from './pages/admin/AdminDashboard'
import KycList from './pages/admin/KycList'
import KycDetail from './pages/admin/KycDetail'
import AdminCaptains from './pages/admin/AdminCaptains'
import AdminUsers from './pages/admin/AdminUsers'
import AdminWallet from './pages/admin/AdminWallet'
import AdminPromos from './pages/admin/AdminPromos'
import AdminSupport from './pages/admin/AdminSupport'

const App = () => {
  return (
    <div>
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
        </Route>
      </Routes>
    </div>
  )
}

export default App