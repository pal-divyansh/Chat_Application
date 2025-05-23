import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import './ChatBox.css';

const ChatBox = () => {
  const { chatId } = useParams();
  const { user, selectedChat, sendMessage } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Mock messages for the selected chat
  useEffect(() => {
    if (!selectedChat) return;
    
    // Simulate loading messages for the selected chat
    const mockMessages = [
      {
        _id: '1',
        sender: selectedChat.participants[0],
        content: 'Hey there! How are you?',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        _id: '2',
        sender: { _id: user._id, username: user.username, avatar: user.avatar },
        content: "I'm doing great, thanks! How about you?",
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        _id: '3',
        sender: selectedChat.participants[0],
        content: 'Pretty good! Just working on some projects.',
        createdAt: new Date().toISOString()
      }
    ];

    setMessages(mockMessages);
  }, [selectedChat, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      _id: Date.now().toString(),
      sender: { _id: user._id, username: user.username, avatar: user.avatar },
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      isSending: true
    };

    // Optimistically update UI
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  if (!selectedChat) {
    return (
      <div className="chat-box empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-box">
      {/* Chat header */}
      <div className="chat-header">
        <div className="user-info">
          <div className="avatar">
            <img 
              src={selectedChat.participants[0]?.avatar} 
              alt={selectedChat.participants[0]?.username || 'User'}
            />
          </div>
          <div className="user-details">
            <h3>{selectedChat.participants[0]?.username || 'Unknown User'}</h3>
            <p className="status">
              {selectedChat.participants[0]?.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        <div className="messages">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
            >
              {message.sender._id !== user._id && (
                <img 
                  src={message.sender.avatar} 
                  alt={message.sender.username} 
                  className="message-avatar"
                />
              )}
              <div className="message-content">
                <p>{message.content}</p>
                <span className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <form className="message-input-container" onSubmit={handleSendMessage}>
        <button type="button" className="emoji-button">
          😊
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
        />
        <button type="button" className="media-button">
          📎
        </button>
        <button type="submit" className="send-button" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
