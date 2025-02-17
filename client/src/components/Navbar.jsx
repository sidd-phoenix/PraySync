import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useView } from "../contexts/ViewContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const { currentUser, logout, userRole, setCurrentUser, setUserRole, signInWithGoogle } = useAuth();
  const { setView } = useView();
  const backend_url = import.meta.env.VITE_BACKEND_URL;

  const hasTokenCookie = () => {
    return document.cookie.split("; ").some((row) => row.startsWith("token="));
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${backend_url}/auth/user`, {
          credentials: "include", // Ensures cookies are sent
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser({
            name: data.name,
            email: data.email,
            profile_pic: data.picture,
          });
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleAuth = async () => {
    try {
      if (currentUser) {
        setView("home");
        await logout();
        window.location.href = "/";
      } else {
        signInWithGoogle();
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="./logo.jpg" alt="SalaahLink Logo" className="navbar-logo" />
          <h1>SalaahLink</h1>
          {userRole && userRole !== "viewer" && (
            <span className="user-role">{userRole}</span>
          )}
        </div>
        <div className="navbar-auth">
          {currentUser ? (
            <div className="profile-container">
              <img src={currentUser.profile_pic} alt="Profile" className="profile-pic" />
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
