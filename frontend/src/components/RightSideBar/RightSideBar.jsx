import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import './RightSideBar.css';
import { FiUser, FiLogOut } from 'react-icons/fi';
import Avatar from '../Avatar/Avatar';

const RightSideBar = () => {
    const { userData, handleLogout } = useContext(AppContext);
    const [username, setUsername] = useState('Loading...');
    const navigate = useNavigate();

    // Update username when userData changes
    useEffect(() => {
        if (userData?.username) {
            setUsername(userData.username);
        } else {
            // Try to get username from localStorage as fallback
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser.username) {
                        setUsername(parsedUser.username);
                    }
                } catch (e) {
                    console.error('Error parsing stored user data:', e);
                }
            }
        }
    }, [userData]);

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <div className="right-sidebar">
            <div className="profile-section">
                <div className="user-profile" onClick={handleProfileClick}>
                    <div className="profile-avatar">
                        <Avatar 
                            src={userData?.avatar} 
                            name={username} 
                            size={40} 
                            round={true}
                        />
                    </div>
                    <div className="profile-info">
                        <h4 className="username-display">{username}</h4>
                        <p>View Profile</p>
                    </div>
                    <FiUser className="profile-icon" />
                </div>
            </div>
            
            <button onClick={handleLogout} className="logout-button">
                <FiLogOut /> Logout
            </button>
        </div>
    );
};

export default RightSideBar;