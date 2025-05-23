import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    avatar: null,
    _id: null,
    online: false,
    lastSeen: null
  });
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize auth and socket
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        console.log('Initialization - Token exists:', !!token);
        console.log('Initialization - Saved user exists:', !!savedUser);
        
        if (token && savedUser) {
          // Set auth header for all axios requests BEFORE making any requests
          axios.defaults.headers.common['Authorization'] = token; // Token should already have "Bearer "
          console.log('Set axios auth header:', axios.defaults.headers.common['Authorization']);
          
          try {
            // Verify token and get fresh user data
            console.log('Attempting to verify token...');
            // Use relative URL now that base URL is set
            const response = await axios.get('http://localhost:5002/api/auth/verify');
            
            console.log('Verify response:', response.data);
            
            if (!response.data?.success || !response.data?.user) {
              throw new Error('Invalid verification response');
            }
            
            const user = response.data.user;
            const userId = user.id || user._id;
            
            if (!userId) {
              throw new Error('User ID is missing in the response');
            }
            
            setUserData({
              _id: userId,
              id: userId,
              username: user.username,
              email: user.email,
              avatar: user.avatar || null,
              online: user.online || false,
              lastSeen: user.lastSeen || new Date().toISOString()
            });

            // Initialize socket connection
            if (!socket) {
              const newSocket = io('http://localhost:5002', {
                withCredentials: true,
                extraHeaders: {
                  'Authorization': token // Token should already have "Bearer "
                },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000
              });

              newSocket.on('connect', () => {
                if (userId) {
                  newSocket.emit('authenticate', { userId });
                }
              });

              newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                toast.error('Connection error. Please try again.');
              });

              setSocket(newSocket);
            }

            // Load conversations
            // Use relative URL now that base URL is set
            const convResponse = await axios.get('http://localhost:5002/api/messages/conversations');
            if (convResponse.data?.success) {
              setConversations(convResponse.data.data || []);
            }
          } catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            // If token verification fails, clear everything and redirect to login
            handleLogout();
            return;
          }
        } else {
          // No token or user data found, redirect to login
          handleLogout();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError(error.message);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const handleLogout = () => {
    console.log('Starting logout process...');
    setUserData({
      username: '',
      email: '',
      avatar: null,
      _id: null,
      online: false,
      lastSeen: null
    });
    
    setMessages([]);
    setSelectedChat(null);
    setConversations([]);
    
    console.log('Clearing local storage...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('Removing axios auth header...');
    delete axios.defaults.headers.common['Authorization'];
    
    if (socket) {
      console.log('Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      console.log('Socket disconnected.');
    }
    
    console.log('Navigating to login...');
    navigate('/login');
    console.log('Logout process finished.');
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      
      // Use relative URL now that base URL is set
      const response = await axios.post(
        'http://localhost:5002/api/auth/login',
        { email, password }
      );
      
      console.log('Login response:', response.data);
      
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response from server');
      }
      
      const { token, user } = response.data;
      
      // Ensure token is in correct format
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log('Formatted token for storage:', formattedToken);
      
      // Store token and user data
      localStorage.setItem('token', formattedToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = formattedToken;
      console.log('Set axios auth header after login:', axios.defaults.headers.common['Authorization']);
      
      const userId = user.id || user._id;
      if (!userId) {
        throw new Error('User ID is missing in the response');
      }
      
      setUserData({
        _id: userId,
        id: userId,
        username: user.username,
        email: user.email,
        avatar: user.avatar || null,
        online: user.online || false,
        lastSeen: user.lastSeen || new Date().toISOString()
      });

      // Navigate to chat page after successful login
      navigate('/chat');
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error response:', error.response?.data);
      setError(error.response?.data?.message || 'Login failed');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use relative URL now that base URL is set
      const response = await axios.post(
        'http://localhost:5002/api/auth/register',
        { username, email, password }
      );
      
      if (!response.data?.success) {
        throw new Error('Signup failed');
      }

      // Show a success message
      toast.success('Signup successful! Please log in.');
      // Redirect to login page
      navigate('/login');
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.response?.data?.message || 'Signup failed');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Signup failed'
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user: userData,
        socket,
        messages,
        selectedChat,
        loading,
        conversations,
        error,
        setError,
        setMessages,
        setSelectedChat,
        setConversations,
        login,
        signup,
        handleLogout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

export default AppContextProvider;