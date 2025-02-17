import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useView } from '../contexts/ViewContext';
import '../styles/Navbar.css';

const Navbar = () => {

  const { currentUser, logout, userRole, setCurrentUser, setUserRole, signInWithGoogle } = useAuth();
  const { setView } = useView();
  const backend_url = import.meta.env.VITE_BACKEND_URL
  // console.log(currentUser);

  /* 
  Initiate Google
  Reload persistent user auth storage using local storage 
  */

  useEffect(() => {
    // Get stored user if present in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // console.log(user);
      setCurrentUser(user);
      setUserRole(user.role);
    }

    handleCredentialResponse();
  }, []);

  const handleCredentialResponse = async () => {
    // Extract the code from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    // console.log(code)

    if (code) {
      try {
        // Send the code to your backend to exchange for tokens
        const result = await fetch(`${backend_url}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }), // Send the code to the backend
        });

        const data = await result.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          setUserRole(data.user.role || 'viewer');
        }
        window.location.href = '/';
      } catch (error) {
        console.error('Error during token exchange:', error);
      }
    }
  };

  const handleAuth = async () => {
    try {
      if (currentUser) {
        setView('home');
        await logout();
        localStorage.removeItem('user');
      } else {
        signInWithGoogle();
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