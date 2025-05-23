import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppContextProvider, { useAppContext } from './context/AppContext';
import Chat from './pages/Chat/Chat';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import ProfileUpdate from './pages/Profile_update/Profile_update';

// Loading component with better UI
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Protected Route component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAppContext();
  
  if (loading) {
    return <Loading />;
  }
  
  return user?._id ? children : <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
};

// Public Route component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAppContext();
  
  if (loading) {
    return <Loading />;
  }
  
  return !user?._id ? children : <Navigate to="/chat" replace />;
};

// Main App component
const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      
      {/* Redirect root to appropriate page */}
      <Route
        path="/"
        element={
          <Navigate to={
            localStorage.getItem('token') ? 
            "/chat" : 
            "/login"
          } replace />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfileUpdate />
          </PrivateRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;