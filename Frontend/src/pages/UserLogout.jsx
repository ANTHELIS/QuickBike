import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'

const UserLogout = () => {
    const token = localStorage.getItem('user_token')
    const navigate = useNavigate()

    useEffect(() => {
        axios.post(`${import.meta.env.VITE_BASE_URL}/users/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            localStorage.removeItem('user_token')
            navigate('/login')
        })
        .catch(() => {
            localStorage.removeItem('user_token')
            navigate('/login')
        })
    }, [])

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#fff8f5]">
            <div className="flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#A85300] to-[#F5820D] flex items-center justify-center shadow-xl">
                    <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
                        <path d="M18 3L30 12V27L18 33L6 27V12L18 3Z" fill="white" fillOpacity="0.3"/>
                        <path d="M18 10L24 14V22L18 26L12 22V14L18 10Z" fill="white"/>
                    </svg>
                </div>
                <div className="w-7 h-7 border-[3px] border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400">Signed out...</p>
            </div>
        </div>
    )
}

export default UserLogout
