import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'

export const UserLogout = () => {

    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        axios.post(`${import.meta.env.VITE_BASE_URL}/users/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            if (response.status === 200) {
                localStorage.removeItem('token')
                navigate('/login')
            }
        }).catch(() => {
            localStorage.removeItem('token')
            navigate('/login')
        })
    }, [])

    return (
        <div>Logging out...</div>
    )
}

export default UserLogout
