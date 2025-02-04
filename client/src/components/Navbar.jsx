import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import '../styles/Navbar.css';

const Navbar = () => {

  const { currentUser, signInWithGoogle, logout, userRole, setCurrentUser, setUserRole } = useAuth();
  const { setView } = useView();
  // console.log(currentUser);

  /* Reload persistent user auth storage using local storage */
  useEffect(() => {
    // Get stored user if present in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // console.log(user);
      setCurrentUser(user);
      setUserRole(user.role);
    }
    
  }, []);

  const handleAuth = async () => {
    try {
      if (currentUser) {
        setView('home');
        await logout();
        localStorage.removeItem('user');
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };
  
  // console.log("Home")
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src='./logo.jpg' alt="SalaahLink Logo" className="navbar-logo" />
          <h1>SalaahLink</h1>
          {userRole !== 'viewer' && (
            <span className="user-role">{userRole}</span>
          )}
        </div>
        <div className="navbar-auth">
          {currentUser ? (
            <div className="profile-container">
              <img
                src={currentUser.profile_pic}
                alt="Profile"
                className="profile-pic"
              />
              <button className="logout-btn" onClick={handleAuth}>
                Logout
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={handleAuth}>
              Login with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 