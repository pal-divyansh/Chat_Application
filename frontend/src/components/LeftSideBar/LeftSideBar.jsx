import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { FiSearch, FiMessageSquare } from 'react-icons/fi';
import Avatar from '../Avatar/Avatar';
import axios from 'axios';
import './LeftSideBar.css';

const LeftSideBar = () => {
  const { user: contextUser, setSelectedChat, loading: appLoading } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([
    {
      _id: 'fake-user-1',
      username: 'Alice Smith',
      email: 'alice.smith@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
      online: true,
      lastSeen: new Date().toISOString(),
      bio: 'Hello, I am Alice.'
    },
    {
      _id: 'fake-user-2',
      username: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      avatar: 'https://i.pravatar.cc/150?img=7',
      online: false,
      lastSeen: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
      bio: 'Bob here.'
    },
    {
      _id: 'fake-user-3',
      username: 'Charlie Brown',
      email: 'charlie.b@example.com',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('Charlie Brown')}&background=random`,
      online: true,
      lastSeen: new Date().toISOString(),
      bio: 'Charlie is online.'
    },
    {
      _id: 'fake-user-4',
      username: 'Diana Prince',
      email: 'diana.p@example.com',
      avatar: 'https://i.pravatar.cc/150?img=10',
      online: false,
      lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      bio: 'Just an ordinary person.'
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ), [users, searchQuery]
  );

  const handleSelectUser = (user) => {
    setSelectedChat({
      _id: user._id,
      participants: [user],
      lastMessage: {
        content: user.online ? 'Online' : 'Offline',
        sender: user._id,
        createdAt: user.lastSeen || new Date().toISOString()
      }
    });
    navigate(`/chat/${user._id}`);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderUserProfile = () => (
    !appLoading && contextUser ? (
      <div className="user-profile">
        <div className="user-avatar">
          <Avatar
            src={contextUser?.avatar}
            name={contextUser?.username || 'User'}
            size="medium"
          />
        </div>
        <div className="user-info">
          <h3 className="username">{contextUser?.username || 'User'}</h3>
          <p className="user-email">{contextUser?.email || ''}</p>
          <span className={`status ${contextUser?.online ? 'online' : ''}`}>
            {contextUser?.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    ) : (
      <div className="user-profile">
        <div className="user-avatar">
          <Avatar name="Loading..." size="medium" />
        </div>
        <div className="user-info">
          <h3 className="username">Loading...</h3>
          <p className="user-email"></p>
          <span className="status"></span>
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="left-sidebar">
        <div className="sidebar-loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="left-sidebar">
      {renderUserProfile()}

      <div className="sidebar-header">
        <h2>Users</h2>
      </div>

      <div className="search-container">
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="conversations-list">
        {error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-conversations">
            <FiMessageSquare className="empty-icon" />
            <p>No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="conversation-item"
              onClick={() => handleSelectUser(user)}
            >
              <div className="conversation-avatar">
                <div className={`avatar-wrapper ${user.online ? 'online' : ''}`}>
                  <Avatar 
                    src={user.avatar}
                    name={user.username}
                    size={48}
                    round={true}
                  />
                </div>
              </div>
              <div className="conversation-details">
                <div className="conversation-header">
                  <h4>{user.username}</h4>
                  <span className="conversation-time">
                    {user.online ? 'Online' : formatTime(user.lastSeen)}
                  </span>
                </div>
                <p className="conversation-preview">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
