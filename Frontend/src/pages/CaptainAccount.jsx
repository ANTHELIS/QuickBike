import React, { useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'
import CaptainDesktopSidebar from '../components/CaptainDesktopSidebar'
import { useCaptainSettings } from '../context/CaptainSettingsContext'
import { useTranslation } from 'react-i18next'
import { useSiteConfig } from '../context/SiteConfigContext'
import NotificationDropdown from '../components/NotificationDropdown'

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('captain_token')}` })

const CaptainAccount = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { captain, setCaptain } = useContext(CaptainDataContext)
  const { darkMode, toggleDark, language, setLanguage, currentLang, LANGUAGES } = useCaptainSettings()
  const { getBanner } = useSiteConfig() // triggers CSS injection
  const [showLangModal, setShowLangModal] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ firstname: '', lastname: '' })
  const [editLoading, setEditLoading] = useState(false)

  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ model: '', color: '', plate: '' })
  const [vehicleEditLoading, setVehicleEditLoading] = useState(false)

  // Ã¢â€â‚¬Ã¢â€â‚¬ Image upload states Ã¢â€â‚¬Ã¢â€â‚¬
  const [uploadingProfile, setUploadingProfile] = useState(false)
  const [uploadingVehicle, setUploadingVehicle] = useState(false)

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('profilePicture', file)
    setUploadingProfile(true)
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/captains/profile/picture`,
        formData,
        { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
      )
      setCaptain(res.data.captain)
    } catch (err) {
      console.warn('Profile pic upload failed:', err)
      alert('Failed to upload profile picture.')
    } finally {
      setUploadingProfile(false)
    }
  }

  const handleVehicleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('vehicleImage', file)
    setUploadingVehicle(true)
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/captains/vehicle/image`,
        formData,
        { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
      )
      setCaptain(res.data.captain)
    } catch (err) {
      console.warn('Vehicle image upload failed:', err)
      alert('Failed to upload vehicle image.')
    } finally {
      setUploadingVehicle(false)
    }
  }

  const openEditModal = () => {
    setEditForm({
      firstname: captain?.fullname?.firstname || '',
      lastname: captain?.fullname?.lastname || ''
    })
    setShowEditModal(true)
  }

  const openVehicleModal = () => {
    setVehicleForm({
      model: captain?.vehicle?.model || '',
      color: captain?.vehicle?.color || '',
      plate: captain?.vehicle?.plate || '',
    })
    setShowVehicleModal(true)
  }

  const handleVehicleEditSubmit = async (e) => {
    e.preventDefault()
    setVehicleEditLoading(true)
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/captains/profile`,
        { vehicleModel: vehicleForm.model, vehicleColor: vehicleForm.color, vehiclePlate: vehicleForm.plate },
        { headers: authHeader() }
      )
      setCaptain(res.data)
      setShowVehicleModal(false)
    } catch (err) {
      console.warn('Failed to update vehicle:', err)
      alert('Failed to update vehicle details')
    } finally {
      setVehicleEditLoading(false)
    }
  }

  const isOnline = captain?.status === 'active'

  const toggleStatus = useCallback(async () => {
    const newStatus = isOnline ? 'inactive' : 'active'
    setStatusLoading(true)
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/captains/status`,
        { status: newStatus },
        { headers: authHeader() }
      )
      // Update local context so UI reflects immediately
      setCaptain(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.warn('Status toggle failed:', err.message)
    } finally {
      setStatusLoading(false)
    }
  }, [isOnline, setCaptain])

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/captains/profile`,
        { firstname: editForm.firstname, lastname: editForm.lastname },
        { headers: authHeader() }
      )
      setCaptain(res.data)
      setShowEditModal(false)
    } catch (err) {
      console.warn('Failed to update profile:', err)
      alert('Failed to update profile')
    } finally {
      setEditLoading(false)
    }
  }

  if (!captain) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f4]">
        <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  const vehicleName = captain.vehicle?.vehicleType === 'moto' ? 'Motorcycle' : captain.vehicle?.vehicleType === 'auto' ? 'Auto Rickshaw' : 'Sedan Car'
  const kycStatus = captain?.kycStatus || 'none'
  const kycApproved = kycStatus === 'approved'
  const memberSince = captain?.createdAt ? new Date(captain.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'

  return (
    <div className="text-slate-900 font-['Inter'] relative w-full max-w-full" style={{overflowX:'hidden'}}>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ DESKTOP LAYOUT Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="hidden md:flex bg-[#f2f2f4] dark:bg-[#0a0a0c] h-[100dvh] overflow-hidden flex-row transition-colors">
        <CaptainDesktopSidebar />
        <main className="flex-1 h-[100dvh] flex flex-col overflow-y-auto relative px-12 py-8 hide-scrollbar">
          <div className="w-full max-w-5xl mx-auto flex flex-col hide-scrollbar relative">
            
            <header className="mb-8 pt-6 md:pt-0 px-6 md:px-0 relative flex flex-col items-start gap-4 md:flex-row md:items-end justify-between transition-colors">
               <div className="flex-1 w-full">
                  <div className="flex items-center justify-between xl:justify-start w-full mb-6 lg:mb-8 border-b border-gray-200 dark:border-[#2b2d31] pb-4 transition-colors">
                     <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">{t('account.management')}</p>
                     <div className="flex items-center gap-4 xl:absolute xl:right-0 xl:top-0">
                        <NotificationDropdown userType="captain" />
                        <i className="fa-solid fa-circle-user text-gray-600 dark:text-gray-400 text-xl hover:text-[#1a1c1e] dark:hover:text-gray-200 cursor-pointer transition-colors" />
                     </div>
                  </div>
                  <h1 className="text-4xl md:text-[48px] lg:text-[56px] font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-tight mb-3 transition-colors">{t('account.profileSettings')}</h1>
                  <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed transition-colors">{t('account.profileDescription')}</p>
               </div>
            </header>

            <div className="px-6 md:px-0 flex flex-col gap-6 mb-6">
               <div className="flex flex-col lg:flex-row gap-6">
                   <div className="bg-white dark:bg-[#161719] rounded-[32px] p-6 md:p-8 shadow-sm border border-transparent dark:border-[#2b2d31] flex-1 relative overflow-hidden group transition-colors">
                      <div className="absolute top-1/2 left-1/2 md:left-2/3 -translate-y-1/2 -translate-x-1/4 md:-translate-x-0 text-[140px] md:text-[180px] font-black text-gray-50 dark:text-[#1f2125] pointer-events-none select-none tracking-tighter mix-blend-multiply opacity-50 transition-colors">
                         {captain.fullname?.firstname?.[0]}{captain.fullname?.lastname?.[0]}
                      </div>
                      <button onClick={openEditModal} className="absolute top-6 md:top-8 right-6 md:right-8 w-10 h-10 bg-[#f9f9fc] dark:bg-[#1f2125] rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 border border-transparent dark:border-[#2b2d31] hover:bg-gray-200 dark:hover:bg-[#3f4147] transition-colors z-20" title="Edit Name">
                        <i className="fa-solid fa-pen" />
                      </button>
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 w-full text-center sm:text-left transition-colors">
                         <div className="relative shrink-0">
                           <div className="w-28 h-28 md:w-32 md:h-32 rounded-[24px] bg-slate-200 dark:bg-slate-800 border border-gray-200 dark:border-[#2b2d31] flex items-center justify-center relative overflow-hidden transition-colors">
                             {captain.profilePicture?.url ? (
                               <img src={captain.profilePicture.url} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                               <i className="fa-solid fa-user text-slate-400 dark:text-slate-600 text-5xl transition-colors" />
                             )}
                             {uploadingProfile && (
                               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                               </div>
                             )}
                           </div>
                           <label className="absolute bottom-2 right-2 w-8 h-8 bg-[#e67e00] hover:bg-[#c66a00] rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-colors z-10" title="Change Photo">
                             {uploadingProfile ? (
                               <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             ) : (
                               <i className="fa-solid fa-camera text-white text-[10px]" />
                             )}
                             <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfilePicUpload} disabled={uploadingProfile} />
                           </label>
                         </div>
                         <div className="flex flex-col items-center sm:items-start w-full pr-0 sm:pr-16 transition-colors">
                            <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-2 sm:mb-1 gap-1">
                               <p className="text-[10px] font-black text-[#e67e00] uppercase tracking-widest bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded sm:px-0 sm:bg-transparent transition-colors">{t('account.eliteCaptain')}</p>
                               <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 transition-colors">{t('account.memberSince', { date: memberSince })}</p>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-[#1a1c1e] dark:text-gray-100 mb-4 sm:mb-6 font-['Manrope'] tracking-tight capitalize w-full truncate transition-colors">{captain.fullname?.firstname} {captain.fullname?.lastname}</h2>
                            <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 md:gap-10 border-t border-gray-100 dark:border-[#2b2d31] pt-5 w-full transition-colors">
                               <div>
                                  <p className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">{t('account.totalTrips')}</p>
                                  <p className="text-lg md:text-xl font-black text-[#1a1c1e] dark:text-gray-100 transition-colors">{captain?.ratings?.count?.toLocaleString() || '0'}</p>
                               </div>
                               <div className="border-l border-r border-gray-100 dark:border-[#2b2d31] px-4 sm:px-6 md:px-10 transition-colors">
                                  <p className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">{t('account.rating')}</p>
                                  <p className="text-lg md:text-xl font-black text-[#1a1c1e] dark:text-gray-100 flex items-center justify-center sm:justify-start gap-1 transition-colors">{captain?.ratings?.average?.toFixed(2) || 'â€”'} <i className="fa-solid fa-star text-[#e67e00] text-[10px]" /></p>
                               </div>
                               <div>
                                  <p className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">{t('account.vehicle')}</p>
                                  <p className="text-lg md:text-xl font-black text-[#1a1c1e] dark:text-gray-100 tracking-tight capitalize transition-colors">{captain?.vehicle?.vehicleType || 'â€”'}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                  <div className="bg-white dark:bg-[#161719] rounded-[32px] p-6 md:p-8 shadow-sm border border-transparent dark:border-[#2b2d31] w-full lg:w-[320px] shrink-0 flex flex-col justify-between group transition-colors">
                     <div>
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-[#904d00] dark:text-[#f8b671] transition-colors">
                              <i className="fa-solid fa-shield-halved" />
                           </div>
                           <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] leading-tight transition-colors">{t('account.verificationStatus')}</h2>
                        </div>
                        <div className="space-y-3 md:space-y-4">
                           <div className="flex justify-between items-center bg-[#f9f9fc] dark:bg-[#1f2125] hover:bg-gray-50 dark:hover:bg-[#2b2d31] transition-colors p-3 rounded-xl border border-transparent dark:border-[#2b2d31] hover:border-gray-100 dark:hover:border-gray-600">
                              <p className="text-xs font-semibold text-[#1a1c1e] dark:text-gray-100 transition-colors">{t('account.kycStatus')}</p>
                              {kycApproved ? <span className="bg-[#ccf2d9] text-[#006b2b] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm transition-colors">{t('account.verified')}</span> : kycStatus === 'pending' ? <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm transition-colors">{t('account.pending')}</span> : <button onClick={() => navigate('/captain/kyc/step/1')} className="bg-red-100 text-red-700 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm cursor-pointer hover:bg-red-200 transition-colors">{kycStatus === 'rejected' ? t('account.reSubmit') : t('account.submitKyc')}</button>}
                           </div>
                           <div className="flex justify-between items-center bg-[#f9f9fc] dark:bg-[#1f2125] hover:bg-gray-50 dark:hover:bg-[#2b2d31] transition-colors p-3 rounded-xl border border-transparent dark:border-[#2b2d31] hover:border-gray-100 dark:hover:border-gray-600">
                              <p className="text-xs font-semibold text-[#1a1c1e] dark:text-gray-100 w-1/2 leading-tight transition-colors">{t('account.identityProof')}</p>
                              {kycApproved ? <span className="bg-[#ccf2d9] text-[#006b2b] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm transition-colors">{t('account.verified')}</span> : <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm transition-colors">{kycStatus === 'pending' ? t('account.inReview') : t('account.pending')}</span>}
                           </div>
                           <div className="flex justify-between items-center bg-[#f9f9fc] dark:bg-[#1f2125] hover:bg-gray-50 dark:hover:bg-[#2b2d31] transition-colors p-3 rounded-xl border border-transparent dark:border-[#2b2d31] hover:border-gray-100 dark:hover:border-gray-600">
                              <p className="text-xs font-semibold text-[#1a1c1e] dark:text-gray-100 w-[60%] leading-tight transition-colors">{t('account.backgroundCheck')}</p>
                              {kycApproved ? <span className="bg-[#ccf2d9] text-[#006b2b] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm transition-colors">{t('account.cleared')}</span> : <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm transition-colors">{kycStatus === 'pending' ? t('account.inReview') : t('account.pending')}</span>}
                           </div>
                        </div>
                     </div>
                     <p className="text-[9px] text-gray-400 italic mt-6 leading-relaxed">
                       {kycApproved ? t('account.kycActiveInfo') : kycStatus === 'pending' ? t('account.kycPendingInfo') : t('account.kycActionInfo')}
                     </p>
                  </div>
               </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="bg-white dark:bg-[#161719] rounded-[32px] p-6 md:p-8 shadow-sm border border-transparent dark:border-[#2b2d31] flex flex-col md:flex-row gap-6 md:gap-8 flex-1 relative group transition-all">
                     <button onClick={openVehicleModal} className="absolute top-6 md:top-8 right-6 md:right-8 w-10 h-10 bg-[#f9f9fc] dark:bg-[#1f2125] rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 border border-transparent dark:border-[#2b2d31] hover:bg-gray-200 dark:hover:bg-[#3f4147] transition-colors z-10">
                        <i className="fa-solid fa-pen" />
                     </button>
                     <div className="flex-1 w-full relative z-0">
                        <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] mb-1 transition-colors">{t('account.vehicleDetails')}</h2>
                        <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-6 md:mb-8 border-b border-gray-100 dark:border-[#2b2d31] pb-5 w-[85%] md:w-3/4 transition-colors">{t('account.vehicleDescription')}</p>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8 w-full transition-colors">
                           <div className="w-40 h-40 md:w-44 md:h-44 rounded-[32px] bg-slate-200 dark:bg-slate-800 border border-gray-200 dark:border-[#2b2d31] flex items-center justify-center p-2 shrink-0 shadow-inner overflow-hidden relative group transition-colors">
                              {captain.vehicle?.image?.url ? (
                                <img src={captain.vehicle.image.url} alt="Vehicle" className="w-full h-full object-cover" />
                              ) : (
                                <i className={`fa-solid ${captain.vehicle?.vehicleType === 'moto' ? 'fa-motorcycle' : captain.vehicle?.vehicleType === 'auto' ? 'fa-van-shuttle' : 'fa-car-side'} text-slate-400 dark:text-slate-600 text-6xl opacity-90 transition-colors z-10`} />
                              )}
                              {uploadingVehicle && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[32px]">
                                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                              )}
                              <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-[32px] cursor-pointer">
                                <i className="fa-solid fa-camera text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl" />
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleVehicleImageUpload} />
                              </label>
                           </div>
                           <div className="flex flex-col justify-center gap-5 sm:gap-6 text-center sm:text-left w-full sm:w-auto transition-colors">
                              <div>
                                 <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 mt-1 transition-colors">{t('account.makeModel')}</p>
                                 <p className="text-base md:text-[18px] font-black text-[#1a1c1e] dark:text-gray-100 leading-tight w-full truncate capitalize transition-colors">{vehicleName} <br /> {captain.vehicle?.vehicleType}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">{t('account.licensePlate')}</p>
                                 <p className="text-sm md:text-base font-black text-[#1a1c1e] dark:text-gray-100 tracking-widest transition-colors">{captain.vehicle?.plate?.toUpperCase() || 'NOT REGISTERED'}</p>
                              </div>
                              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 flex-wrap">
                                 <span className="bg-[#f2f2f4] dark:bg-[#1f2125] text-[#1a1c1e] dark:text-gray-300 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-gray-100 dark:border-[#2b2d31] transition-colors">{t('account.capacity', { capacity: captain.vehicle?.capacity })}</span>
                                 <span className="bg-[#f2f2f4] dark:bg-[#1f2125] text-[#1a1c1e] dark:text-gray-300 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-gray-100 dark:border-[#2b2d31] transition-colors">{captain.vehicle?.color || 'Standard'}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="bg-white dark:bg-[#161719] rounded-[32px] p-6 md:p-8 shadow-sm border border-transparent dark:border-[#2b2d31] w-full lg:w-[320px] shrink-0 flex flex-col justify-between transition-colors">
                      <div>
                         <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] mb-6 transition-colors">{t('account.appSettings')}</h2>
                         <div className="space-y-1 md:space-y-2">
                            <div className="flex justify-between items-center hover:bg-[#f9f9fc] dark:hover:bg-[#1f2125] p-2.5 rounded-xl transition-colors cursor-pointer group" onClick={toggleDark}>
                               <div className="flex flex-row items-center gap-4">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}><i className="fa-solid fa-moon text-xs" /></div>
                                  <div><p className="text-xs md:text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 transition-colors">{t('account.nightMode')}</p><p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 max-w-[120px] transition-colors">{darkMode ? t('account.darkThemeOn') : t('account.lightThemeOn')}</p></div>
                               </div>
                               <button onClick={e => { e.stopPropagation(); toggleDark() }} className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${darkMode ? 'bg-indigo-600 justify-end' : 'bg-gray-200 dark:bg-[#3f4147] justify-start'}`}>
                                 <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-all" />
                               </button>
                            </div>
                            <div className="flex justify-between items-center hover:bg-[#f9f9fc] dark:hover:bg-[#1f2125] p-2.5 rounded-xl transition-colors cursor-pointer group" onClick={() => setShowLangModal(true)}>
                               <div className="flex flex-row items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0 transition-colors"><i className="fa-solid fa-globe text-xs" /></div>
                                  <div><p className="text-xs md:text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 transition-colors">{t('account.language')}</p><p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 transition-colors">{currentLang.label}</p></div>
                               </div>
                               <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 dark:text-gray-600 transition-colors" />
                            </div>
                         </div>
                      </div>
                   </div>
               </div>

               <div className="bg-[#26211e] dark:bg-[#1a1c1e] rounded-[32px] p-6 md:px-10 md:py-8 shadow-xl mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group border border-[#3e342e] dark:border-[#2b2d31] transition-colors">
                  <div className="absolute -left-10 w-full h-full bg-gradient-to-r from-[#171412] dark:from-[#0a0a0c] to-transparent pointer-events-none opacity-80 transition-colors" />
                  <div className="relative z-10 w-full md:w-3/5">
                     <h2 className="text-xl md:text-2xl font-bold text-white font-['Manrope'] mb-2 pt-2 md:pt-0">{t('account.accountContinuity')}</h2>
                     <p className="text-[11px] md:text-[13px] text-gray-400 leading-relaxed font-medium transition-colors">{t('account.deactivateInfo')}</p>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto relative z-10">
                     <button className="flex-1 md:flex-none border border-gray-600/50 hover:bg-gray-800 dark:hover:bg-[#3f4147] hover:border-gray-500 hover:text-white text-gray-300 py-3.5 px-4 md:px-6 rounded-xl text-[11px] md:text-xs font-bold transition-all shadow-sm">{t('account.deactivateBtn')}</button>
                     <button onClick={() => navigate('/captain/logout')} className="flex-1 md:flex-none bg-white dark:bg-[#1f2125] hover:bg-gray-100 dark:hover:bg-[#2b2d31] text-[#1a1c1e] dark:text-gray-100 py-3.5 px-6 md:px-10 rounded-xl text-[11px] md:text-xs font-bold transition-all shadow-md">{t('account.logOutBtn')}</button>
                  </div>
               </div>
            </div>
            <div className="w-full h-12 shrink-0" />
          </div>
        </main>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ MOBILE LAYOUT Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <main className="md:hidden w-full h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#f5f5f7] dark:bg-[#0a0a0c] pb-24 hide-scrollbar transition-colors">

        {/* Mobile Header */}
        <header className="flex items-center justify-between px-5 pt-6 pb-4 sticky top-0 bg-[#f5f5f7]/90 dark:bg-[#0a0a0c]/90 backdrop-blur-md z-40 transition-colors">
          <div className="w-9 h-9 pointer-events-none" />
          <h1 className="text-sm font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-widest uppercase transition-colors">Captain Profile</h1>
          <div onClick={() => navigate('/captain/help')} className="w-9 h-9 rounded-full bg-white dark:bg-[#161719] shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2b2d31] active:scale-95 transition-all">
            <i className="fa-solid fa-headset text-gray-500 dark:text-gray-400 text-sm transition-colors" />
          </div>
        </header>

        {/* Profile Card */}
        <div className="px-4 mb-5">
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col items-center text-center relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-colors" />
            {/* Avatar with upload */}
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-[#161719] shadow-md flex items-center justify-center mb-3 relative shrink-0 transition-colors overflow-hidden">
              {captain.profilePicture?.url ? (
                <img src={captain.profilePicture.url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-user text-slate-400 dark:text-slate-500 text-3xl transition-colors" />
              )}
              {uploadingProfile && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer rounded-full">
                <i className="fa-solid fa-camera text-white opacity-0 hover:opacity-100 transition-opacity text-sm" />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfilePicUpload} />
              </label>
            </div>
            <h2 className="text-xl font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] tracking-tight mt-2 capitalize transition-colors">{captain.fullname?.firstname} {captain.fullname?.lastname}</h2>
            <div className="flex items-center gap-1.5 mt-1 mb-4">
              <i className="fa-solid fa-star text-[#e67e00] text-xs" />
              <span className="text-sm font-bold text-[#1a1c1e] dark:text-gray-100 transition-colors">{captain?.ratings?.average ? captain.ratings.average.toFixed(1) : '—'}</span>
              <span className="text-xs text-gray-400 font-medium">• {captain?.ratings?.count?.toLocaleString() || 0} {t('account.trips', 'Trips')}</span>
            </div>
            <button onClick={openEditModal} className="border border-gray-200 dark:border-[#2b2d31] text-[#1a1c1e] dark:text-gray-100 text-xs font-bold px-6 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-[#2b2d31] transition-colors relative z-10">{t('account.editProfile', 'Edit Profile')}</button>
          </div>
        </div>

        {/* Verification Status */}
        <div className="px-4 mb-5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">{t('account.verificationStatus', 'Verification Status')}</p>
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] transition-colors rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
            <div className="flex justify-around items-start">
              {/* Identity */}
              <div className="flex flex-col items-center gap-2 w-20">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${kycApproved ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <i className={`fa-solid fa-shield-halved text-xl transition-colors ${kycApproved ? 'text-[#e67e00]' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <p className={`text-[9px] font-bold ${kycApproved ? 'text-[#e67e00]' : 'text-gray-400 dark:text-gray-500'} text-center uppercase tracking-wide leading-tight transition-colors`}>{t('account.identity', 'Identity')}<br/>{kycApproved ? t('account.verified', 'Verified') : t('account.pending', 'Pending')}</p>
              </div>
              {/* DL */}
              <div className="flex flex-col items-center gap-2 w-20">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${kycApproved ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <i className={`fa-solid fa-id-card text-xl transition-colors ${kycApproved ? 'text-[#e67e00]' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <p className={`text-[9px] font-bold ${kycApproved ? 'text-[#e67e00]' : 'text-gray-400 dark:text-gray-500'} text-center uppercase tracking-wide leading-tight transition-colors`}>{t('account.dl', 'DL')}<br/>{kycApproved ? t('account.active', 'Active') : t('account.pending', 'Pending')}</p>
              </div>
              {/* Vehicle */}
              <div className="flex flex-col items-center gap-2 w-20">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${kycApproved ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <i className={`fa-solid fa-car text-xl transition-colors ${kycApproved ? 'text-[#e67e00]' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <p className={`text-[9px] font-bold ${kycApproved ? 'text-[#e67e00]' : 'text-gray-400 dark:text-gray-500'} text-center uppercase tracking-wide leading-tight transition-colors`}>{t('account.vehicle', 'Vehicle')}<br/>{kycApproved ? t('account.approved', 'Approved') : t('account.pending', 'Pending')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Vehicle */}
        <div className="px-4 mb-5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">{t('account.primaryVehicle', 'Primary Vehicle')}</p>
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] transition-colors rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none">
            {/* Vehicle Visual with upload */}
            <div className="bg-[#f0f0f3] dark:bg-gray-800 transition-colors flex items-center justify-center h-32 relative group overflow-hidden">
              {captain.vehicle?.image?.url ? (
                <img src={captain.vehicle.image.url} alt="Vehicle" className="w-full h-full object-cover" />
              ) : (
                <i className={`fa-solid ${captain.vehicle?.vehicleType === 'moto' ? 'fa-motorcycle' : captain.vehicle?.vehicleType === 'auto' ? 'fa-van-shuttle' : 'fa-car-side'} text-slate-400 dark:text-slate-600 transition-colors text-6xl`} />
              )}
              {uploadingVehicle && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors cursor-pointer">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <i className="fa-solid fa-camera text-white text-sm" />
                  <span className="text-white text-xs font-bold">{t('account.changePhoto', 'Change Photo')}</span>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleVehicleImageUpload} />
              </label>
            </div>
            {/* Vehicle Details */}
            <div className="p-4 flex justify-between items-start">
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('account.model', 'Model')}</p>
                <p className="text-sm font-black text-[#1a1c1e] dark:text-gray-100 transition-colors capitalize leading-tight">{vehicleName}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('account.licensePlate', 'Plate')}</p>
                <p className="text-sm font-black text-[#1a1c1e] dark:text-gray-100 transition-colors tracking-wider">{captain.vehicle?.plate?.toUpperCase() || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* App Preferences */}
        <div className="px-4 mb-5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">{t('account.appPreferences', 'App Preferences')}</p>
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] transition-colors rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none divide-y divide-gray-50 dark:divide-[#2b2d31] overflow-hidden">
            {/* Push Notifications */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 transition-colors flex items-center justify-center">
                  <i className="fa-solid fa-bell text-gray-600 dark:text-gray-400 transition-colors text-sm" />
                </div>
                <p className="text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 transition-colors">{t('account.pushNotifications', 'Push Notifications')}</p>
              </div>
              <div className="w-11 h-6 bg-[#e67e00] rounded-full flex items-center justify-end px-0.5 cursor-pointer shadow-inner">
                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            {/* Night Mode */}
            <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer" onClick={toggleDark}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${darkMode ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <i className={`fa-solid fa-moon text-sm transition-colors ${darkMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <p className="text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 transition-colors">{t('account.nightMode', 'Night Mode')}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); toggleDark() }} className={`w-12 h-6 rounded-full px-0.5 flex items-center transition-colors shrink-0 ${darkMode ? 'bg-indigo-600 justify-end' : 'bg-gray-200 dark:bg-gray-700 justify-start'}`}>
                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>
            {/* Language */}
            <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2b2d31] transition-colors" onClick={() => setShowLangModal(true)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 transition-colors flex items-center justify-center">
                  <i className="fa-solid fa-globe text-gray-600 dark:text-gray-400 transition-colors text-sm" />
                </div>
                <p className="text-[13px] font-bold text-[#1a1c1e] dark:text-gray-100 transition-colors">{t('account.language', 'Language')}</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-[#e67e00]">{currentLang.label}</p>
                <i className="fa-solid fa-chevron-right text-[10px] text-[#e67e00]" />
              </div>
            </div>
          </div>
        </div>

        {/* Go Offline / Go Online CTA */}
        <div className="px-4 mb-4">
          <button
            onClick={toggleStatus}
            disabled={statusLoading}
            className={`w-full py-4 rounded-[18px] text-base font-black font-['Manrope'] tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg ${
              isOnline
                ? 'bg-[#e67e00] text-white shadow-orange-400/30 hover:bg-[#c66a00]'
                : 'bg-[#1a1c1e] text-white hover:bg-black'
            }`}
          >
            {statusLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className={`w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-white' : 'bg-emerald-400'}`} />
                {isOnline ? t('account.goOffline', 'Go Offline') : t('account.goOnline', 'Go Online')}
              </>
            )}
          </button>
        </div>

        {/* Sign Out */}
        <div className="px-4 mb-2 flex justify-center">
          <button onClick={() => navigate('/captain/logout')} className="flex items-center gap-2 text-gray-500 text-sm font-bold hover:text-[#1a1c1e] transition-colors py-2">
            <i className="fa-solid fa-right-from-bracket text-sm" />
            Sign Out
          </button>
        </div>

      </main>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ LANGUAGE MODAL Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {showLangModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLangModal(false)} />
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] transition-colors w-full max-w-sm rounded-t-[28px] md:rounded-[24px] shadow-2xl relative z-10 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#2b2d31] transition-colors flex justify-between items-center">
              <h3 className="text-lg font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] transition-colors">Choose Language</h3>
              <button onClick={() => setShowLangModal(false)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 transition-colors rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="p-3 pb-8">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowLangModal(false) }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl mb-1 transition-colors ${language === lang.code ? 'bg-orange-50 dark:bg-orange-500/10 text-[#e67e00]' : 'hover:bg-gray-50 dark:hover:bg-[#2b2d31] text-[#1a1c1e] dark:text-gray-100'}`}>
                  <span className="text-[13px] font-bold">{lang.label}</span>
                  {language === lang.code && <i className="fa-solid fa-check text-[#e67e00] text-sm" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ EDIT PROFILE MODAL Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] transition-colors w-full max-w-sm rounded-[24px] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#2b2d31] transition-colors flex justify-between items-center">
              <h3 className="text-lg font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] transition-colors">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 transition-colors rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">First Name</label>
                  <input autoFocus required type="text" value={editForm.firstname} onChange={e => setEditForm({...editForm, firstname: e.target.value})} className="w-full bg-[#f9f9fc] dark:bg-[#0a0a0c] border border-transparent focus:border-[#e67e00] focus:bg-white dark:focus:bg-[#161719] rounded-xl px-4 py-3 text-sm font-bold text-[#1a1c1e] dark:text-gray-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Last Name</label>
                  <input type="text" value={editForm.lastname} onChange={e => setEditForm({...editForm, lastname: e.target.value})} className="w-full bg-[#f9f9fc] dark:bg-[#0a0a0c] border border-transparent focus:border-[#e67e00] focus:bg-white dark:focus:bg-[#161719] rounded-xl px-4 py-3 text-sm font-bold text-[#1a1c1e] dark:text-gray-100 outline-none transition-all" />
                </div>
              </div>
              <button disabled={editLoading} type="submit" className="w-full bg-[#e67e00] hover:bg-[#c66a00] text-white font-bold text-sm py-3.5 rounded-xl mt-6 shadow-md transition-colors disabled:opacity-50">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ EDIT VEHICLE MODAL Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVehicleModal(false)} />
          <div className="bg-white dark:bg-[#161719] border border-transparent dark:border-[#2b2d31] transition-colors w-full max-w-sm rounded-[24px] shadow-2xl relative z-10 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#2b2d31] transition-colors flex justify-between items-center">
              <h3 className="text-lg font-black text-[#1a1c1e] dark:text-gray-100 font-['Manrope'] transition-colors">Edit Vehicle Details</h3>
              <button onClick={() => setShowVehicleModal(false)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 transition-colors rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleVehicleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Vehicle Model</label>
                  <input
                    type="text"
                    value={vehicleForm.model}
                    onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})}
                    placeholder="e.g. Honda Activa, Royal Enfield"
                    className="w-full bg-[#f9f9fc] dark:bg-[#0a0a0c] border border-transparent focus:border-[#e67e00] focus:bg-white dark:focus:bg-[#161719] rounded-xl px-4 py-3 text-sm font-bold text-[#1a1c1e] dark:text-gray-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Vehicle Color</label>
                  <input
                    type="text"
                    value={vehicleForm.color}
                    onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})}
                    placeholder="e.g. Black, Red, White"
                    className="w-full bg-[#f9f9fc] dark:bg-[#0a0a0c] border border-transparent focus:border-[#e67e00] focus:bg-white dark:focus:bg-[#161719] rounded-xl px-4 py-3 text-sm font-bold text-[#1a1c1e] dark:text-gray-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">License Plate</label>
                  <input
                    type="text"
                    value={vehicleForm.plate}
                    onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value.toUpperCase()})}
                    placeholder="e.g. WB6409032"
                    className="w-full bg-[#f9f9fc] dark:bg-[#0a0a0c] border border-transparent focus:border-[#e67e00] focus:bg-white dark:focus:bg-[#161719] rounded-xl px-4 py-3 text-sm font-bold text-[#1a1c1e] dark:text-gray-100 outline-none transition-all tracking-widest uppercase"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">Note: Vehicle type cannot be changed after registration. Contact support if needed.</p>
              <button disabled={vehicleEditLoading} type="submit" className="w-full bg-[#e67e00] hover:bg-[#c66a00] text-white font-bold text-sm py-3.5 rounded-xl mt-6 shadow-md transition-colors disabled:opacity-50">
                {vehicleEditLoading ? 'Saving...' : 'Update Vehicle'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ MOBILE BOTTOM NAV Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#161719] flex justify-around items-center pt-3 pb-5 z-[60] rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.6)] border-t border-gray-50 dark:border-[#2b2d31] transition-colors">
        <div onClick={() => navigate('/captain-home')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-table-cells-large text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navHome')}</p>
        </div>
        <div onClick={() => navigate('/captain/history')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-clock-rotate-left text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navHistory')}</p>
        </div>
        <div onClick={() => navigate('/captain/earnings')} className="flex flex-col items-center gap-1 cursor-pointer w-16 group">
          <i className="fa-solid fa-wallet text-gray-400 group-active:text-[#e67e00] transition-colors text-lg" />
          <p className="text-[9px] font-bold text-gray-400 group-active:text-[#e67e00] transition-colors max-sm:text-[8px]">{t('account.navEarnings')}</p>
        </div>
        <div onClick={() => navigate('/captain/account')} className="flex flex-col items-center gap-1 cursor-pointer w-20">
          <div className="bg-orange-50 dark:bg-orange-500/10 px-4 py-1.5 rounded-full flex flex-col items-center justify-center transition-colors">
             <i className="fa-solid fa-user text-[#e67e00] text-lg" />
          </div>
          <p className="text-[9px] font-bold text-[#e67e00] mt-0.5 max-sm:text-[8px]">{t('account.navAccount')}</p>
        </div>
      </div>

    </div>
  )
}

export default CaptainAccount



