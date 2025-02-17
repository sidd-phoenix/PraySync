import { createContext, useContext, useState} from 'react';

const AuthContext = createContext();

const backend_url = import.meta.env.VITE_BACKEND_URL

export const useAuth = () => {
    const context = useContext(AuthContext);
    //   console.log(context)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const signInWithGoogle = async () => {
    const response = await fetch(`${backend_url}/auth/googleAuthUrl`);
    const data = await response.json();
    // console.log(data)
    // Redirect to the Google sign-in page
    window.location.href = `${data.redirectUrl}`;
};


export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState('viewer');


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

    const value = {
        currentUser,
        userRole,
        logout,
        setUserRole,
        setCurrentUser,
        signInWithGoogle
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 