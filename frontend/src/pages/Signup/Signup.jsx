// frontend/src/pages/Signup/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { signup } = useAppContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;
    
    // Check for empty fields
    if (!username || !email || !password || !confirmPassword) {
      return 'All fields are required';
    }
  
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
  
    // Validate password length
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
  
    // Check if passwords match
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
  
    return null; // No errors
  };
  
  // In Signup.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (formData.password !== formData.confirmPassword) {
    return setError('Passwords do not match');
  }

  try {
    const { username, email, password } = formData;
    console.log('Attempting signup with:', { username, email });
    
    const result = await signup(username, email, password);
    console.log('Signup result:', result);
    
    if (result && result.success) {
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in.' },
        replace: true
      });
    } else {
      setError(result?.message || 'Registration failed. Please try again.');
    }
  } catch (err) {
    console.error('Signup error:', err);
    setError('An error occurred during registration. Please try again.');
  }
};

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              maxLength="30"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <button type="submit" className="btn-primary">
            Sign Up
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;