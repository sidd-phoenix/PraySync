import { createContext, useContext, useState, useEffect } from 'react';


const AuthContext = createContext();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const backend_url = import.meta.env.VITE_BACKEND_URL

export const useAuth = () => {
    const context = useContext(AuthContext);
    //   console.log(context)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState('manager');
    const [loading, setLoading] = useState(true);

    // Initialize Google OAuth
    useEffect(() => {
        // Load Google OAuth script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                });
            }
            setLoading(false);
        };

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleCredentialResponse = async (response) => {
        try {
            // Send the token to your backend
            const result = await fetch(`${backend_url}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential: response.credential }),
            });

            const data = await result.json();

            if (data.user) {
                setCurrentUser(data.user);

                // Set user data for persistent login even after reload
                // console.log(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUserRole(data.user.role || 'viewer');
            }
        } catch (error) {
            console.error('Authentication error:', error);
        }
    };

    const signInWithGoogle = async () => {
        try {
            if (window.google) {
                // console.log(window.google.accounts.id.prompt())
                window.google.accounts.id.prompt();
            }
        } catch (error) {
            console.error("Error signing in with Google: ", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Call your backend logout endpoint
            await fetch(`${backend_url}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            setCurrentUser(null);
            setUserRole('viewer');
        } catch (error) {
            console.error("Error signing out: ", error);
            throw error;
        }
    };

    // useEffect(() => {
    //     // Check session on load
    //     const checkSession = async () => {
    //         try {
    //             const response = await fetch(`${backend_url}/auth/session`, {
    //                 credentials: 'include',
    //             });
    //             const data = await response.json();

    //             if (data.user) {
    //                 setCurrentUser(data.user);
    //                 setUserRole(data.user.role || 'viewer');
    //             }
    //         } catch (error) {
    //             console.error('Session check error:', error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     checkSession();
    // }, []);

    const value = {
        currentUser,
        userRole,
        signInWithGoogle,
        logout,
        loading,
        setUserRole,
        setCurrentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 