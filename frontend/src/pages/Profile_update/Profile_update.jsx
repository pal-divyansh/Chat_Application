import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import './Profile_update.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile_update = () => {
    const navigate = useNavigate();
    const { userData, setUserData } = useContext(AppContext);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Initialize form with user data
    useEffect(() => {
        if (userData) {
            setName(userData.username || '');
            setBio(userData.bio || '');
            setAvatar(userData.avatar || '');
        }
    }, [userData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userData?._id) {
            toast.error('User not authenticated');
            return;
        }
        
        setIsLoading(true);
        
        try {
            const response = await axios.put('http://localhost:5000/api/users/profile', {
                username: name,
                bio: bio,
                profilePicture: avatar
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            setUserData({
                ...userData,
                username: name,
                bio: bio,
                avatar: avatar
            });
            
            toast.success('Profile updated successfully!');
            navigate('/chat');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Error updating profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="profile-update">
            <div className="profile-container">
                <h2>Update Profile</h2>
                <div className="avatar-upload">
                    <div 
                        className="profile-avatar clickable-avatar" 
                        onClick={handleAvatarClick}
                    >
                        {avatar ? (
                            <img src={avatar} alt="Profile" className="avatar-image" />
                        ) : (
                            <div className="avatar-placeholder">
                                {name ? name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <p>Click to change photo</p>
                </div>
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows="3"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="update-button">
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile_update;
