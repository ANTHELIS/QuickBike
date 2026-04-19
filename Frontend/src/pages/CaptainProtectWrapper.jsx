import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import { useNavigate } from 'react-router'
import axios from 'axios'

const CaptainProtectWrapper = ({ children }) => {
    const token = localStorage.getItem('captain_token')
    const navigate = useNavigate()
    const { captain, setCaptain } = useContext(CaptainDataContext)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!token) {
            navigate('/captain-login')
            return
        }

        // Skip re-fetch if captain is in memory AND has a valid (non-'none') kycStatus
        // This prevents the stale kycStatus:'none' from misleading the KYC gate
        const needsFresh = !captain || captain.kycStatus === 'none'
        if (!needsFresh) {
            setIsLoading(false)
            return
        }

        axios.get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
            if (response.status === 200) {
                setCaptain(response.data.captain)
                setIsLoading(false)
            }
        }).catch(err => {
            console.warn('[CaptainProtect] Auth failed:', err.message)
            localStorage.removeItem('captain_token')
            navigate('/captain-login')
        })
    }, [token])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#fff8f5]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#A85300] to-[#F5820D] flex items-center justify-center shadow-lg">
                        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                            <path d="M18 3L30 12V27L18 33L6 27V12L18 3Z" fill="white" fillOpacity="0.3" />
                            <path d="M18 10L24 14V22L18 26L12 22V14L18 10Z" fill="white" />
                        </svg>
                    </div>
                    <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-gray-400">Captain Mode</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export default CaptainProtectWrapper