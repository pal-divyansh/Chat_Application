import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import './LogoutButton.css';

const LogoutButton = () => {
  const { logout } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    const success = logout();
    if (success) {
      navigate('/login'); // Adjust the route as per your app
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="logout-button"
      title="Logout"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
