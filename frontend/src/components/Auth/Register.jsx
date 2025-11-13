import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Laptop, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { signup, signInWithGoogle, signInWithFacebook, logout } = useAuth();
  const navigate = useNavigate();

  const { name, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user in Firebase
      const userCredential = await signup(email, password, name);
      const firebaseUser = userCredential.user;
      
      // Step 2: Also register in MongoDB backend (WITHOUT password - Firebase handles auth)
      const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+JHtuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpfTwvdGV4dD48L3N2Zz4=`;
      
      try {
        await axios.post('http://localhost:4001/api/v1/register', {
          name,
          email,
          firebaseUid: firebaseUser.uid,
          // No password - Firebase handles authentication
          avatar: defaultAvatar
        });
      } catch (backendError) {
        console.log('Backend registration failed (non-critical):', backendError.message);
        // Don't fail the registration if backend fails
      }
      
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ ...errors, email: 'This email is already in use' });
        toast.error('Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ ...errors, email: 'Invalid email address' });
        toast.error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setErrors({ ...errors, password: 'Password is too weak' });
        toast.error('Password is too weak');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      const result = await signInWithGoogle();
      const firebaseUser = result.user;
      
      console.log('Google user data:', {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        uid: firebaseUser.uid
      });
      
      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      
      // Check if user already exists in backend
      try {
        const checkResponse = await fetch('http://localhost:4001/api/v1/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (checkResponse.ok) {
          // User already exists, just navigate
          toast.success('Signed in with Google successfully!');
          navigate('/');
          return;
        }
      } catch (error) {
        // User doesn't exist, proceed with registration
      }
      
      // Register user in MongoDB
      try {
        const registrationData = {
          name: firebaseUser.displayName || 'Google User',
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RzwvdGV4dD48L3N2Zz4=`
        };
        
        // Add email if available
        if (firebaseUser.email) {
          registrationData.email = firebaseUser.email;
        }
        
        console.log('Sending registration data:', registrationData);
        
        await axios.post('http://localhost:4001/api/v1/register', registrationData);
        toast.success('Registration successful!');
        navigate('/');
      } catch (backendError) {
        console.error('Backend registration failed:', backendError);
        console.error('Error response:', backendError.response?.data);
        toast.error('Failed to complete registration. Please try again.');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed popup, no need to show error
      } else {
        toast.error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading(true);
    try {
      const result = await signInWithFacebook();
      const firebaseUser = result.user;
      
      console.log('Facebook user data:', {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        uid: firebaseUser.uid
      });
      
      // Get Firebase token
      const token = await firebaseUser.getIdToken();
      
      // Check if user already exists in backend
      try {
        const checkResponse = await fetch('http://localhost:4001/api/v1/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (checkResponse.ok) {
          // User already exists, just navigate
          toast.success('Signed in with Facebook successfully!');
          navigate('/');
          return;
        }
      } catch (error) {
        // User doesn't exist, proceed with registration
      }
      
      // Register user in MongoDB
      try {
        const registrationData = {
          name: firebaseUser.displayName || 'Facebook User',
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RjwvdGV4dD48L3N2Zz4=`
        };
        
        // Add email if available
        if (firebaseUser.email) {
          registrationData.email = firebaseUser.email;
        }
        
        console.log('Sending registration data:', registrationData);
        
        await axios.post('http://localhost:4001/api/v1/register', registrationData);
        toast.success('Registration successful!');
        navigate('/');
      } catch (backendError) {
        console.error('Backend registration failed:', backendError);
        console.error('Error response:', backendError.response?.data);
        toast.error('Failed to complete registration. Please try again.');
      }
    } catch (error) {
      console.error('Facebook sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed popup, no need to show error
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with the same email address but different sign-in credentials.');
      } else {
        toast.error('Failed to sign in with Facebook. Please try again.');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div>
          <div className="flex justify-center">
            <Laptop className="w-16 h-16 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join LappyShoppy today
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${errors.name ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                  placeholder="John Doe"
                  value={name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                  placeholder="john@example.com"
                  value={email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                    errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                  value={password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                    errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>
          </div>

          {/* Social Login Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={socialLoading || loading}
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              Google
            </button>
            <button
              type="button"
              onClick={handleFacebookSignIn}
              disabled={socialLoading || loading}
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
            >
              <FaFacebook className="w-5 h-5 mr-2 text-blue-600" />
              Facebook
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
