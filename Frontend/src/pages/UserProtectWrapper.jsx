import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router'
import axios from 'axios'

const UserProtectWrapper = ({ children }) => {
    const token = localStorage.getItem('user_token')
    const navigate = useNavigate()
    const { user, setUser } = useContext(UserDataContext)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        // Optimization: If user is already in memory, avoid fetching profile again.
        if (user) {
            setIsLoading(false)
            return
        }

        axios.get(`${import.meta.env.VITE_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
            if (response.status === 200) {
                setUser(response.data.user || response.data)
                setIsLoading(false)
            }
        }).catch(err => {
            console.warn('[UserProtect] Auth failed:', err.message)
            localStorage.removeItem('user_token')
            navigate('/login')
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
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export default UserProtectWrapper