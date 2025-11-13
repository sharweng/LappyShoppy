import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth } from '../firebase.config';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Firebase signup
  const signup = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Firebase login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Request email and profile scopes
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);
      // Don't show toast here - let the calling component handle it
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  // Facebook Sign In
  const signInWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      // Request email and public profile scopes
      provider.addScope('email');
      provider.addScope('public_profile');
      const result = await signInWithPopup(auth, provider);
      // Don't show toast here - let the calling component handle it
      return result;
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  };

  // Firebase logout
  const logout = async (showToast = true) => {
    try {
      await signOut(auth);
      setUserProfile(null);
      localStorage.removeItem('token');
      if (showToast) {
        toast.success('Logged out successfully');
      }
    } catch (error) {
      if (showToast) {
        toast.error('Error logging out');
      }
      throw error;
    }
  };

  // Update user password in Firebase
  const updateUserPassword = async (newPassword) => {
    try {
      await firebaseUpdatePassword(currentUser, newPassword);
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error('Error updating password');
      throw error;
    }
  };

  // Get user profile from backend
  const getUserProfile = async (token) => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const { data } = await axios.get('http://localhost:4001/api/v1/me', config);
      setUserProfile(data.user);
      return data.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Update user profile
  const updateUserProfile = async (userData, token) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      const { data } = await axios.put(
        'http://localhost:4001/api/v1/me/update',
        userData,
        config
      );
      setUserProfile(data.user);
      toast.success('Profile updated successfully');
      return data.user;
    } catch (error) {
      toast.error('Error updating profile');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    updateUserPassword,
    getUserProfile,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
